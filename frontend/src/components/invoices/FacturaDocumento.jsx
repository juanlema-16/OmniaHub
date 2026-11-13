import { createPortal } from 'react-dom';
import { LogoMark } from '../ui/Logo';
import { formatQ } from '../../utils/formatQ';
import { formatFechaHora } from '../../utils/dates';

// Documento de la factura (misma vista en pantalla y al imprimir)
export function FacturaDocumento({ factura }) {
  const f = factura;
  return (
    <article className="bg-white text-slate-800">
      <header className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2">
          <LogoMark className="h-9 w-9 text-primary" />
          <div>
            <p className="text-lg font-bold text-slate-900">
              Omnia<span className="text-primary">Hub</span>
            </p>
            <p className="text-xs text-slate-500">Factura electrónica de demostración</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs uppercase tracking-wide text-slate-500">Factura</p>
          <p className="text-xl font-bold text-slate-900">{f.numero}</p>
          <p className="text-xs text-slate-500">{formatFechaHora(f.fecha)}</p>
        </div>
      </header>

      <section className="grid gap-4 py-4 sm:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Emisor</p>
          <p className="font-medium text-slate-900">{f.emisor.nombre}</p>
          <p className="text-sm text-slate-600">NIT: {f.emisor.nit || 'CF'}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Receptor</p>
          <p className="font-medium text-slate-900">{f.receptor.nombre}</p>
          <p className="text-sm text-slate-600">NIT: {f.receptor.nit || 'CF'}</p>
        </div>
        {f.order && (
          <p className="text-sm text-slate-600 sm:col-span-2">
            Orden {f.order.numero}
            {f.order.guia && ` · Guía ${f.order.guia}`}
            {f.order.destino && ` · ${f.order.destino.municipio}, ${f.order.destino.departamento}`}
          </p>
        )}
        {f.posSale && <p className="text-sm text-slate-600 sm:col-span-2">Venta en punto de venta · {f.posSale.metodoPago === 'TARJETA' ? 'Tarjeta' : 'Efectivo'}</p>}
      </section>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-y border-slate-200 bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
              <th className="px-3 py-2 font-semibold">Descripción</th>
              <th className="px-3 py-2 text-right font-semibold">Cant.</th>
              <th className="px-3 py-2 text-right font-semibold">Precio</th>
              <th className="px-3 py-2 text-right font-semibold">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {f.items.map((i, idx) => (
              <tr key={idx}>
                <td className="px-3 py-2">{i.descripcion}</td>
                <td className="px-3 py-2 text-right">{i.cantidad}</td>
                <td className="px-3 py-2 text-right">{formatQ(i.precioUnitario)}</td>
                <td className="px-3 py-2 text-right font-medium">{formatQ(i.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <dl className="ml-auto mt-4 w-full max-w-xs space-y-1 text-sm">
        <div className="flex justify-between text-slate-600">
          <dt>Subtotal</dt>
          <dd>{formatQ(f.subtotal)}</dd>
        </div>
        {f.descuento > 0 && (
          <div className="flex justify-between text-slate-600">
            <dt>Descuento</dt>
            <dd>− {formatQ(f.descuento)}</dd>
          </div>
        )}
        <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold text-slate-900">
          <dt>Total</dt>
          <dd>{formatQ(f.total)}</dd>
        </div>
      </dl>
    </article>
  );
}

// Copia para imprimir: se monta directo en el body y el CSS global oculta todo lo demás al imprimir
export function FacturaParaImprimir({ factura }) {
  return createPortal(
    <div className="print-only-root p-8">
      <FacturaDocumento factura={factura} />
    </div>,
    document.body
  );
}
