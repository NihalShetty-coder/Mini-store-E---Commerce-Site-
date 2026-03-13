import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { type Product } from '@/types/product';
import { type CartItem, getCartItemKey } from '@/types/cart';

/**
 * Basic sanity check: remove cart items with missing/corrupt data.
 * This catches stale items left over from deleted products.
 */
function sanitizeCartItems(items: unknown): CartItem[] {
    if (!Array.isArray(items)) return [];
    return items.filter((item): item is CartItem => {
        if (!item || typeof item !== 'object') return false;
        const i = item as Record<string, unknown>;
        return (
            typeof i.id === 'string' && i.id.length > 0 &&
            typeof i.name === 'string' && i.name.length > 0 &&
            typeof i.price === 'number' && i.price > 0 &&
            typeof i.quantity === 'number' && i.quantity > 0
        );
    });
}

interface CartStore {
    items: CartItem[];
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    addItem: (product: Product, size?: string, color?: string) => void;
    removeItem: (cartItemId: string) => void;
    updateQuantity: (cartItemId: string, quantity: number) => void;
    clearCart: () => void;
    totalItems: () => number;
    totalPrice: () => number;
}

export const useCart = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],
            isOpen: false,
            setIsOpen: (open: boolean) => set({ isOpen: open }),
            addItem: (product: Product, size?: string, color?: string) => {
                const items = get().items;
                
                // Create cart item with selected variants
                const cartItem: CartItem = {
                    id: product.id,
                    name: product.name,
                    price: product.price,
                    image: product.images?.[0] || product.image || '',
                    selectedSize: size,
                    selectedColor: color,
                    quantity: 1,
                    category: product.category,
                    stock: product.stock,
                };
                
                const cartItemId = getCartItemKey(cartItem);
                const existingItem = items.find((item) => 
                    getCartItemKey(item) === cartItemId
                );

                if (existingItem) {
                    set({
                        items: items.map((item) =>
                            getCartItemKey(item) === cartItemId
                                ? { ...item, quantity: item.quantity + 1 }
                                : item
                        ),
                        isOpen: true,
                    });
                } else {
                    set({
                        items: [...items, cartItem],
                        isOpen: true,
                    });
                }
            },
            removeItem: (cartItemId: string) => {
                set({
                    items: get().items.filter((item) => 
                        getCartItemKey(item) !== cartItemId
                    ),
                });
            },
            updateQuantity: (cartItemId: string, quantity: number) => {
                if (quantity <= 0) {
                    get().removeItem(cartItemId);
                    return;
                }
                
                set({
                    items: get().items.map((item) =>
                        getCartItemKey(item) === cartItemId ? { ...item, quantity } : item
                    ),
                });
            },
            clearCart: () => set({ items: [] }),
            totalItems: () => get().items.reduce((acc, item) => acc + item.quantity, 0),
            totalPrice: () =>
                get().items.reduce((acc, item) => acc + item.price * item.quantity, 0),
        }),
        {
            name: 'nihalshetty-cart-storage',
            // Sanitize cart data when rehydrating from localStorage
            onRehydrateStorage: () => (state) => {
                if (state) {
                    const clean = sanitizeCartItems(state.items);
                    if (clean.length !== state.items.length) {
                        state.items = clean;
                    }
                }
            },
        }
    )
);
