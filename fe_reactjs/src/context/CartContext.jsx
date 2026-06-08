import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';
import { toast } from 'react-toastify';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      setCartItems([]);
    }
  }, [user]);

  const fetchCart = async () => {
    try {
      const res = await api.get('/cart');
      if (res.data.success) {
        setCartItems(res.data.data);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };

  const addToCart = async (book_id, quantity = 1) => {
    if (!user) {
      toast.error('Vui lòng đăng nhập để mua hàng');
      return false;
    }

    try {
      const res = await api.post('/cart/add', { book_id, quantity });
      
      if (res.data.success) {
        toast.success('Đã thêm vào giỏ hàng');
        fetchCart();
        return true;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Thêm vào giỏ hàng thất bại');
      return false;
    }
  };

  const updateQuantity = async (cart_item_id, quantity) => {
    try {
      const res = await api.put(`/cart/update/${cart_item_id}`, { quantity });
      
      if (res.data.success) {
        fetchCart();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Cập nhật thất bại');
    }
  };

  const removeFromCart = async (cart_item_id) => {
    try {
      const res = await api.delete(`/cart/remove/${cart_item_id}`);
      
      if (res.data.success) {
        toast.success('Đã xóa khỏi giỏ hàng');
        fetchCart();
      }
    } catch (error) {
      toast.error('Xóa thất bại');
    }
  };

  const clearCart = async () => {
    try {
      await api.delete('/cart/clear');
      setCartItems([]);
    } catch (error) {
      console.error('Error clearing cart:', error);
    }
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = cartItems.reduce((acc, item) => {
    const price = item.price * (1 - (item.discount_percent || 0) / 100);
    return acc + (price * item.quantity);
  }, 0);

  return (
    <CartContext.Provider value={{ 
      cartItems, cartCount, cartTotal, loading, 
      addToCart, updateQuantity, removeFromCart, clearCart, fetchCart 
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
