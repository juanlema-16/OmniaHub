import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import { formatFechaHora } from '../../utils/dates';
import { ROLES } from '../../utils/constants';

// Siglas que deben ir siempre en mayúsculas al convertir RECARGA_APROBADA → "Recarga aprobada"
const SIGLAS = { kyc: 'KYC', pos: 'POS', nit: 'NIT', dpi: 'DPI' };

export const accionLegible = (accion = '') => {
  const texto = accion.toLowerCase().replace(/_/g, ' ').replace(/\b(kyc|pos|nit|dpi)\b/g, (s) => SIGLAS[s]);
  return texto.charAt(0).toUpperCase() + texto.slice(1);
};

const esFecha = (v) => typeof v === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(v);

// Muestra cualquier valor del detalle: texto, números, listas y objetos anidados
function Valor({ valor }) {
  if (valor === null || valor === undefined || valor === '') return <span className="text-slate-400">—</span>;
  if (typeof valor === 'boolean') return <span>{valor ? 'Sí' : 'No'}</span>;
  if (esFecha(valor)) return <span>{formatFechaHora(valor)}</span>;
  if (Array.isArray(valor)) {
    return valor.length ? (
      <ul className="list-disc space-y-0.5 pl-4">
        {valor.map((v, i) => (
          <li key={i}>
            <Valor valor={v} />
          </li>
        ))}
      </ul>
    ) : (
      <span className="text-slate-400">Vacío</span>
    );
  }
  if (typeof valor === 'object') {
    return (
      <dl className="space-y-1 border-l-2 border-slate-100 pl-3">
        {Object.entries(valor).map(([k, v]) => (
          <div key={k}>
            <dt className="text-xs font-medium text-slate-500">{accionLegible(k)}</dt>
            <dd className="text-sm text-slate-800">
              <Valor valor={v} />
            </dd>
          </div>
        ))}
      </dl>
    );
  }
  return <span className="break-words">{String(valor)}</span>;
}

export default function AuditoriaDetalle({ registro, onClose }) {
  const tieneDetalle = registro?.detalle && Object.keys(registro.detalle).length > 0;
  return (
    <Modal open={Boolean(registro)} onClose={onClose} size="lg" title={registro ? accionLegible(registro.accion) : 'Detalle'} description={registro ? formatFechaHora(registro.fecha) : undefined}>
      {registro && (
        <div className="space-y-4">
          <dl className="grid gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Quién</dt>
              <dd className="mt-0.5 text-sm text-slate-800">
                {registro.user ? (
                  <>
                    {registro.user.nombre} {registro.user.apellido} <Badge tone="indigo">{ROLES[registro.user.role]?.label}</Badge>
                    <span className="block text-xs text-slate-500">{registro.user.email}</span>
                  </>
                ) : (
                  'Sistema'
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Sobre qué</dt>
              <dd className="mt-0.5 text-sm text-slate-800">
                {registro.entidad}
                {registro.entidadId && <span className="block break-all text-xs text-slate-500">{registro.entidadId}</span>}
              </dd>
            </div>
          </dl>
          {registro.resumen && <p className="rounded-lg bg-primary-50 px-3 py-2 text-sm font-medium text-slate-800">{registro.resumen}</p>}
          <div>
            <h3 className="mb-2 text-sm font-semibold text-slate-900">Detalle</h3>
            {tieneDetalle ? (
              <div className="rounded-lg bg-slate-50 p-3 text-sm">
                <Valor valor={registro.detalle} />
              </div>
            ) : (
              <p className="text-sm text-slate-500">Este registro no tiene información adicional.</p>
            )}
          </div>
        </div>
      )}
    </Modal>
  );
}
