
import React from 'react';
import { SparklesIcon } from './Icons'; // Main app icon

export interface NavItem {
  name: string;
  icon: React.ReactNode;
}

interface SidebarProps {
  navItems: NavItem[];
  activeItem: string;
  onNavItemClick: (itemName: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ navItems, activeItem, onNavItemClick }) => {
  return (
    <div className="w-64 bg-gray-800 p-4 space-y-6 flex flex-col h-full shadow-lg">
      <div className="flex items-center space-x-3 p-2 mb-4">
        <SparklesIcon className="h-10 w-10 text-blue-400" />
        <h1 className="text-xl font-semibold text-white">Prompt Studio</h1>
      </div>
      <nav className="flex-grow">
        {navItems.map((item) => (
          <button
            key={item.name}
            onClick={() => onNavItemClick(item.name)}
            className={`w-full flex items-center py-2.5 px-4 rounded-lg transition-colors duration-200 ease-in-out
                        ${activeItem === item.name
                          ? 'bg-blue-600 text-white shadow-md'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        }`}
          >
            {item.icon}
            <span className="text-sm font-medium">{item.name}</span>
          </button>
        ))}
      </nav>
      <div className="mt-auto p-2 text-center text-xs text-gray-500">
        <p>&copy; 2024 Prompt Engineering Studio</p>
        <p>Maximize AI Productivity</p>
      </div>
    </div>
  );
};
