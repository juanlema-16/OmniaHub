import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  Boxes,
  ChartNoAxesCombined,
  CreditCard,
  FileText,
  PackageCheck,
  ShieldCheck,
  Store,
  Truck,
  UserRound,
  Warehouse,
} from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import { useAuth } from '../../context/AuthContext';
import { getBanners } from '../../api/public';
import { homeFor } from '../../utils/constants';

const ROLES = [
  { icon: Warehouse, titulo: 'Proveedor', texto: 'Publica tus productos con precio proveedor y precio sugerido, controla tu inventario y genera las guías.', tono: 'bg-indigo-50 text-primary' },
  { icon: Store, titulo: 'Dropshipper', texto: 'Importa productos a tu tienda en línea, pon tu precio y vende sin tener inventario.', tono: 'bg-emerald-50 text-success' },
  { icon: Truck, titulo: 'Transportadora', texto: 'Recibe las guías, entrega los pedidos y actualiza cada estado en el camino.', tono: 'bg-sky-50 text-sky-600' },
  { icon: UserRound, titulo: 'Cliente', texto: 'Compra en las tiendas de OmniaHub, paga contra entrega y sigue tu pedido hasta tu puerta.', tono: 'bg-amber-50 text-warning' },
  { icon: ShieldCheck, titulo: 'Administrador', texto: 'Cuida la plataforma: verifica identidades, aprueba recargas y retiros y configura las reglas.', tono: 'bg-slate-100 text-slate-600' },
];

const PASOS = [
  { n: 1, texto: 'El proveedor publica un producto' },
  { n: 2, texto: 'El dropshipper lo importa y fija su precio' },
  { n: 3, texto: 'Un cliente compra en la tienda' },
  { n: 4, texto: 'El proveedor prepara la guía' },
  { n: 5, texto: 'La transportadora entrega' },
  { n: 6, texto: 'El dinero se reparte solo' },
];

const BENEFICIOS = [
  { icon: Boxes, titulo: 'Sin inventario', texto: 'Vende primero, compra después: el proveedor despacha por ti.' },
  { icon: Truck, titulo: 'Envíos a los 22 departamentos', texto: 'Cotiza y elige entre transportadoras con tarifas por departamento.' },
  { icon: Banknote, titulo: 'Pago contra entrega', texto: 'Tus clientes pagan al recibir; el dinero llega a tu billetera al entregar.' },
  { icon: ChartNoAxesCombined, titulo: 'Ganancia a la vista', texto: 'Antes de enviar una orden ves cuánto ganas, ya con envío y comisión.' },
  { icon: BadgeCheck, titulo: 'Proveedores verificados', texto: 'Cada cuenta pasa por una verificación de identidad antes de vender.' },
  { icon: FileText, titulo: 'Facturas y reportes', texto: 'Factura automática por cada entrega y reportes listos para Excel.' },
];

