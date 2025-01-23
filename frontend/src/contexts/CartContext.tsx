import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCart, addToCart, updateCartItem, removeFromCart, clearCart } from '../services/api';
import { useAuth } from './AuthContext';

interface CartItem {
  id: number;
  product: {
    id: number;
    name: string;
    price: number;
    stock: number;
  };
  quantity: number;
  total: number;
}

interface CartContextType {
  items: CartItem[];
  total: number;
  loading: boolean;
  error: string;
  selectedUserId: number | null;
  setSelectedUserId: (userId: number | null) => void;
  addToCart: (productId: number, quantity?: number) => Promise<void>;
  updateQuantity: (productId: number, quantity: number) => Promise<void>;
  removeItem: (productId: number) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const { user } = useAuth();

  const fetchCart = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await getCart(selectedUserId || undefined);
      setItems(response.data.items);
      setTotal(response.data.total);
    } catch (err) {
      console.error('Error fetching cart:', err);
      setError('Failed to fetch cart');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCart();
    }
  }, [user, selectedUserId]);

  const handleAddToCart = async (productId: number, quantity: number = 1) => {
    try {
      setLoading(true);
      setError('');
      await addToCart(productId, quantity, selectedUserId || undefined);
      await fetchCart();
    } catch (err) {
      console.error('Error adding to cart:', err);
      setError('Failed to add item to cart');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateQuantity = async (productId: number, quantity: number) => {
    try {
      setLoading(true);
      setError('');
      await updateCartItem(productId, quantity, selectedUserId || undefined);
      await fetchCart();
    } catch (err) {
      console.error('Error updating cart:', err);
      setError('Failed to update cart');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveItem = async (productId: number) => {
    try {
      setLoading(true);
      setError('');
      await removeFromCart(productId, selectedUserId || undefined);
      await fetchCart();
    } catch (err) {
      console.error('Error removing from cart:', err);
      setError('Failed to remove item from cart');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleClearCart = async () => {
    try {
      setLoading(true);
      setError('');
      await clearCart(selectedUserId || undefined);
      await fetchCart();
    } catch (err) {
      console.error('Error clearing cart:', err);
      setError('Failed to clear cart');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <CartContext.Provider
      value={{
        items,
        total,
        loading,
        error,
        selectedUserId,
        setSelectedUserId,
        addToCart: handleAddToCart,
        updateQuantity: handleUpdateQuantity,
        removeItem: handleRemoveItem,
        clearCart: handleClearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}; 