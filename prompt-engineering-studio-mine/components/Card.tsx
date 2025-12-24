
import React from 'react';
import type { CardProps } from '../types';

export const Card: React.FC<CardProps> = ({ title, children, className }) => {
  return (
    <div className={`bg-gray-800 shadow-xl rounded-lg p-6 ${className || ''}`}>
      {title && <h3 className="text-xl font-semibold text-blue-400 mb-4">{title}</h3>}
      <div className="text-gray-300 space-y-3">{children}</div>
    </div>
  );
};
