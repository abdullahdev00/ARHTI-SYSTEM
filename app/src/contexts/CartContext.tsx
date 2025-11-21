import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface CartItem {
  id: string;
  cropName: string;
  bagQuantity: number;
  weightPerBag: number;
  ratePerBag: number;
  total: number;
  type: 'buy' | 'sell';
  stockItemId?: number;
  bagVariantId?: number;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (itemId: string) => void;
  updateCartItem: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getBuyItems: () => CartItem[];
  getSellItems: () => CartItem[];
}

const CartContext = createContext<CartContextType>({} as CartContextType);

export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const addToCart = (item: CartItem) => {
    setCartItems(prev => {
      // Check if item already exists
      const existingIndex = prev.findIndex(
        cartItem => cartItem.cropName === item.cropName && 
                   cartItem.weightPerBag === item.weightPerBag && 
                   cartItem.type === item.type
      );

      if (existingIndex >= 0) {
        // Update existing item
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          bagQuantity: updated[existingIndex].bagQuantity + item.bagQuantity,
          total: updated[existingIndex].total + item.total
        };
        return updated;
      } else {
        // Add new item
        return [...prev, item];
      }
    });
  };

  const removeFromCart = (itemId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== itemId));
  };

  const updateCartItem = (itemId: string, quantity: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === itemId) {
        const newTotal = quantity * item.ratePerBag;
        return {
          ...item,
          bagQuantity: quantity,
          total: newTotal
        };
      }
      return item;
    }));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + item.total, 0);
  };

  const getBuyItems = () => {
    return cartItems.filter(item => item.type === 'buy');
  };

  const getSellItems = () => {
    return cartItems.filter(item => item.type === 'sell');
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateCartItem,
      clearCart,
      getCartTotal,
      getBuyItems,
      getSellItems
    }}>
      {children}
    </CartContext.Provider>
  );
}
