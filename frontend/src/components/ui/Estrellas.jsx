import { Star } from 'lucide-react';

// Muestra una calificación de 0 a 5 (admite medias estrellas visuales por relleno proporcional)
export default function Estrellas({ valor = 0, size = 'h-4 w-4', className = '' }) {
  return (
    <span className={`inline-flex items-center gap-0.5 ${className}`} role="img" aria-label={`${valor} de 5 estrellas`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const relleno = Math.max(0, Math.min(1, valor - (n - 1)));
        return (
          <span key={n} className={`relative inline-block ${size}`} aria-hidden="true">
            <Star className={`absolute inset-0 ${size} text-slate-300`} />
            <span className="absolute inset-0 overflow-hidden" style={{ width: `${relleno * 100}%` }}>
              <Star className={`${size} fill-amber-400 text-amber-400`} />
            </span>
          </span>
        );
      })}
    </span>
  );
}

// Promedio con cantidad: ★★★★☆ 4.5 (12)
export function ResumenEstrellas({ rating, size }) {
  if (!rating?.cantidad) return <span className="text-xs text-slate-400">Sin reseñas</span>;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
      <Estrellas valor={rating.promedio} size={size} />
      <span className="font-semibold text-slate-700">{rating.promedio.toFixed(1)}</span>
      <span>({rating.cantidad})</span>
    </span>
  );
}

// Selector de estrellas accesible (radiogroup)
export function EstrellasInput({ valor, onChange, error }) {
  return (
    <div role="radiogroup" aria-label="Calificación" className="inline-flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={valor === n}
          aria-label={`${n} ${n === 1 ? 'estrella' : 'estrellas'}`}
          onClick={() => onChange(n)}
          className="rounded p-0.5 focus-visible:outline-2 focus-visible:outline-primary"
        >
          <Star className={`h-7 w-7 transition-colors ${n <= valor ? 'fill-amber-400 text-amber-400' : error ? 'text-danger' : 'text-slate-300 hover:text-amber-300'}`} />
        </button>
      ))}
    </div>
  );
}
