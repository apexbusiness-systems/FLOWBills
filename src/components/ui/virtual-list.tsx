import { useCallback, useEffect, useRef, useState, ReactElement } from 'react';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => ReactElement;
  overscan?: number;
  className?: string;
}

/**
 * Virtual List Component - O(1) rendering for large datasets
 * Only renders visible items + overscan buffer
 * Reduces O(n) render complexity to O(visible items)
 */
export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 3,
  className = '',
}: VirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={startIndex + index} style={{ height: itemHeight }}>
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Auto-sizing Virtual List - dynamically calculates item heights
 */
interface AutoVirtualListProps<T> {
  items: T[];
  containerHeight: number;
  renderItem: (item: T, index: number) => ReactElement;
  estimatedItemHeight?: number;
  overscan?: number;
  className?: string;
}

export function AutoVirtualList<T>({
  items,
  containerHeight,
  renderItem,
  estimatedItemHeight = 50,
  overscan = 3,
  className = '',
}: AutoVirtualListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const [itemHeights, setItemHeights] = useState<number[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Measure item heights
  useEffect(() => {
    const heights: number[] = [];
    itemRefs.current.forEach((element, index) => {
      if (element) {
        heights[index] = element.offsetHeight;
      }
    });
    if (heights.length > 0) {
      setItemHeights(heights);
    }
  }, [items]);

  const getItemHeight = (index: number) => {
    return itemHeights[index] || estimatedItemHeight;
  };

  const getItemOffset = (index: number) => {
    let offset = 0;
    for (let i = 0; i < index; i++) {
      offset += getItemHeight(i);
    }
    return offset;
  };

  // Calculate visible range
  let startIndex = 0;
  let accumulatedHeight = 0;
  
  for (let i = 0; i < items.length; i++) {
    const height = getItemHeight(i);
    if (accumulatedHeight + height > scrollTop) {
      startIndex = Math.max(0, i - overscan);
      break;
    }
    accumulatedHeight += height;
  }

  let endIndex = startIndex;
  accumulatedHeight = getItemOffset(startIndex);
  
  for (let i = startIndex; i < items.length; i++) {
    const height = getItemHeight(i);
    accumulatedHeight += height;
    if (accumulatedHeight > scrollTop + containerHeight) {
      endIndex = Math.min(items.length - 1, i + overscan);
      break;
    }
  }

  const visibleItems = items.slice(startIndex, endIndex + 1);
  const totalHeight = getItemOffset(items.length);
  const offsetY = getItemOffset(startIndex);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => {
            const actualIndex = startIndex + index;
            return (
              <div
                key={actualIndex}
                ref={(el) => {
                  if (el) itemRefs.current.set(actualIndex, el);
                  else itemRefs.current.delete(actualIndex);
                }}
              >
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
