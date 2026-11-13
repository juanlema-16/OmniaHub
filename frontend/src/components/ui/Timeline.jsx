import { ORDER_STATUS } from '../../utils/constants';
import { formatFechaHora } from '../../utils/dates';
import { DOT } from './Badge';

// items: [{ estado, fecha, nota, usuario?: { nombre, apellido, role } }] en orden cronológico
export default function Timeline({ items = [] }) {
  return (
    <ol className="relative space-y-5">
      {items.map((item, i) => {
        const s = ORDER_STATUS[item.estado] ?? { label: item.estado, tone: 'slate' };
        const ultimo = i === items.length - 1;
        return (
          <li key={`${item.estado}-${item.fecha}-${i}`} className="relative flex gap-3">
            {!ultimo && <span className="absolute left-[7px] top-5 h-[calc(100%+0.5rem)] w-px bg-slate-200" aria-hidden="true" />}
            <span className={`relative mt-1 h-[15px] w-[15px] shrink-0 rounded-full ring-4 ring-white ${DOT[s.tone]}`} aria-hidden="true" />
            <div className="min-w-0">
              <p className={`text-sm font-semibold ${ultimo ? 'text-slate-900' : 'text-slate-700'}`}>{s.label}</p>
              <p className="text-xs text-slate-500">
                {formatFechaHora(item.fecha)}
                {item.usuario?.nombre && ` · ${item.usuario.nombre} ${item.usuario.apellido ?? ''}`}
              </p>
              {item.nota && <p className="mt-1 text-sm text-slate-600">{item.nota}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
