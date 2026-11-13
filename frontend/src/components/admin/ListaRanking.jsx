import Card from '../ui/Card';
import Skeleton from '../ui/Skeleton';
import EmptyState from '../ui/EmptyState';

// Ranking con barra proporcional. items: [{ key, valor, ...datos }]; render(item) dibuja el contenido de cada fila
export default function ListaRanking({ titulo, icon, items, cargando, vacio, render }) {
  const max = Math.max(1, ...items.map((i) => i.valor));
  return (
    <Card title={titulo}>
      {cargando && (
        <div className="space-y-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      )}
      {!cargando && !items.length && <EmptyState icon={icon} title="Sin datos en el período" description={vacio} compact />}
      {!cargando && items.length > 0 && (
        <ol className="space-y-4">
          {items.map((item, i) => (
            <li key={item.key}>
              <div className="flex items-center gap-3">
                <span className="w-4 text-xs font-semibold text-slate-400">{i + 1}</span>
                {render(item)}
              </div>
              <div className="ml-7 mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-primary" style={{ width: `${(item.valor / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
