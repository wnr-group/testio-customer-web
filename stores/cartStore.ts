import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CartItem = {
  dishId: string
  name: string
  price: number
  qty: number
  imageUrl?: string
}

type CartState = {
  cookId: string | null
  cookName: string | null
  items: CartItem[]
  addItem: (cookId: string, cookName: string, item: CartItem) => void
  updateQty: (dishId: string, qty: number) => void
  removeItem: (dishId: string) => void
  clear: () => void
  total: () => number
  itemCount: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cookId: null,
      cookName: null,
      items: [],

      addItem: (cookId, cookName, item) => {
        const state = get()
        // If adding from a different cook, replace cart
        if (state.cookId && state.cookId !== cookId) {
          set({ cookId, cookName, items: [item] })
          return
        }
        const existing = state.items.find((i) => i.dishId === item.dishId)
        if (existing) {
          set({
            items: state.items.map((i) =>
              i.dishId === item.dishId ? { ...i, qty: i.qty + item.qty } : i
            ),
          })
        } else {
          set({ cookId, cookName, items: [...state.items, item] })
        }
      },

      updateQty: (dishId, qty) =>
        set((s) => ({
          items: qty <= 0
            ? s.items.filter((i) => i.dishId !== dishId)
            : s.items.map((i) => (i.dishId === dishId ? { ...i, qty } : i)),
        })),

      removeItem: (dishId) =>
        set((s) => ({ items: s.items.filter((i) => i.dishId !== dishId) })),

      clear: () => set({ cookId: null, cookName: null, items: [] }),

      total: () => get().items.reduce((sum, i) => sum + i.price * i.qty, 0),

      itemCount: () => get().items.reduce((sum, i) => sum + i.qty, 0),
    }),
    {
      name: 'testio-cart',
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version < 1 && persistedState && typeof persistedState === 'object') {
          const state = persistedState as any;
          if (Array.isArray(state.items)) {
            state.items = state.items.map((item: any) => ({
              ...item,
              qty: typeof item.qty === 'number' ? item.qty : 1,
              price: typeof item.price === 'number' ? item.price : 0,
            }));
          }
          return state;
        }
        return persistedState;
      }
    }
  )
)
