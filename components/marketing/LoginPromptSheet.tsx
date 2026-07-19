'use client'

// Shown when a logged-out visitor taps "add to cart". DishCard stashes the
// dish in sessionStorage (pending_dish) before opening this; after the
// login round-trip PendingDishAutoAdd puts it in the cart.

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import type { Dish } from '@/components/DishCard'

type Props = { dish: Dish; open: boolean; onClose: () => void }

export function LoginPromptSheet({ dish, open, onClose }: Props) {
  const pathname = usePathname()
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label="Sign in to start your order"
        className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={dish.image_url || '/placeholder-dish.jpg'}
              alt={dish.name}
              className="h-14 w-14 rounded-xl object-cover"
            />
            <div>
              <p className="text-sm font-bold text-slate-800">{dish.name}</p>
              <p className="text-xs text-slate-400">₹{Number(dish.price).toFixed(2)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1 text-slate-400 hover:bg-slate-100"
          >
            <X className="size-5" />
          </button>
        </div>
        <h3 className="mt-5 text-lg font-extrabold text-slate-900">Sign in to start your order</h3>
        <p className="mt-1 text-sm text-slate-500">
          Quick OTP login — this dish will be waiting in your cart.
        </p>
        <Link
          href={`/login?next=${encodeURIComponent(pathname)}`}
          className="mt-5 block w-full rounded-xl bg-[#E8202A] py-3 text-center text-sm font-bold text-white transition-colors hover:bg-[#c71821]"
        >
          Continue with mobile number
        </Link>
      </div>
    </div>
  )
}
