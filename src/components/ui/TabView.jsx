import { memo, useCallback } from 'react';

function TabView({ tabs, activeTab, onTabChange }) {
  const handleTabClick = useCallback(
    (tabId) => {
      onTabChange(tabId);
    },
    [onTabChange]
  );

  return (
    <div className="border-b border-slate-700/90">
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
                  ? 'border-[#1e406b] bg-slate-900 text-[#eecd7e] shadow-[0_10px_28px_-20px_rgba(37,99,235,0.45)] ring-1 ring-[#1e406b]/20'
                  : 'border-transparent text-slate-400 hover:border-slate-600 hover:bg-slate-900/80 hover:text-slate-100'
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
