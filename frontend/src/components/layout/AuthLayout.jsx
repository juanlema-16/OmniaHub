import { Link } from 'react-router-dom';
import { Package, Store, Truck, Wallet } from 'lucide-react';
import Logo from '../ui/Logo';
import ThemeToggle from '../ui/ThemeToggle';

const PUNTOS = [
  { icon: Package, texto: 'Proveedores publican productos verificados' },
  { icon: Store, texto: 'Emprendedores venden sin inventario en su tienda' },
  { icon: Truck, texto: 'Envíos a los 22 departamentos de Guatemala' },
  { icon: Wallet, texto: 'Pagos repartidos automáticamente al entregar' },
];

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="flex min-h-screen bg-surface">
      <aside className="relative hidden w-[44%] max-w-xl flex-col justify-between overflow-hidden bg-gradient-to-br from-primary via-primary-hover to-indigo-900 p-10 text-white lg:flex">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-white/10" aria-hidden="true" />
        <div className="absolute -bottom-32 -left-16 h-80 w-80 rounded-full bg-white/5" aria-hidden="true" />
        <Link to="/" className="relative">
          <Logo claro />
        </Link>
        <div className="relative">
          <h2 className="text-3xl font-bold leading-tight">El centro donde proveedores, emprendedores y transportadoras se conectan para vender.</h2>
          <ul className="mt-8 space-y-4">
            {PUNTOS.map(({ icon: Icon, texto }) => (
              <li key={texto} className="flex items-center gap-3 text-primary-100">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15">
                  <Icon className="h-4 w-4 text-white" aria-hidden="true" />
                </span>
                {texto}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-primary-100">© {new Date().getFullYear()} OmniaHub · Hecho para Guatemala</p>
      </aside>

      <main className="relative flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
        <ThemeToggle className="absolute right-4 top-4" />
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 inline-block lg:hidden">
            <Logo />
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-slate-500">{subtitle}</p>}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-6 text-center text-sm text-slate-600">{footer}</div>}
        </div>
      </main>
    </div>
  );
}
