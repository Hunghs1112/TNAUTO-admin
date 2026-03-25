import { memo, useCallback } from 'react';

function TabView({ tabs, activeTab, onTabChange }) {
  const handleTabClick = useCallback(
    (tabId) => {
      onTabChange(tabId);
    },
    [onTabChange]
  );

  return (
    <div className="border-b border-slate-300/90 dark:border-slate-700/90">
      <nav className="-mb-px flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabClick(tab.id)}
              className={`inline-flex items-center gap-2 rounded-t-2xl border-b-2 px-4 py-3 text-sm font-semibold transition-all ${
                isActive
                  ? 'border-blue-600 bg-white text-blue-700 shadow-[0_10px_28px_-20px_rgba(37,99,235,0.45)] ring-1 ring-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:ring-blue-900/60'
                  : 'border-transparent text-slate-600 hover:border-slate-400 hover:bg-white/85 hover:text-slate-900 dark:text-slate-400 dark:hover:border-slate-700 dark:hover:bg-slate-800/60 dark:hover:text-slate-100'
              }`}
            >
              {Icon ? <Icon className="h-4 w-4" /> : null}
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

export default memo(TabView);
