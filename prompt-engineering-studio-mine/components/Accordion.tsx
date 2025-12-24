
import React, { useState } from 'react';
import type { AccordionItemProps } from '../types';
import { ChevronDownIcon, ChevronUpIcon } from './Icons';

export const AccordionItem: React.FC<AccordionItemProps> = ({ title, children, initiallyOpen = false }) => {
  const [isOpen, setIsOpen] = useState(initiallyOpen);

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-4 bg-gray-750 hover:bg-gray-700 focus:outline-none transition-colors"
      >
        <span className="text-lg font-medium text-blue-300">{title}</span>
        {isOpen ? <ChevronUpIcon className="w-5 h-5 text-gray-400" /> : <ChevronDownIcon className="w-5 h-5 text-gray-400" />}
      </button>
      {isOpen && (
        <div className="p-4 bg-gray-800 text-gray-300 border-t border-gray-700">
          {children}
        </div>
      )}
    </div>
  );
};
