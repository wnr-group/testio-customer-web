'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'ready'
  | 'completed'
  | 'cancelled'

export function useRealtimeOrder(orderId: string) {
  const [status, setStatus] = useState<OrderStatus | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!orderId) return

    const channel = supabase
      .channel(`order-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          setStatus((payload.new as { status: OrderStatus }).status)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId]) // eslint-disable-line react-hooks/exhaustive-deps

  return { status }
}
