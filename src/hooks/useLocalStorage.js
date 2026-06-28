import { useState, useCallback } from 'react';

/**
 * Custom hook for localStorage persistence with failover support.
 * @param {string} key 
 * @param {*} initialValue 
 * @returns {[any, Function]}
 */
export const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`⚠️ Failed to parse localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      setStoredValue((prev) => {
        const next = value instanceof Function ? value(prev) : value;
        try {
          window.localStorage.setItem(key, JSON.stringify(next));
        } catch (err) {
          console.warn(`⚠️ Failed to set localStorage key "${key}":`, err);
        }
        return next;
      });
    } catch (err) {
      console.error(err);
    }
  }, [key]);

  return [storedValue, setValue];
};
