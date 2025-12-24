
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { LightBulbIcon, XMarkIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';

interface SuggestionsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  onClose: () => void;
}

export const Suggestions: React.FC<SuggestionsProps> = ({ suggestions, onSelect, onClose }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(false);

  const checkArrows = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      // Use a small tolerance for floating point inaccuracies
      setShowLeftArrow(scrollLeft > 1);
      setShowRightArrow(scrollWidth > clientWidth && scrollLeft < scrollWidth - clientWidth - 1);
    }
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    // A ResizeObserver is more efficient than a window resize event listener
    const resizeObserver = new ResizeObserver(() => checkArrows());
    resizeObserver.observe(container);
    
    // Also check when the component mounts
    checkArrows();

    return () => {
      resizeObserver.disconnect();
    };
  }, [suggestions, checkArrows]);

  const handleScroll = () => {
    checkArrows();
  };

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = scrollContainerRef.current.clientWidth * 0.7; // Scroll by 70% of visible width
      scrollContainerRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="bg-gray-850 rounded-lg p-3 sm:p-4 shadow-md">
      <div className="flex justify-between items-center mb-3 px-1">
        <div className="flex items-center gap-2">
          <LightBulbIcon className="w-5 h-5 text-yellow-400" />
          <h3 className="text-base font-semibold text-gray-200">Suggestions</h3>
        </div>
        <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-gray-700 transition-colors" aria-label="Close suggestions">
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
      <div className="relative">
        <div 
            ref={scrollContainerRef} 
            onScroll={handleScroll} 
            className="flex items-center gap-2 overflow-x-auto scroll-smooth no-scrollbar"
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => onSelect(suggestion)}
              className="flex-shrink-0 px-3 py-1.5 bg-gray-700 text-sm text-gray-200 rounded-full hover:bg-gray-600 hover:text-white transition-colors whitespace-nowrap"
            >
              {suggestion}
            </button>
          ))}
        </div>
        {showLeftArrow && (
            <button onClick={() => scroll('left')} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gray-900/80 hover:bg-gray-800 backdrop-blur-sm border border-gray-600 text-gray-300 flex items-center justify-center transition-opacity" aria-label="Scroll left">
                <ChevronLeftIcon className="w-5 h-5" />
            </button>
        )}
        {showRightArrow && (
             <button onClick={() => scroll('right')} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-8 h-8 rounded-full bg-gray-900/80 hover:bg-gray-800 backdrop-blur-sm border border-gray-600 text-gray-300 flex items-center justify-center transition-opacity" aria-label="Scroll right">
                <ChevronRightIcon className="w-5 h-5" />
            </button>
        )}
      </div>
    </div>
  );
};
