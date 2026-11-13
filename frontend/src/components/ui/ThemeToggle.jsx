import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

// Interruptor sol/luna para el header y la parte pública
export default function ThemeToggle({ className = '' }) {
  const { oscuro, alternar } = useTheme();
  return (
    <button
      type="button"
      onClick={alternar}
      aria-pressed={oscuro}
      aria-label={oscuro ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={oscuro ? 'Modo claro' : 'Modo oscuro'}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-primary ${className}`}
    >
      {oscuro ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
    </button>
  );
}
