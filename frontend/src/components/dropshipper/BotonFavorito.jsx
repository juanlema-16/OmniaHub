import { Heart } from 'lucide-react';

// Corazón para marcar o desmarcar un producto favorito
export default function BotonFavorito({ activo, onClick, nombre, className = '' }) {
  return (
    <button
      type="button"
      aria-pressed={Boolean(activo)}
      aria-label={activo ? `Quitar ${nombre} de favoritos` : `Agregar ${nombre} a favoritos`}
      title={activo ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className={`flex h-8 w-8 items-center justify-center rounded-full bg-white/95 shadow-sm ring-1 ring-slate-200 transition-colors hover:bg-white ${className}`}
    >
      <Heart className={`h-4 w-4 transition-colors ${activo ? 'fill-orange-500 text-orange-500' : 'text-slate-400 hover:text-orange-400'}`} aria-hidden="true" />
    </button>
  );
}
