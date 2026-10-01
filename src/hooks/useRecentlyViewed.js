import { useState, useEffect } from 'react';

const STORAGE_KEY = 'mahalaxmi_recently_viewed';
const MAX_ITEMS = 6;

export default function useRecentlyViewed() {
  const [recent, setRecent] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(recent));
  }, [recent]);

  const addRecentlyViewed = (product) => {
    if (!product?.id) return;
    setRecent((prev) => {
      const filtered = prev.filter((p) => p.id !== product.id);
      return [product, ...filtered].slice(0, MAX_ITEMS);
    });
  };

  const clearRecentlyViewed = () => {
    setRecent([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return { recent, addRecentlyViewed, clearRecentlyViewed };
}
