import React, { createContext, useContext, useState, useEffect } from 'react';
import { SearchResult } from '../services/api';

interface FavoritesContextType {
  favorites: SearchResult[];
  addFavorite: (website: SearchResult) => void;
  removeFavorite: (url: string) => void;
  isFavorite: (url: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [favorites, setFavorites] = useState<SearchResult[]>(() => {
    const saved = localStorage.getItem('favorites');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  const addFavorite = (website: SearchResult) => {
    setFavorites(prev => [...prev, website]);
  };

  const removeFavorite = (url: string) => {
    setFavorites(prev => prev.filter(fav => fav.url !== url));
  };

  const isFavorite = (url: string) => {
    return favorites.some(fav => fav.url === url);
  };

  return (
    <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
};

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}; 