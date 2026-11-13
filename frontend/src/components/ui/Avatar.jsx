const iniciales = (nombre = '', apellido = '') => `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase() || 'OH';

export default function Avatar({ nombre, apellido, src, size = 'md' }) {
  const tam = size === 'sm' ? 'h-8 w-8 text-xs' : size === 'lg' ? 'h-14 w-14 text-lg' : 'h-9 w-9 text-sm';
  if (src) return <img src={src} alt="" className={`${tam} rounded-full object-cover`} />;
  return (
    <span className={`${tam} inline-flex shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-white`} aria-hidden="true">
      {iniciales(nombre, apellido)}
    </span>
  );
}
