// Interruptor accesible (role="switch") para filtros y estados activo/inactivo
export default function Switch({ checked, onChange, label, disabled = false, className = '' }) {
  return (
    <label className={`inline-flex cursor-pointer select-none items-center gap-2 text-sm text-slate-700 ${disabled ? 'cursor-not-allowed opacity-60' : ''} ${className}`}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
          checked ? 'bg-primary' : 'bg-slate-300'
        }`}
      >
        <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
      </button>
      {label && <span>{label}</span>}
    </label>
  );
}
