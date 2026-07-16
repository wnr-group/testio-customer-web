"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useCartStore } from "@/stores/cartStore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  MapPin, 
  Clock, 
  CreditCard, 
  Utensils, 
  Plus, 
  Loader2, 
  ArrowLeft 
} from "lucide-react";

// Mock pickup slots
const PICKUP_SLOTS = [
  "12:00 PM - 12:30 PM",
  "12:30 PM - 1:00 PM",
  "1:00 PM - 1:30 PM",
  "6:30 PM - 7:00 PM",
  "7:00 PM - 7:30 PM",
  "7:30 PM - 8:00 PM"
];

export default function CheckoutPage() {
  const router = useRouter();
  const supabase = createClient();
  const { items, cookId, cookName, total, clear } = useCartStore();

  // State Management
  const [mounted, setMounted] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);
  const [submittingOrder, setSubmittingOrder] = useState(false);

  // Checkout Options state
  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup">("delivery");
  const [deliveryAddressId, setDeliveryAddressId] = useState<string | null>(null);
  const [pickupTime, setPickupTime] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<"upi" | "card" | "cash">("upi");

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
    try {
      // 1. Create order record
      const randomArr = new Uint32Array(1);
      crypto.getRandomValues(randomArr);
      const orderNumber = String((randomArr[0] % 9000) + 1000);
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          order_number: orderNumber,
          customer_id: user.id,
          cook_id: cookId,
          status: "pending",
          payment_status: "pending",
          subtotal: subtotal,
          tax: tax,
          delivery_fee: 0,
          total: checkoutTotal,
          delivery_type: deliveryType,
          delivery_address_id: deliveryType === "delivery" ? deliveryAddressId : null,
          pickup_time: deliveryType === "pickup" ? pickupTime : null
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // 2. Insert order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        dish_id: item.dishId,
        quantity: item.qty,
        unit_price: item.price,
        total_price: item.price * item.qty
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      toast.success("Order placed successfully!");
      
      // 3. Clear store & redirect
      clear();
      router.push(`/order/${order.id}/confirm`);
    } catch (err: any) {
      console.error("Order placement error:", err);
      toast.error(err.message || "Failed to place order. Please try again.");
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
    <div className="min-h-screen bg-[#FAF8F8] py-10 px-4 md:px-8">
      <div className="mx-auto max-w-5xl">
        {/* Back Link */}
        <Link 
          href="/cart" 
          className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors mb-6 w-fit"
        >
          <ArrowLeft className="size-3.5" /> Back to Cart
        </Link>

        <h1 className="text-3xl font-extrabold text-[#091A36] tracking-tight mb-8">Checkout</h1>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* ==================== LEFT: CHECKOUT OPTIONS ==================== */}
          <div className="flex-1 flex flex-col gap-6 w-full">
            
            {/* Card 1: Review Your Order */}
            <Card className="bg-white border border-slate-100/80 rounded-2xl shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] overflow-hidden">
              <CardHeader className="border-b border-slate-50 px-6 py-4">
                <CardTitle className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <span className="flex items-center justify-center size-5 rounded-full bg-[#D61A22] text-white text-[10px] font-bold">1</span>
                  Review Your Order
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 flex flex-col gap-4">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                  <Utensils className="size-3.5 text-[#D61A22]" />
                  <span>Items from {cookName}</span>
                </div>

                <div className="flex flex-col gap-4">
                  {items.map((item) => (
                    <div key={item.dishId} className="flex justify-between items-center text-xs font-semibold text-slate-700">
                      <div className="flex items-center gap-3">
                        <div className="size-10 relative rounded-lg overflow-hidden bg-slate-50 border border-slate-150 shrink-0">
                          {item.imageUrl ? (
                            <Image
                              src={item.imageUrl}
                              alt={item.name}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-300">
                              <Utensils className="size-4" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{item.name}</p>
                          <span className="text-[10px] text-slate-400">Qty: {item.qty} × ₹{item.price.toFixed(2)}</span>
                        </div>
                      </div>
                      <span className="font-bold text-slate-800">₹{(item.price * item.qty).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Card 2: Delivery & Payment Details */}
            <Card className="bg-white border border-slate-100/80 rounded-2xl shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] overflow-hidden">
              <CardHeader className="border-b border-slate-50 px-6 py-4">
                <CardTitle className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
                  <span className="flex items-center justify-center size-5 rounded-full bg-[#D61A22] text-white text-[10px] font-bold">2</span>
                  Delivery & Payment
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 flex flex-col gap-6">
                
                {/* Delivery Type Selector */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200/50 w-fit">
                  <button
                    onClick={() => setDeliveryType("delivery")}
                    className={`px-6 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      deliveryType === "delivery"
                        ? "bg-white text-[#D61A22] shadow-sm"
                        : "text-slate-500 hover:text-slate-800 bg-transparent"
                    }`}
                  >
                    Delivery
                  </button>
                  <button
                    onClick={() => setDeliveryType("pickup")}
                    className={`px-6 py-1.5 text-xs font-bold rounded-lg transition-all ${
                      deliveryType === "pickup"
                        ? "bg-white text-[#D61A22] shadow-sm"
                        : "text-slate-500 hover:text-slate-800 bg-transparent"
                    }`}
                  >
                    Pickup
                  </button>
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
                      <div className="grid grid-cols-1 gap-3">
                        {addresses.map((addr) => (
                          <div
                            key={addr.id}
                            onClick={() => setDeliveryAddressId(addr.id)}
                            className={`border rounded-2xl p-4 cursor-pointer transition-all flex items-start gap-3 bg-white ${
                              deliveryAddressId === addr.id
                                ? "border-[#D61A22] bg-[#FAF8F8] shadow-sm"
                                : "border-slate-100 hover:border-slate-200"
                            }`}
                          >
                            <MapPin className={`size-4 mt-0.5 shrink-0 ${deliveryAddressId === addr.id ? "text-[#D61A22]" : "text-slate-400"}`} />
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                                {addr.label}
                                {addr.is_default && (
                                  <span className="bg-slate-100 text-slate-500 font-bold text-[9px] px-1.5 py-0.5 rounded-full uppercase">
                                    Default
                                  </span>
                                )}
                              </p>
                              <p className="text-slate-500 text-[11px] font-semibold mt-1 leading-normal truncate">
                                {addr.address_line}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  // Pickup time selector
                  <div className="flex flex-col gap-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Pickup Time Slot</span>
                    
                    <div className="grid grid-cols-2 gap-3">
                      {PICKUP_SLOTS.map((slot) => (
                        <div
                          key={slot}
                          onClick={() => setPickupTime(slot)}
                          className={`border rounded-2xl p-4 cursor-pointer transition-all flex items-center gap-3 bg-white ${
                            pickupTime === slot
                              ? "border-[#D61A22] bg-[#FAF8F8] shadow-sm"
                              : "border-slate-100 hover:border-slate-200"
                          }`}
                        >
                          <Clock className={`size-4 shrink-0 ${pickupTime === slot ? "text-[#D61A22]" : "text-slate-400"}`} />
                          <span className={`text-xs font-bold ${pickupTime === slot ? "text-slate-800" : "text-slate-600"}`}>
                            {slot}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Payment Method Selector */}
                <div className="flex flex-col gap-4 pt-4 border-t border-slate-50">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Payment Method</span>
                  
                  <div className="grid grid-cols-3 gap-3">
                    {/* UPI */}
                    <div
                      onClick={() => setPaymentMethod("upi")}
                      className={`border rounded-2xl p-4 cursor-pointer transition-all flex items-center justify-center gap-2 bg-white ${
                        paymentMethod === "upi"
                          ? "border-[#D61A22] bg-[#FAF8F8] shadow-sm"
                          : "border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      <CreditCard className={`size-4 shrink-0 ${paymentMethod === "upi" ? "text-[#D61A22]" : "text-slate-400"}`} />
                      <span className="text-xs font-bold text-slate-700">UPI</span>
                    </div>

                    {/* Card */}
                    <div
                      onClick={() => setPaymentMethod("card")}
                      className={`border rounded-2xl p-4 cursor-pointer transition-all flex items-center justify-center gap-2 bg-white ${
                        paymentMethod === "card"
                          ? "border-[#D61A22] bg-[#FAF8F8] shadow-sm"
                          : "border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      <CreditCard className={`size-4 shrink-0 ${paymentMethod === "card" ? "text-[#D61A22]" : "text-slate-400"}`} />
                      <span className="text-xs font-bold text-slate-700">Card</span>
                    </div>

                    {/* Cash */}
                    <div
                      onClick={() => setPaymentMethod("cash")}
                      className={`border rounded-2xl p-4 cursor-pointer transition-all flex items-center justify-center gap-2 bg-white ${
                        paymentMethod === "cash"
                          ? "border-[#D61A22] bg-[#FAF8F8] shadow-sm"
                          : "border-slate-100 hover:border-slate-200"
                      }`}
                    >
                      <CreditCard className={`size-4 shrink-0 ${paymentMethod === "cash" ? "text-[#D61A22]" : "text-slate-400"}`} />
                      <span className="text-xs font-bold text-slate-700">Cash</span>
                    </div>
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>

          {/* ==================== RIGHT: ORDER SUMMARY ==================== */}
          <div className="w-full lg:w-[320px] shrink-0">
            <Card className="bg-white border border-slate-100/80 rounded-2xl shadow-[0_4px_25px_-5px_rgba(0,0,0,0.04)] p-5 flex flex-col gap-4">
              <CardTitle className="text-sm font-bold text-slate-800 border-b border-slate-50 pb-3">
                Order Summary
              </CardTitle>

              <div className="flex flex-col gap-2.5 text-xs font-semibold">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Delivery Fee</span>
                  <span className="text-emerald-600 font-bold">Free</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Service Fee</span>
                  <span>₹{serviceFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Taxes (5%)</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
              </div>

              <Separator className="bg-slate-100/80" />

              <div className="flex justify-between text-base font-extrabold text-[#D61A22]">
                <span>Total</span>
                <span>₹{checkoutTotal.toFixed(2)}</span>
              </div>


              <Button
                onClick={handlePlaceOrder}
                className="w-full bg-[#D61A22] hover:bg-[#b21018] text-white rounded-xl py-5 font-bold text-xs tracking-wider transition-colors mt-2 h-10 flex items-center justify-center gap-1.5 shadow-sm"
                disabled={submittingOrder}
              >
                {submittingOrder ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" /> Placing Order...
                  </>
                ) : (
                  `Pay ₹${checkoutTotal.toFixed(2)}`
                )}
              </Button>

              <p className="text-[10px] text-slate-400 font-semibold text-center leading-normal mt-1">
                By placing your order, you agree to our Terms and Conditions.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
