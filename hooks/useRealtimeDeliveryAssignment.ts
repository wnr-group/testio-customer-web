'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type DeliveryAssignmentStatus =
  | 'broadcast'
  | 'assigned'
  | 'picked_up'
  | 'delivered'
  | 'cancelled'
  | 'expired'

export interface DeliveryAssignmentRow {
  status: DeliveryAssignmentStatus
  otp_code: string | null
}

export function useRealtimeDeliveryAssignment(orderId: string) {
  const [assignment, setAssignment] = useState<DeliveryAssignmentRow | null>(null)
  const supabase = createClient()

  useEffect(() => {
    if (!orderId) return

    const channel = supabase
      .channel(`delivery-assignment-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'delivery_assignments',
          filter: `order_id=eq.${orderId}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setAssignment(null)
            return
          }
          setAssignment(payload.new as DeliveryAssignmentRow)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [orderId]) // eslint-disable-line react-hooks/exhaustive-deps

  return { assignment }
}