function Hero({ autenticado, user }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-hover to-indigo-900 text-white">
      <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10" aria-hidden="true" />
      <div className="absolute -bottom-40 left-1/3 h-96 w-96 rounded-full bg-white/5" aria-hidden="true" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[1.2fr_1fr]">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-medium text-primary-100">
            <PackageCheck className="h-3.5 w-3.5" aria-hidden="true" /> Dropshipping y e-commerce para Guatemala
          </p>
          <h1 className="mt-5 text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
            El centro donde proveedores, emprendedores y transportadoras se conectan para vender
          </h1>
          <p className="mt-5 max-w-xl text-lg text-primary-100">Un solo flujo para publicar, vender, enviar y cobrar. Todo en quetzales y con el dinero repartido automáticamente.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            {autenticado ? (
              <Link to={homeFor(user.role)} className="inline-flex h-12 items-center gap-2 rounded-lg bg-white px-6 font-semibold text-primary shadow-sm hover:bg-primary-50">
                Ir a mi panel <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            ) : (
              <>
                <Link to="/registro" className="inline-flex h-12 items-center gap-2 rounded-lg bg-white px-6 font-semibold text-primary shadow-sm hover:bg-primary-50">
                  Crear cuenta gratis <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link to="/login" className="inline-flex h-12 items-center rounded-lg border border-white/40 px-6 font-semibold text-white hover:bg-white/10">
                  Iniciar sesión
                </Link>
              </>
            )}
          </div>
          <Link to="/tienda/chapin-store" className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-primary-100 hover:text-white">
            Ver una tienda de ejemplo <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>

        <div className="relative hidden lg:block" aria-hidden="true">
          <div className="rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary-100">Así se reparte una venta de Q 149.00</p>
            <ul className="mt-4 space-y-3 text-sm">
              {[
                ['Proveedor', 'Q 85.00'],
                ['Transportadora', 'Q 25.00'],
                ['Plataforma (3%)', 'Q 4.47'],
              ].map(([quien, monto]) => (
                <li key={quien} className="flex justify-between rounded-lg bg-white/10 px-3 py-2">
                  <span>{quien}</span>
                  <span className="font-semibold">{monto}</span>
                </li>
              ))}
              <li className="flex justify-between rounded-lg bg-emerald-400/90 px-3 py-2 font-semibold text-emerald-950">
                <span>Tu ganancia</span>
                <span>Q 34.53</span>
              </li>
            </ul>
            <p className="mt-4 flex items-center gap-2 text-xs text-primary-100">
              <CreditCard className="h-3.5 w-3.5" /> Contra entrega o tarjeta simulada
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function Banners() {
  const { data } = useAsync(() => getBanners('LANDING'), []);
  if (!data?.length) return null;
  return (
    <section className="bg-slate-50 py-10" aria-label="Novedades">
      <div className="mx-auto grid max-w-6xl gap-4 px-4 sm:px-6 md:grid-cols-2">
        {data.map((b) => {
          const interno = b.link?.startsWith('/');
          const contenido = (
            <div className="group relative flex h-48 items-end overflow-hidden rounded-2xl bg-slate-900">
              <img src={b.imagen} alt="" className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent" />
              <div className="relative p-5 text-white">
                <p className="text-lg font-bold">{b.titulo}</p>
                {b.subtitulo && <p className="text-sm text-white/85">{b.subtitulo}</p>}
              </div>
            </div>
          );
          if (!b.link) return <div key={b._id}>{contenido}</div>;
          return interno ? (
            <Link key={b._id} to={b.link}>
              {contenido}
            </Link>
          ) : (
            <a key={b._id} href={b.link} target="_blank" rel="noopener noreferrer">
              {contenido}
            </a>
          );
        })}
      </div>
    </section>
  );
}

export default function LandingPage() {
  const { autenticado, user } = useAuth();

  return (
    <>
      <Hero autenticado={autenticado} user={user} />
      <Banners />

      <section id="como-funciona" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-16 sm:px-6">
        <h2 className="text-3xl font-bold tracking-tight text-slate-900">Cómo funciona</h2>
        <p className="mt-2 max-w-2xl text-slate-600">Cinco tipos de usuario, un mismo flujo de pedidos y dinero.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ROLES.map((r) => (
            <article key={r.titulo} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${r.tono}`}>
                <r.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <h3 className="mt-4 font-semibold text-slate-900">{r.titulo}</h3>
              <p className="mt-1 text-sm text-slate-600">{r.texto}</p>
            </article>
          ))}
        </div>

        <ol className="mt-10 grid gap-3 rounded-2xl bg-slate-50 p-5 sm:grid-cols-2 lg:grid-cols-6">
          {PASOS.map((p) => (
            <li key={p.n} className="flex items-start gap-3 lg:flex-col">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">{p.n}</span>
              <span className="text-sm text-slate-700">{p.texto}</span>
            </li>
          ))}
        </ol>
      </section>

      <section id="beneficios" className="scroll-mt-20 bg-slate-50 py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">Beneficios</h2>
          <div className="mt-8 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFICIOS.map((b) => (
              <div key={b.titulo} className="flex gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-primary shadow-sm ring-1 ring-slate-200">
                  <b.icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-semibold text-slate-900">{b.titulo}</h3>
                  <p className="mt-0.5 text-sm text-slate-600">{b.texto}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {!autenticado && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="rounded-3xl bg-gradient-to-r from-primary to-indigo-700 px-6 py-12 text-center text-white sm:px-12">
            <h2 className="text-3xl font-bold tracking-tight">Empieza a vender hoy</h2>
            <p className="mx-auto mt-2 max-w-xl text-primary-100">Crea tu cuenta como proveedor o dropshipper y conéctate con todo el flujo de OmniaHub.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link to="/registro" className="inline-flex h-11 items-center rounded-lg bg-white px-6 font-semibold text-primary hover:bg-primary-50">
                Crear cuenta gratis
              </Link>
              <Link to="/login" className="inline-flex h-11 items-center rounded-lg border border-white/40 px-6 font-semibold hover:bg-white/10">
                Ya tengo cuenta
              </Link>
            </div>
          </div>
        </section>
      )}
    </>
  );
}
