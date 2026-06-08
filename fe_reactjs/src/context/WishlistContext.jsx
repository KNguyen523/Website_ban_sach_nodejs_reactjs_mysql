import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [wishlistCount, setWishlistCount] = useState(0);

  const fetchWishlistCount = async () => {
    try {
      const res = await api.get('/wishlist');
      if (res.data.success) {
        setWishlistCount(res.data.data.length);
      }
    } catch (error) {
      console.error('Error fetching wishlist:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchWishlistCount();
    } else {
      setWishlistCount(0);
    }
  }, [user]);

  return (
    <WishlistContext.Provider value={{ wishlistCount, refreshWishlist: fetchWishlistCount }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
