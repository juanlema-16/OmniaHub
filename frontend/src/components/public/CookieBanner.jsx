import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Cookie } from 'lucide-react';
import Button from '../ui/Button';

const CLAVE = 'omniahub_cookies';

const leer = () => {
  try {
    return localStorage.getItem(CLAVE);
  } catch {
    return null;
  }
};

// Se muestra una sola vez en la parte pública; la elección queda en localStorage
export default function CookieBanner() {
  const [decidido, setDecidido] = useState(() => Boolean(leer()));
  if (decidido) return null;

  const elegir = (valor) => {
    try {
      localStorage.setItem(CLAVE, valor);
    } catch {
      // Sin almacenamiento: se oculta igual durante esta visita
    }
    setDecidido(true);
  };

  return (
    <div role="dialog" aria-label="Preferencias de cookies" className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-4">
      <div className="mx-auto flex max-w-4xl flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl sm:flex-row sm:items-center sm:p-5">
        <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 text-primary sm:flex">
          <Cookie className="h-5 w-5" aria-hidden="true" />
        </span>
        <p className="flex-1 text-sm text-slate-600">
          Usamos cookies necesarias para que el sitio funcione y, si lo permites, otras para mejorar tu experiencia. Puedes leer más en nuestra{' '}
          <Link to="/politicas/cookies" className="font-medium text-primary hover:underline">
            política de cookies
          </Link>
          .
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button variant="secondary" onClick={() => elegir('necesarias')}>
            Solo necesarias
          </Button>
          <Button onClick={() => elegir('todas')}>Aceptar todas</Button>
        </div>
      </div>
    </div>
  );
}
