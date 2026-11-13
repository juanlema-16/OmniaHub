// Hexágono con nodos conectados: la identidad de OmniaHub (sección 9).
// variante "normal": hexágono de color con nodos blancos. variante "claro" (fondos índigo u oscuros): hexágono blanco
// con los nodos en índigo, para que el dibujo interior no se pierda.
export function LogoMark({ className = 'h-8 w-8', variante = 'normal' }) {
  const claro = variante === 'claro';
  const nodos = claro ? '#4f46e5' : '#fff';
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path d="M16 2.5 27.7 9.25v13.5L16 29.5 4.3 22.75V9.25z" fill={claro ? '#fff' : 'currentColor'} />
      <circle cx="16" cy="16" r="3.2" fill={nodos} />
      <circle cx="16" cy="8.5" r="2" fill={nodos} />
      <circle cx="22.5" cy="20" r="2" fill={nodos} />
      <circle cx="9.5" cy="20" r="2" fill={nodos} />
      <path d="M16 10.5v2.3M20.8 19l-2-1.2M11.2 19l2-1.2" stroke={nodos} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default function Logo({ className = '', variante = 'normal' }) {
  const claro = variante === 'claro';
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark variante={variante} className={`h-8 w-8 ${claro ? '' : 'text-primary'}`} />
      <span className={`text-xl font-bold tracking-tight ${claro ? 'text-white' : 'text-slate-900'}`}>
        Omnia<span className={claro ? 'text-primary-100' : 'text-primary'}>Hub</span>
      </span>
    </span>
  );
}
