import { memo, useCallback } from 'react';

/**
 * TabView Component - Responsive tabs component
 * Optimized with React.memo to prevent unnecessary rerenders
 * @param {Array} tabs - Array of tab objects with { id, label, icon (optional) }
 * @param {string} activeTab - Currently active tab id
 * @param {Function} onTabChange - Callback when tab changes
 */
function TabView({ tabs, activeTab, onTabChange }) {
  const handleTabClick = useCallback((tabId) => {
    onTabChange(tabId);
  }, [onTabChange]);

  return (
    <div className="border-b border-gray-200">
      <nav className="flex flex-wrap -mb-px gap-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={`
                flex items-center gap-2 px-4 py-2.5 border-b-2 font-medium text-sm transition-all
                ${isActive 
                  ? 'border-blue-600 text-blue-600 bg-blue-50/50' 
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 hover:bg-gray-50/50'
                }
                whitespace-nowrap rounded-t-lg
              `}
            >
              {Icon && <Icon className="w-4 h-4" />}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default memo(TabView);

