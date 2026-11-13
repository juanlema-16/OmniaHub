import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { homeFor } from '../../utils/constants';
import Logo from '../../components/ui/Logo';

export default function NotFoundPage() {
  const { autenticado, user } = useAuth();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 text-center">
      <Logo className="mb-10" />
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-50 text-primary">
        <Compass className="h-7 w-7" aria-hidden="true" />
      </span>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">Página no encontrada</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500">La dirección que buscas no existe o fue movida.</p>
      <Link
        to={autenticado ? homeFor(user.role) : '/login'}
        className="mt-6 inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-white hover:bg-primary-hover"
      >
        {autenticado ? 'Ir a mi panel' : 'Iniciar sesión'}
      </Link>
    </div>
  );
}
