import { useEffect, useState } from 'react';
import { Hexagon, Server, Database, Loader2 } from 'lucide-react';
import { getHealth } from '../../api/health';
import { getErrorMessage } from '../../api/axios';

const StatusRow = ({ icon: Icon, label, ok, text }) => (
  <div className="flex items-center justify-between rounded-lg border border-slate-200 px-4 py-3">
    <div className="flex items-center gap-3 text-sm font-medium text-slate-700">
      <Icon className="h-4 w-4 text-slate-500" />
      {label}
    </div>
    <span
      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
        ok ? 'bg-emerald-50 text-success' : 'bg-red-50 text-danger'
      }`}
    >
      {text}
    </span>
  </div>
);

export default function Landing() {
  const [health, setHealth] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getHealth()
      .then(setHealth)
      .catch((err) => setError(getErrorMessage(err)));
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 flex items-center gap-2">
          <Hexagon className="h-8 w-8 fill-primary text-primary" />
          <span className="text-2xl font-bold tracking-tight text-slate-900">
            Omnia<span className="text-primary">Hub</span>
          </span>
        </div>
        <p className="mb-6 text-sm text-slate-600">
          El centro donde proveedores, emprendedores y transportadoras se conectan para vender.
        </p>

        {!health && !error && (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Comprobando la API…
          </div>
        )}

        {error && <StatusRow icon={Server} label="API" ok={false} text={error} />}

        {health && (
          <div className="space-y-3">
            <StatusRow icon={Server} label="API" ok text="API conectada" />
            <StatusRow
              icon={Database}
              label="MongoDB Atlas"
              ok={health.db === 'conectada'}
              text={health.db === 'conectada' ? 'Base de datos conectada' : 'Base de datos desconectada'}
            />
          </div>
        )}
      </section>
    </main>
  );
}
