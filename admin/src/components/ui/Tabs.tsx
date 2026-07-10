import { useState } from 'react';

export interface Tab {
  key: string;
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  defaultActive?: string;
}

export default function Tabs({ tabs, defaultActive }: TabsProps) {
  const [active, setActive] = useState(defaultActive || tabs[0]?.key);

  return (
    <div>
      <div className="border-b border-slate-700">
        <nav className="-mb-px flex gap-6" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={active === tab.key}
              onClick={() => setActive(tab.key)}
              className={`whitespace-nowrap border-b-2 py-3 px-1 text-sm font-medium transition-colors ${
                active === tab.key
                  ? 'border-brand-500 text-white'
                  : 'border-transparent text-slate-400 hover:border-slate-600 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      <div className="py-6">
        {tabs.find((t) => t.key === active)?.content}
      </div>
    </div>
  );
}
