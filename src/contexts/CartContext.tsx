import React, { createContext, useContext, useEffect, useState } from "react";

export interface CartItem {
  id: string;
  title: string;
  price: number;
  currency: string;
  quantity: number;
  image?: string;
  product_type?: string;
}

interface CartContextValue {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'>, qty?: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  totalCount: number;
  totalAmount: number;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = 'buya_cart_v1';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch (e) {}
  }, [items]);

  const addToCart = (item: Omit<CartItem, 'quantity'>, qty = 1) => {
    setItems((prev) => {
      const found = prev.find((p) => p.id === item.id);
      if (found) {
        return prev.map((p) => p.id === item.id ? { ...p, quantity: p.quantity + qty } : p);
      }
      return [...prev, { ...item, quantity: qty }];
    });
  };

  const removeFromCart = (id: string) => setItems((prev) => prev.filter((p) => p.id !== id));

  const updateQuantity = (id: string, qty: number) => {
    setItems((prev) => prev.map((p) => p.id === id ? { ...p, quantity: Math.max(0, qty) } : p).filter(p => p.quantity > 0));
  };

  const clearCart = () => setItems([]);

  const totalCount = items.reduce((s, i) => s + i.quantity, 0);
  const totalAmount = items.reduce((s, i) => s + i.quantity * (i.price || 0), 0);

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalCount, totalAmount }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};

export default CartContext;
