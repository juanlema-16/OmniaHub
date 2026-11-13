import { Loader2 } from 'lucide-react';

export default function PageLoader({ texto = 'Cargando…' }) {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-slate-500" role="status">
      <Loader2 className="h-7 w-7 animate-spin text-primary" aria-hidden="true" />
      <span className="text-sm">{texto}</span>
    </div>
  );
}
