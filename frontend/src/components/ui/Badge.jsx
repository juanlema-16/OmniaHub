import { KYC_STATUS, ORDER_STATUS } from '../../utils/constants';

const TONOS = {
  slate: 'bg-slate-100 text-slate-700 ring-slate-200',
  indigo: 'bg-primary-50 text-primary ring-primary-100',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  amber: 'bg-amber-50 text-amber-700 ring-amber-200',
  orange: 'bg-orange-50 text-orange-700 ring-orange-200',
  red: 'bg-red-50 text-red-700 ring-red-200',
  sky: 'bg-sky-50 text-sky-700 ring-sky-200',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200',
};

export const DOT = {
  slate: 'bg-slate-400',
  indigo: 'bg-primary',
  green: 'bg-success',
  amber: 'bg-warning',
  orange: 'bg-orange-500',
  red: 'bg-danger',
  sky: 'bg-sky-500',
  violet: 'bg-violet-500',
};

export default function Badge({ tone = 'slate', dot = false, children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${TONOS[tone]} ${className}`}>
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${DOT[tone]}`} aria-hidden="true" />}
      {children}
    </span>
  );
}

export function OrderStatusBadge({ estado }) {
  const s = ORDER_STATUS[estado] ?? { label: estado, tone: 'slate' };
  return (
    <Badge tone={s.tone} dot>
      {s.label}
    </Badge>
  );
}

export function KycBadge({ status }) {
  const s = KYC_STATUS[status] ?? KYC_STATUS.no_enviado;
  return <Badge tone={s.tone}>{s.label}</Badge>;
}
