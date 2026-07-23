"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { FunctionsHttpError } from "@supabase/supabase-js";
import { useCartStore } from "@/stores/cartStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  MapPin, 
  Clock, 
  CreditCard, 
  Utensils, 
  Plus, 
  Minus,
  Loader2, 
  ArrowLeft,
  Home,
  Briefcase,
  Trash2,
  Ticket,
  HelpCircle,
  Bike
} from "lucide-react";

// supabase.functions.invoke() wraps every non-2xx response in a generic
// FunctionsHttpError whose .message is always "Edge Function returned a
// non-2xx status code" — the actual reason only exists in the unread
// response body (error.context), so it has to be read out explicitly.
async function getEdgeFunctionErrorMessage(error: unknown, fallback: string): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    try {
      const body = await error.context.json();
      if (typeof body?.error === "string") return body.error;
    } catch {
      // Response body wasn't JSON — fall back to the generic SDK message below.
    }
  }
  return error instanceof Error ? error.message : fallback;
}

// Generate pickup slot options (30 min intervals for next 2 hours)
function getPickupSlots(): { label: string; value: string }[] {
  const slots: { label: string; value: string }[] = [];
  const now = new Date();
  for (const mins of [30, 60, 90, 120]) {
    const t = new Date(now.getTime() + mins * 60 * 1000);
    const label =
      mins < 60
        ? `${mins} min (${t.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })})`
        : `${mins / 60} hr (${t.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })})`;
    slots.push({ label, value: t.toISOString() });
  }
  return slots;
}

