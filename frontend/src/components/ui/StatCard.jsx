import Skeleton from './Skeleton';

const TONOS = {
  indigo: 'bg-primary-50 text-primary',
  green: 'bg-emerald-50 text-success',
  amber: 'bg-amber-50 text-warning',
  red: 'bg-red-50 text-danger',
  sky: 'bg-sky-50 text-sky-600',
  slate: 'bg-slate-100 text-slate-600',
};

export default function StatCard({ label, value, icon: Icon, tone = 'indigo', hint, loading = false }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-500">{label}</p>
          {loading ? (
            <Skeleton className="mt-2 h-7 w-24" />
          ) : (
            <p className="mt-1 truncate text-2xl font-bold tracking-tight text-slate-900">{value}</p>
          )}
        </div>
        {Icon && (
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${TONOS[tone]}`}>
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
        )}
      </div>
      {hint && !loading && <p className="mt-2 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
