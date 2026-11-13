// tabs: [{ value, label, count? }]
export default function Tabs({ tabs, value, onChange, className = '' }) {
  return (
    <div className={`overflow-x-auto overflow-y-hidden border-b border-slate-200 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}>
      <nav className="-mb-px flex min-w-max gap-1" role="tablist">
        {tabs.map((t) => {
          const activo = t.value === value;
          return (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={activo}
              onClick={() => onChange(t.value)}
              className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                activo ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700'
              }`}
            >
              {t.label}
              {t.count !== undefined && (
                <span className={`rounded-full px-2 py-0.5 text-xs ${activo ? 'bg-primary-50 text-primary' : 'bg-slate-100 text-slate-600'}`}>{t.count}</span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
