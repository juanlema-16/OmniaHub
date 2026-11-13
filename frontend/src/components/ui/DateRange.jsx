import { CalendarDays } from 'lucide-react';
import { haceDiasISO, isoDate } from '../../utils/dates';

const RAPIDOS = [
  { dias: 7, label: '7 días' },
  { dias: 30, label: '30 días' },
  { dias: 90, label: '90 días' },
];

const INPUT =
  'h-9 rounded-lg border border-slate-300 bg-white px-2.5 text-sm text-slate-700 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-100';

// Filtro de período { desde, hasta } en formato AAAA-MM-DD, con accesos rápidos
export default function DateRange({ value, onChange }) {
  const hoy = isoDate();
  const activo = (dias) => value.hasta === hoy && value.desde === haceDiasISO(dias);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
        {RAPIDOS.map((r) => (
          <button
            key={r.dias}
            type="button"
            onClick={() => onChange({ desde: haceDiasISO(r.dias), hasta: hoy })}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${activo(r.dias) ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100'}`}
          >
            {r.label}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-1.5">
        <CalendarDays className="h-4 w-4 text-slate-400" aria-hidden="true" />
        <input type="date" aria-label="Desde" className={INPUT} value={value.desde} max={value.hasta} onChange={(e) => e.target.value && onChange({ ...value, desde: e.target.value })} />
        <span className="text-slate-400">—</span>
        <input type="date" aria-label="Hasta" className={INPUT} value={value.hasta} min={value.desde} max={hoy} onChange={(e) => e.target.value && onChange({ ...value, hasta: e.target.value })} />
      </div>
    </div>
  );
}
