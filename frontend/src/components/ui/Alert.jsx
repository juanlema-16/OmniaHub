import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react';

const TONOS = {
  info: { clase: 'border-sky-200 bg-sky-50 text-sky-800', icon: Info },
  success: { clase: 'border-emerald-200 bg-emerald-50 text-emerald-800', icon: CheckCircle2 },
  warning: { clase: 'border-amber-200 bg-amber-50 text-amber-800', icon: AlertTriangle },
  error: { clase: 'border-red-200 bg-red-50 text-red-800', icon: XCircle },
};

export default function Alert({ tone = 'info', title, children, action, className = '' }) {
  const { clase, icon: Icon } = TONOS[tone];
  return (
    <div className={`flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center ${clase} ${className}`} role={tone === 'error' ? 'alert' : 'status'}>
      <Icon className="h-5 w-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0 flex-1 text-sm">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className={title ? 'mt-0.5' : ''}>{children}</div>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
