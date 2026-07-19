'use client'

// After the login round-trip, adds the dish the visitor tapped before
// signing in (stashed by DishCard under sessionStorage `pending_dish`).
// Mounted in the (browse) layout — the ?next= redirect lands there.

import { useEffect } from 'react'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useCartStore, type CartItem } from '@/stores/cartStore'

export function PendingDishAutoAdd() {
  const addItem = useCartStore((s) => s.addItem)

  useEffect(() => {
    void (async () => {
      const raw = sessionStorage.getItem('pending_dish')
      if (!raw) return
      const supabase = createClient()
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) return
      sessionStorage.removeItem('pending_dish')
      try {
        const { cookId, cookName, item } = JSON.parse(raw) as {
          cookId: string
          cookName: string
          item: CartItem
        }
        if (!cookId || !item?.dishId) return
        addItem(cookId, cookName || 'Home Cook', item)
        toast.success(`Added ${item.name} to your cart`)
      } catch {
        // corrupted payload — drop it
      }
    })()
  }, [addItem])

  return null
}
