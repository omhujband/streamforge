import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to calculate windowed virtualization parameters.
 * Throttles scroll observations using requestAnimationFrame to prevent layout thrashing.
 */
export const useVirtualized = ({ itemCount, rowHeight = 36, buffer = 8 }) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(500);
  const containerRef = useRef(null);
  const scrollFrameRef = useRef(null);

  // Dynamic Viewport Resize Observer
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    setViewportHeight(container.clientHeight || 500);

    const observer = new ResizeObserver((entries) => {
      if (entries && entries[0]) {
        const height = entries[0].contentRect.height || entries[0].target.clientHeight;
        setViewportHeight(height);
      }
    });

    observer.observe(container);
    return () => {
      observer.disconnect();
    };
  }, []);

  // Passive Scroll Handler throttled by requestAnimationFrame
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (scrollFrameRef.current) {
        cancelAnimationFrame(scrollFrameRef.current);
      }
      scrollFrameRef.current = requestAnimationFrame(() => {
        setScrollTop(container.scrollTop);
      });
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    
    // Initial scroll offset sync
    setScrollTop(container.scrollTop);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      if (scrollFrameRef.current) {
        cancelAnimationFrame(scrollFrameRef.current);
      }
    };
  }, []);

  // Compute visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - buffer);
  const endIndex = Math.min(itemCount - 1, Math.floor((scrollTop + viewportHeight) / rowHeight) + buffer);

  const totalHeight = itemCount * rowHeight;

  return {
    containerRef,
    startIndex,
    endIndex,
    totalHeight,
    viewportHeight
  };
};
