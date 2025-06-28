import React from 'react';
import { FixedSizeList as List, ListChildComponentProps } from 'react-window';
import { PerformanceMonitor } from '../utils/performanceMonitor';

interface VirtualListProps<T> {
  items: T[];
  height: number;
  width?: number;
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscanCount?: number;
  onScroll?: (scrollOffset: number) => void;
  'aria-label'?: string;
  'aria-describedby'?: string;
}

/**
 * Virtual scrolling component for efficiently rendering large lists
 * Uses react-window for performance optimization
 */
export function VirtualList<T>({
  items,
  height,
  width,
  itemHeight,
  renderItem,
  className = '',
  overscanCount = 5,
  onScroll,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedby
}: VirtualListProps<T>) {
  const timer = PerformanceMonitor.startTimer('VirtualList render');

  React.useEffect(() => {
    timer();
  });

  const handleScroll = React.useCallback(({ scrollOffset }: { scrollOffset: number }) => {
    onScroll?.(scrollOffset);
  }, [onScroll]);

  const Row = React.memo(({ index, style }: ListChildComponentProps) => {
    const item = items[index];
    if (!item) return null;

    return (
      <div style={style} role="listitem" aria-setsize={items.length} aria-posinset={index + 1}>
        {renderItem(item, index)}
      </div>
    );
  });

  Row.displayName = 'VirtualListRow';

  if (items.length === 0) {
    return (
      <div 
        className={`flex items-center justify-center ${className}`}
        style={{ height }}
        role="list"
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedby}
      >
        <p className="text-gray-500 text-sm">No items to display</p>
      </div>
    );
  }

  return (
    <div
      role="list"
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedby}
    >
      <List
        height={height}
        width={width || '100%'}
        itemCount={items.length}
        itemSize={itemHeight}
        overscanCount={overscanCount}
        onScroll={handleScroll}
        className={className}
      >
        {Row}
      </List>
    </div>
  );
}

/**
 * Hook for managing virtual list state and performance
 */
export function useVirtualList<T>(
  items: T[],
  options: {
    itemHeight: number;
    containerHeight: number;
    overscanCount?: number;
  }
) {
  const [scrollOffset, setScrollOffset] = React.useState(0);
  const [isScrolling, setIsScrolling] = React.useState(false);
  const scrollTimeoutRef = React.useRef<NodeJS.Timeout>();

  const handleScroll = React.useCallback((offset: number) => {
    setScrollOffset(offset);
    setIsScrolling(true);

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Set scrolling to false after a short delay
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, []);

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // Performance monitoring
  React.useEffect(() => {
    const timer = PerformanceMonitor.startTimer('virtual-list-update');
    return () => timer();
  }, [items.length]);

  return {
    scrollOffset,
    isScrolling,
    handleScroll,
    virtualListProps: {
      items,
      height: options.containerHeight,
      itemHeight: options.itemHeight,
      overscanCount: options.overscanCount || 5,
      onScroll: handleScroll
    }
  };
}

/**
 * Optimized conversation list component using virtual scrolling
 */
export const VirtualConversationList: React.FC<{
  conversations: Array<{ id: string; title: string; messages: any[] }>;
  currentConversationId?: string;
  onSelectConversation: (conversation: any) => void;
  onDeleteConversation: (id: string) => void;
  height: number;
}> = React.memo(({ 
  conversations, 
  currentConversationId, 
  onSelectConversation, 
  onDeleteConversation,
  height 
}) => {
  const ITEM_HEIGHT = 80; // Height of each conversation item

  const renderConversationItem = React.useCallback((conversation: any, index: number) => (
    <div
      key={conversation.id}
      className={`group relative rounded-xl transition-all duration-300 p-3 ${
        currentConversationId === conversation.id
          ? 'bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 shadow-md'
          : 'hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 hover:shadow-md'
      }`}
    >
      <button
        onClick={() => onSelectConversation(conversation)}
        className="w-full text-left focus:ring-2 focus:ring-blue-200 transition-all duration-300"
      >
        <div className="flex items-start gap-3">
          <div className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0">
            💬
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate">
              {conversation.title}
            </p>
            <p className="text-xs text-gray-500 mt-1 font-medium">
              {conversation.messages.length} messages
            </p>
          </div>
        </div>
      </button>
      
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDeleteConversation(conversation.id);
        }}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-1 text-gray-400 hover:text-red-500"
        aria-label={`Delete conversation: ${conversation.title}`}
      >
        🗑️
      </button>
    </div>
  ), [currentConversationId, onSelectConversation, onDeleteConversation]);

  return (
    <VirtualList
      items={conversations}
      height={height}
      itemHeight={ITEM_HEIGHT}
      renderItem={renderConversationItem}
      className="space-y-1"
      aria-label="Conversation list"
      aria-describedby="conversation-list-description"
    />
  );
});

VirtualConversationList.displayName = 'VirtualConversationList'; 