export default function CheckoutPage() {
  const router = useRouter();
  const supabase = createClient();
  const { items, cookId, cookName, total, clear, updateQty, removeItem } = useCartStore();

  // State Management
  const [mounted, setMounted] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Checkout Options state
  const pickupSlots = useMemo(() => getPickupSlots(), []);
  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup">("delivery");
  const [deliveryAddressId, setDeliveryAddressId] = useState<string | null>(null);
  const [pickupTime, setPickupTime] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card" | "cash">("card");

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);

    async function loadCheckoutData() {
      try {
        const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
        if (authError || !authUser) {
          router.push("/login");
          return;
        }
        setUser(authUser);
        setLoadingUser(false);

        // Fetch user addresses
        const { data: addrList, error: addrError } = await supabase
          .from("customer_addresses")
          .select("*")
          .eq("user_id", authUser.id)
          .eq("is_deleted", false)
          .order("is_default", { ascending: false });

        if (addrError) throw addrError;
        setAddresses(addrList || []);

        if (addrList && addrList.length > 0) {
          setDeliveryAddressId(addrList[0].id);
        }
      } catch (err: any) {
        console.error("Error loading checkout details:", err);
        toast.error("Failed to load address data");
      } finally {
        setLoadingAddresses(false);
      }
    }

    loadCheckoutData();
  }, [supabase, router]);

  if (!mounted || loadingUser) {
    return (
      <div className="min-h-screen bg-[#FAF8F8] py-12 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-8 text-[#D61A22] animate-spin" />
          <span className="text-xs font-bold text-slate-500">Preparing Checkout...</span>
        </div>
      </div>
    );
  }

  // Cost breakdown
  const subtotal = total();
  const serviceFee = subtotal > 0 ? 25 : 0;
  const tax = subtotal * 0.05;
  const checkoutTotal = subtotal + serviceFee + tax;

  // Determine Veg vs Non-Veg
  const isVegDish = (name: string) => !/(chicken|fish|meat|mutton|beef|egg|pork|shrimp|prawn|crab|lamb|bacon|salami|momo)/i.test(name);

  // Handle placing the order
  const handlePlaceOrder = async () => {
    if (!cookId) {
      toast.error("Cart is invalid or empty");
      return;
    }

    if (deliveryType === "delivery" && !deliveryAddressId) {
      toast.error("Please select a delivery address");
      return;
    }

    if (deliveryType === "pickup" && !pickupTime) {
      toast.error("Please select a pickup time slot");
      return;
    }

    setSubmittingOrder(true);
    let pendingOrderId: string | null = null;
    try {
      // 1. Create order via the create-order edge function (same path the
      // mobile app uses) — validates cook/dish availability, generates the
      // order_number, and creates the Razorpay order (razorpay_order_id).
      const { data: orderData, error: orderError } = await supabase.functions.invoke("create-order", {
        body: {
          cook_id: cookId,
          items: items.map((item) => ({ dish_id: item.dishId, quantity: item.qty })),
          pickup_time: deliveryType === "pickup" ? pickupTime : null,
          delivery_type: deliveryType,
          address_id: deliveryType === "delivery" ? deliveryAddressId : undefined,
        },
      });

      if (orderError) throw new Error(await getEdgeFunctionErrorMessage(orderError, "Failed to create order"));

      const { order, razorpay_order_id: razorpayOrderId } = orderData;
      pendingOrderId = order.id;

      // 2. Complete payment. Web Razorpay Checkout isn't integrated yet, so
      // mirror the DEV_MODE mock flow the mobile app uses (this environment
      // runs with DEV_MODE=true and a placeholder Razorpay key) rather than
      // silently marking a real transaction as paid.
      const razorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
      const isMockPayment = !razorpayKeyId || razorpayKeyId.includes("XXXXX");

      if (!isMockPayment) {
        throw new Error("Online payment is not yet configured for web checkout.");
      }

      const { error: verifyError } = await supabase.functions.invoke("verify-payment", {
        body: {
          razorpay_order_id: razorpayOrderId,
          razorpay_payment_id: `mock_payment_${order.id}`,
          razorpay_signature: "mock_signature",
        },
      });

      if (verifyError) throw new Error(await getEdgeFunctionErrorMessage(verifyError, "Failed to verify payment"));

      toast.success("Order placed successfully!");

      // 3. Clear store & redirect
      clear();
      router.push(`/order/${order.id}/confirm`);
    } catch (err: any) {
      console.error("Order placement error:", err);
      toast.error(err.message || "Failed to place order. Please try again.");
      // Payment didn't complete — remove the pending order rather than leaving
      // an unpayable order stuck in the cook's queue forever.
      if (pendingOrderId) {
        await supabase.from("orders").delete().eq("id", pendingOrderId).then(({ error }) => {
          if (error) console.error(error);
        });
      }
    } finally {
      setSubmittingOrder(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-[#FAF8F8] flex flex-col items-center justify-center px-4">
        <div className="text-center max-w-sm flex flex-col items-center gap-4 bg-white border border-slate-100/80 rounded-2xl p-8 shadow-sm">
          <h2 className="text-xl font-bold text-[#091A36]">No items for checkout</h2>
          <p className="text-slate-400 text-xs font-semibold leading-relaxed">
            Please add dishes to your cart before proceeding to checkout.
          </p>
          <Link href="/home" className="w-full mt-2">
            <Button className="w-full bg-[#D61A22] hover:bg-[#b21018] text-white rounded-xl font-bold text-xs">
              Go Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF8F8] py-8 px-4 md:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Back Link */}
        <Link 
          href="/cart" 
          className="flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-slate-700 transition-colors mb-4 w-fit"
        >
          <ArrowLeft className="size-3.5" /> Back to Cart
        </Link>

        <h1 className="text-3xl font-extrabold text-[#091A36] tracking-tight mb-8">Checkout</h1>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* ==================== LEFT: CHECKOUT OPTIONS ==================== */}
          <div className="flex-1 flex flex-col gap-6 w-full">
            
            {/* Card 1: Review Your Order */}
            <Card className="bg-white border border-slate-100 rounded-2xl shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] overflow-hidden p-6">
              <div className="flex items-center gap-3.5 mb-6">
                <span className="flex items-center justify-center size-6 rounded-full bg-[#D61A22] text-white text-xs font-bold shrink-0">1</span>
                <h2 className="text-lg font-bold text-[#091A36]">Review Your Order</h2>
              </div>

              {/* Kitchen header tag */}
              <div className="flex items-center gap-1.5 text-[#B8860B] font-extrabold text-xs mb-5">
                <Utensils className="size-3.5" />
                <span>{cookName}</span>
              </div>

              {/* Items List */}
              <div className="flex flex-col divide-y divide-slate-100">
                {items.map((item) => {
                  const isVeg = isVegDish(item.name);
                  return (
                    <div key={item.dishId} className="flex gap-4 py-4 first:pt-0 last:pb-0 items-center justify-between">
                      <div className="flex gap-4 items-center flex-1 min-w-0">
                        {/* Square image */}
                        <div className="size-16 relative rounded-xl overflow-hidden bg-slate-50 border border-slate-150 shrink-0">
                          {item.imageUrl ? (
                            <Image
                              src={item.imageUrl}
                              alt={item.name}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-355 bg-slate-100">
                              <Utensils className="size-6 text-slate-300" />
                            </div>
                          )}
                        </div>

                        {/* Title, Veg badge, and interactive quantity selectors */}
                        <div className="flex flex-col gap-1.5">
                          <h4 className="font-bold text-slate-800 text-sm leading-snug truncate">{item.name}</h4>
                          
                          {/* Veg / Non-Veg Indicator Badge */}
                          <div className="flex items-center gap-1">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                              isVeg 
                                ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                                : "bg-red-50 text-red-600 border-red-200"
                            }`}>
                              {isVeg ? "▣ Veg" : "▣ Non-Veg"}
                            </span>
                          </div>

                          {/* Quantity Selector inside checkout */}
                          <div className="flex items-center bg-slate-50 border border-slate-200/50 rounded-xl p-0.5 h-8 w-fit mt-1">
                            <button
                              onClick={() => updateQty(item.dishId, item.qty - 1)}
                              className="size-7 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors"
                            >
                              <Minus className="size-3" />
                            </button>
                            <span className="w-6 text-center text-xs font-bold text-slate-800">{item.qty}</span>
                             <button
                               onClick={() => updateQty(item.dishId, item.qty + 1)}
                               disabled={item.qty >= item.max_quantity}
                               className="size-7 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                             >
                               <Plus className="size-3" />
                             </button>
                           </div>
                        </div>
                      </div>

                      {/* Right side: Price and Remove */}
                      <div className="flex flex-col items-end gap-3 shrink-0">
                        <span className="font-bold text-[#D61A22] text-sm">₹{(item.price * item.qty).toFixed(2)}</span>
                        
                        {/* Remove Action link */}
                        <button
                          onClick={() => removeItem(item.dishId)}
                          className="text-[11px] font-bold text-slate-400 hover:text-[#D61A22] flex items-center gap-1"
                        >
                          <Trash2 className="size-3" />
                          Remove
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Card 2: Delivery & Payment Details */}
            <Card className="bg-white border border-slate-100 rounded-2xl shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] overflow-hidden p-6 flex flex-col gap-6">
              <div className="flex items-center gap-3.5">
                <span className="flex items-center justify-center size-6 rounded-full bg-[#D61A22] text-white text-xs font-bold shrink-0">2</span>
                <h2 className="text-lg font-bold text-[#091A36]">Delivery & Payment</h2>
              </div>
              
              {/* Delivery Type Selector pills tab */}
              <div 
                role="radiogroup" 
                aria-label="Delivery Type"
                className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/50 w-full md:w-fit"
              >
                <label
                  className={`flex-1 md:flex-initial px-6 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer relative focus-within:ring-2 focus-within:ring-[#D61A22] ${
                    deliveryType === "delivery"
                      ? "bg-white text-[#D61A22] shadow-sm border border-slate-200/20"
                      : "text-slate-500 hover:text-slate-800 bg-transparent"
                  }`}
                >
                  <input
                    type="radio"
                    name="deliveryType"
                    value="delivery"
                    checked={deliveryType === "delivery"}
                    onChange={() => setDeliveryType("delivery")}
                    className="sr-only"
                  />
                  <Bike className="size-3.5" />
                  <span>Delivery</span>
                </label>
                <label
                  className={`flex-1 md:flex-initial px-6 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer relative focus-within:ring-2 focus-within:ring-[#D61A22] ${
                    deliveryType === "pickup"
                      ? "bg-white text-[#D61A22] shadow-sm border border-slate-200/20"
                      : "text-slate-500 hover:text-slate-800 bg-transparent"
                  }`}
                >
                  <input
                    type="radio"
                    name="deliveryType"
                    value="pickup"
                    checked={deliveryType === "pickup"}
                    onChange={() => setDeliveryType("pickup")}
                    className="sr-only"
                  />
                  <Clock className="size-3.5" />
                  <span>Pickup</span>
                </label>
              </div>

              {/* Delivery Address Details */}
              {deliveryType === "delivery" ? (
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Delivery Address</span>
                    <Link 
                      href="/addresses" 
                      className="text-xs font-bold text-[#D61A22] hover:underline flex items-center gap-0.5"
                    >
                      <Plus className="size-3" /> Add New
                    </Link>
                  </div>

                  {loadingAddresses ? (
                    <div className="flex flex-col gap-2">
                      <Skeleton className="h-12 w-full rounded-xl" />
                      <Skeleton className="h-12 w-full rounded-xl" />
                    </div>
                  ) : addresses.length === 0 ? (
                    <div className="border border-dashed border-slate-200 rounded-2xl p-6 text-center">
                      <p className="text-xs font-semibold text-slate-500 mb-3">No saved addresses found.</p>
                      <Link href="/addresses">
                        <Button className="bg-[#D61A22] hover:bg-[#b21018] text-white text-[10px] rounded-lg h-8">
                          Add Address
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div role="radiogroup" aria-label="Delivery Address" className="grid grid-cols-1 gap-3">
                      {addresses.map((addr) => {
                        const isSelected = deliveryAddressId === addr.id;
                        return (
                          <label
                            key={addr.id}
                            className={`border rounded-xl p-4 cursor-pointer transition-all flex items-start gap-4 bg-white relative focus-within:ring-2 focus-within:ring-[#C29B38] ${
                              isSelected
                                ? "border-[#C29B38] bg-[#FAF9F5] shadow-sm"
                                : "border-slate-100 hover:border-slate-250"
                            }`}
                          >
                            <input
                              type="radio"
                              name="deliveryAddress"
                              value={addr.id}
                              checked={isSelected}
                              onChange={() => setDeliveryAddressId(addr.id)}
                              className="sr-only"
                            />
                            <div className={`p-2 rounded-lg shrink-0 ${isSelected ? "text-[#C29B38]" : "text-slate-400"}`}>
                              {addr.label === "Work" || addr.label === "Other" ? (
                                <Briefcase className="size-5" />
                              ) : (
                                <Home className="size-5" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                {addr.label}
                                {addr.is_default && (
                                  <span className="bg-slate-100 text-slate-400 font-bold text-[9px] px-1.5 py-0.5 rounded-full uppercase">
                                    Default
                                  </span>
                                )}
                              </p>
                              <p className="text-slate-400 text-[11px] font-semibold mt-1 leading-normal">
                                {addr.address_line}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                // Pickup time selector slots layout
                <div className="flex flex-col gap-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Pickup Time Slot</span>
                                <div role="radiogroup" aria-label="Pickup Time Slot" className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                     {pickupSlots.map((slot) => {
                      const isSelected = pickupTime === slot.value;
                      return (
                        <label
                          key={slot.value}
                          className={`border rounded-xl p-4 cursor-pointer transition-all flex items-center gap-3 bg-white focus-within:ring-2 focus-within:ring-[#C29B38] ${
                            isSelected
                              ? "border-[#C29B38] bg-[#FAF9F5] shadow-sm"
                              : "border-slate-100 hover:border-slate-200"
                          }`}
                        >
                          <input
                            type="radio"
                            name="pickupTime"
                            value={slot.value}
                            checked={isSelected}
                            onChange={() => setPickupTime(slot.value)}
                            className="sr-only"
                          />
                          <Clock className={`size-4 shrink-0 ${isSelected ? "text-[#C29B38]" : "text-slate-400"}`} />
                          <span className={`text-xs font-bold ${isSelected ? "text-slate-850" : "text-slate-600"}`}>
                            {slot.label}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Payment Method Selector */}
              <div className="flex flex-col gap-4 pt-4 border-t border-slate-50">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Payment Method</span>
                
                <div role="radiogroup" aria-label="Payment Method" className="grid grid-cols-3 gap-3">
                  {/* UPI */}
                  <label
                    className={`border rounded-xl p-4 cursor-pointer transition-all flex flex-col items-center justify-center gap-2 bg-white focus-within:ring-2 focus-within:ring-[#C29B38] ${
                      paymentMethod === "upi"
                        ? "border-[#C29B38] bg-[#FAF9F5] shadow-sm"
                        : "border-slate-100 hover:border-slate-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="upi"
                      checked={paymentMethod === "upi"}
                      onChange={() => setPaymentMethod("upi")}
                      className="sr-only"
                    />
                    <CreditCard className={`size-5 shrink-0 ${paymentMethod === "upi" ? "text-[#C29B38]" : "text-slate-400"}`} />
                    <span className="text-xs font-bold text-slate-750">UPI</span>
                  </label>

                  {/* Card */}
                  <label
                    className={`border rounded-xl p-4 cursor-pointer transition-all flex flex-col items-center justify-center gap-2 bg-white focus-within:ring-2 focus-within:ring-[#C29B38] ${
                      paymentMethod === "card"
                        ? "border-[#C29B38] bg-[#FAF9F5] shadow-sm"
                        : "border-slate-100 hover:border-slate-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentMethod === "card"}
                      onChange={() => setPaymentMethod("card")}
                      className="sr-only"
                    />
                    <CreditCard className={`size-5 shrink-0 ${paymentMethod === "card" ? "text-[#C29B38]" : "text-slate-400"}`} />
                    <span className="text-xs font-bold text-slate-750">Card</span>
                  </label>

                  {/* Cash */}
                  <label
                    className={`border rounded-xl p-4 cursor-pointer transition-all flex flex-col items-center justify-center gap-2 bg-white focus-within:ring-2 focus-within:ring-[#C29B38] ${
                      paymentMethod === "cash"
                        ? "border-[#C29B38] bg-[#FAF9F5] shadow-sm"
                        : "border-slate-100 hover:border-slate-200"
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash"
                      checked={paymentMethod === "cash"}
                      onChange={() => setPaymentMethod("cash")}
                      className="sr-only"
                    />
                    <CreditCard className={`size-5 shrink-0 ${paymentMethod === "cash" ? "text-[#C29B38]" : "text-slate-400"}`} />
                    <span className="text-xs font-bold text-slate-750">Cash</span>
                  </label>
                </div>
              </div>

            </Card>
          </div>

          {/* ==================== RIGHT: ORDER SUMMARY ==================== */}
          <div className="w-full lg:w-[320px] shrink-0 flex flex-col gap-4">
            <Card className="bg-white border border-slate-100 rounded-2xl shadow-[0_4px_25px_-5px_rgba(0,0,0,0.03)] p-5 flex flex-col gap-4">
              <h3 className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-3">
                Order Summary
              </h3>

              <div className="flex flex-col gap-2.5 text-xs font-semibold">
                <div className="flex justify-between text-slate-650">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-650">
                  <span>Delivery Fee</span>
                  <span className="text-emerald-600 font-bold">Free</span>
                </div>
                <div className="flex justify-between text-slate-650">
                  <span>Service Fee</span>
                  <span>₹{serviceFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-650">
                  <span>Taxes</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
              </div>

              <Separator className="bg-slate-100/70" />

              <div className="flex justify-between items-center text-sm font-bold text-slate-800">
                <span>Total</span>
                <span className="text-2xl font-extrabold text-[#D61A22]">₹{checkoutTotal.toFixed(2)}</span>
              </div>

           
              <Button
                onClick={handlePlaceOrder}
                className="w-full bg-[#D61A22] hover:bg-[#b21018] text-white rounded-xl py-5 font-bold text-xs tracking-wider transition-colors mt-2 h-11 flex items-center justify-center gap-1.5 shadow-sm"
                disabled={submittingOrder}
              >
                {submittingOrder ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" /> Placing Order...
                  </>
                ) : (
                  "Place Order"
                )}
              </Button>

              <p className="text-[10px] text-slate-400 font-medium text-center leading-normal mt-1">
                By placing your order, you agree to our Terms and Conditions.
              </p>
            </Card>

           

          </div>
        </div>
      </div>
    </div>
  );
}
