import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CartItem = {
  dishId: string
  name: string
  price: number
  qty: number
  imageUrl?: string
  max_quantity: number
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
        const state = get();
        const normalizedItem = {
          ...item,
          qty: Math.min(item.qty, item.max_quantity),
        };

        // If adding from a different cook, replace cart
        if (state.cookId && state.cookId !== cookId) {
          set({ cookId, cookName, items: [normalizedItem] });
          return;
        }
        const existing = state.items.find((i) => i.dishId === item.dishId);
        if (existing) {
          set({
            items: state.items.map((i) =>
              i.dishId === item.dishId
                ? { ...i, qty: Math.min(i.qty + item.qty, i.max_quantity) }
                : i,
            ),
          });
        } else {
          set({ cookId, cookName, items: [...state.items, normalizedItem] });
        }
      },

      updateQty: (dishId, qty) =>
        set((s) => {
          const newItems =
            qty <= 0
              ? s.items.filter((i) => i.dishId !== dishId)
              : s.items.map((i) =>
                  i.dishId === dishId
                    ? { ...i, qty: Math.min(qty, i.max_quantity) }
                    : i,
                );

          if (newItems.length === 0) {
            return { items: [], cookId: null, cookName: null };
          }
          return { items: newItems };
        }),

      removeItem: (dishId) =>
        set((s) => ({ items: s.items.filter((i) => i.dishId !== dishId) })),

      clear: () => set({ cookId: null, cookName: null, items: [] }),

      total: () => get().items.reduce((sum, i) => sum + i.price * i.qty, 0),

      itemCount: () => get().items.reduce((sum, i) => sum + i.qty, 0),
    }),
    {
      name: "testio-cart",
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (
          version < 1 &&
          persistedState &&
          typeof persistedState === "object"
        ) {
          const state = persistedState as any;
          if (Array.isArray(state.items)) {
            state.items = state.items.map((item: any) => {
              const qtyNum =
                typeof item.qty === "number" ? item.qty : Number(item.qty);
              const priceNum =
                typeof item.price === "number"
                  ? item.price
                  : Number(item.price);
              const maxQtyNum =
                typeof item.max_quantity === "number"
                  ? item.max_quantity
                  : Number(item.max_quantity);

              return {
                ...item,
                qty: !isNaN(qtyNum) ? qtyNum : 1,
                price: !isNaN(priceNum) ? priceNum : 0,
                max_quantity: !isNaN(maxQtyNum) ? maxQtyNum : 10,
              };
            });
          }
          return state;
        }
        return persistedState;
      },
    },
  ),
);
