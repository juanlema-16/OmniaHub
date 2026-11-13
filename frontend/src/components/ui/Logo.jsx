// Hexágono con nodos conectados: la identidad de OmniaHub (sección 9)
export function LogoMark({ className = 'h-8 w-8' }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden="true">
      <path d="M16 2.5 27.7 9.25v13.5L16 29.5 4.3 22.75V9.25z" fill="currentColor" />
      <circle cx="16" cy="16" r="3.2" fill="#fff" />
      <circle cx="16" cy="8.5" r="2" fill="#fff" />
      <circle cx="22.5" cy="20" r="2" fill="#fff" />
      <circle cx="9.5" cy="20" r="2" fill="#fff" />
      <path d="M16 10.5v2.3M20.8 19l-2-1.2M11.2 19l2-1.2" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export default function Logo({ className = '', claro = false }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <LogoMark className={`h-8 w-8 ${claro ? 'text-white' : 'text-primary'}`} />
      <span className={`text-xl font-bold tracking-tight ${claro ? 'text-white' : 'text-slate-900'}`}>
        Omnia<span className={claro ? 'text-primary-100' : 'text-primary'}>Hub</span>
      </span>
    </span>
  );
}
