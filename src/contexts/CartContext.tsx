import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Retailer {
  id: string;
  name: string;
  location: string;
  rating: number;
  distance?: number;
  is_open: boolean;
  image?: string;
  delivery_time?: string;
  minimum_order?: number;
}

interface CartContextType {
  items: CartItem[];
  selectedRetailer: Retailer | null;
  total: number;
  itemCount: number;
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  selectRetailer: (retailer: Retailer | null) => void;
  getItemQuantity: (productId: string) => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'bigcompany_cart';
const RETAILER_STORAGE_KEY = 'bigcompany_selected_retailer';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedRetailer, setSelectedRetailer] = useState<Retailer | null>(() => {
    try {
      const saved = localStorage.getItem(RETAILER_STORAGE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Persist cart to localStorage
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  // Persist selected retailer to localStorage
  useEffect(() => {
    if (selectedRetailer) {
      localStorage.setItem(RETAILER_STORAGE_KEY, JSON.stringify(selectedRetailer));
    } else {
      localStorage.removeItem(RETAILER_STORAGE_KEY);
    }
  }, [selectedRetailer]);

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  const addItem = useCallback((item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.productId === item.productId);
      if (existingIndex >= 0) {
        const newItems = [...prev];
        newItems[existingIndex].quantity += item.quantity || 1;
        return newItems;
      }
      return [...prev, { ...item, quantity: item.quantity || 1 }];
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((item) => item.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.productId !== productId));
    } else {
      setItems((prev) =>
        prev.map((item) =>
          item.productId === productId ? { ...item, quantity } : item
        )
      );
    }
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const selectRetailer = useCallback((retailer: Retailer | null) => {
    setSelectedRetailer(retailer);
    // Clear cart when changing retailer
    if (retailer?.id !== selectedRetailer?.id) {
      setItems([]);
    }
  }, [selectedRetailer?.id]);

  const getItemQuantity = useCallback(
    (productId: string) => {
      const item = items.find((i) => i.productId === productId);
      return item?.quantity || 0;
    },
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        selectedRetailer,
        total,
        itemCount,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        selectRetailer,
        getItemQuantity,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
