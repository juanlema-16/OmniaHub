import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate, useOutletContext } from 'react-router-dom';
import toast from 'react-hot-toast';
import { BadgeCheck, Banknote, Clock, CreditCard, MapPin, Tag, Truck, X, Zap } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import useValidarCarrito from '../../hooks/useValidarCarrito';
import AvisosCarrito from '../../components/store/AvisosCarrito';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { checkStoreCoupon, storeCheckout } from '../../api/store';
import { quoteShipping } from '../../api/shipping';
import { getErrorMessage } from '../../api/axios';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Textarea from '../../components/ui/Textarea';
import Alert from '../../components/ui/Alert';
import Skeleton from '../../components/ui/Skeleton';
import { DEPARTAMENTOS, ROLES } from '../../utils/constants';
import { municipiosDe } from '../../utils/municipios';
import { formatQ } from '../../utils/formatQ';
import { erroresDeApi, reglas, validar } from '../../utils/validation';
import { plural } from '../../utils/plural';

const ESQUEMA = {
  nombres: [reglas.requerido('El nombre'), reglas.minimo('El nombre', 2)],
  apellidos: [reglas.requerido('El apellido'), reglas.minimo('El apellido', 2)],
  telefono: [reglas.requerido('El teléfono'), reglas.telefono],
  email: [reglas.email],
  departamento: [(v) => (!v ? 'Selecciona el departamento' : null)],
  municipio: [(v) => (!v ? 'Selecciona el municipio' : null)],
  direccion: [reglas.requerido('La dirección', 'a'), reglas.minimo('La dirección', 5)],
  transportadora: [(v) => (!v ? 'Elige una transportadora' : null)],
};

const solo8 = (t) => String(t || '').replace(/\D/g, '').slice(-8);

const PAGOS = [
  { value: 'CONTRAENTREGA', label: 'Contra entrega', detalle: 'Pagas en efectivo cuando recibes tu pedido', icon: Banknote },
  { value: 'TARJETA', label: 'Tarjeta (simulada)', detalle: 'Pago de demostración: no se cobra nada ni pedimos datos de tarjeta', icon: CreditCard },
];

// Quien no puede comprar todavía: sin sesión o con una cuenta que no es de cliente
function AccesoCliente({ slug }) {
  const { autenticado, user, logout } = useAuth();
  const location = useLocation();
  const from = location.pathname;

  if (!autenticado) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary-50 text-primary">
            <BadgeCheck className="h-6 w-6" aria-hidden="true" />
          </span>
          <h1 className="mt-4 text-xl font-bold text-slate-900">Inicia sesión para comprar</h1>
          <p className="mt-1 text-sm text-slate-600">Necesitas una cuenta de cliente para hacer tu pedido y seguirlo después. Tu carrito se conserva.</p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
            <Link to="/login" state={{ from }} className="inline-flex h-11 items-center justify-center rounded-lg bg-primary px-5 text-sm font-medium text-white hover:bg-primary-hover">
              Iniciar sesión
            </Link>
            <Link to="/registro" state={{ from }} className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 px-5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Crear cuenta de cliente
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <Alert tone="warning" title={`Entraste como ${ROLES[user.role]?.label || user.role}`}>
        Para comprar en la tienda necesitas una cuenta de cliente.
        <div className="mt-3 flex gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              logout();
            }}
          >
            Cerrar sesión
          </Button>
          <Link to={`/tienda/${slug}`} className="inline-flex h-8 items-center rounded-lg px-3 text-xs font-medium text-amber-900 hover:bg-amber-100">
            Volver a la tienda
          </Link>
        </div>
      </Alert>
    </div>
  );
}

export default function CheckoutPage() {
  const { slug } = useOutletContext();
  const { autenticado, user } = useAuth();
  const navigate = useNavigate();
  const carrito = useCart(slug);
  const { validando: revisandoCarrito, revalidar } = useValidarCarrito(slug);

  const [form, setForm] = useState({ nombres: '', apellidos: '', telefono: '', email: '', departamento: '', municipio: '', direccion: '', referencias: '', transportadora: '' });
  const [metodoPago, setMetodoPago] = useState('CONTRAENTREGA');
  const [codigo, setCodigo] = useState('');
  const [cupon, setCupon] = useState(null);
  const [errorCupon, setErrorCupon] = useState('');
  const [validando, setValidando] = useState(false);
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const terminado = useRef(false);

  // Datos de contacto de la cuenta, editables
  useEffect(() => {
    if (user?.role === 'cliente') {
      setForm((f) => ({ ...f, nombres: f.nombres || user.nombre || '', apellidos: f.apellidos || user.apellido || '', telefono: f.telefono || solo8(user.telefono), email: f.email || user.email || '' }));
    }
  }, [user]);

  const cotizacion = useAsync(() => (form.departamento ? quoteShipping(form.departamento) : Promise.resolve(null)), [form.departamento]);
  const opciones = cotizacion.data?.opciones || [];

  // Al cotizar un departamento se preselecciona la más barata
  useEffect(() => {
    if (!opciones.length) return;
    setForm((f) => (opciones.some((o) => o.carrier._id === f.transportadora) ? f : { ...f, transportadora: opciones[0].carrier._id }));
  }, [cotizacion.data]);

  // Si cambia el carrito, el descuento ya calculado deja de ser válido
  const firmaCarrito = JSON.stringify(carrito.items.map((i) => [i.product, i.cantidad]));
  useEffect(() => {
    setCupon(null);
  }, [firmaCarrito]);

  if (!autenticado || user.role !== 'cliente') return <AccesoCliente slug={slug} />;
  // Al terminar la compra el carrito queda vacío: no hay que mandar al usuario de vuelta al carrito
  if (!carrito.items.length && !terminado.current) return <Navigate to={`/tienda/${slug}/carrito`} replace />;

  const cambiar = (e) => {
    const { name, value } = e.target;
    // Al cambiar de departamento, el municipio elegido ya no aplica
    setForm((f) => ({ ...f, [name]: value, ...(name === 'departamento' ? { transportadora: '', municipio: '' } : {}) }));
    setErrores((er) => ({ ...er, [name]: undefined }));
    setError('');
  };

  const items = carrito.items.map((i) => ({ product: i.product, cantidad: i.cantidad }));
  const total = cupon ? cupon.total : carrito.subtotal;
  const elegida = opciones.find((o) => o.carrier._id === form.transportadora);

  const aplicarCupon = async () => {
    const limpio = codigo.trim().toUpperCase();
    if (!limpio) return setErrorCupon('Escribe tu código de cupón');
    setValidando(true);
    setErrorCupon('');
    try {
      const resultado = await checkStoreCoupon(slug, { codigo: limpio, items });
      setCupon(resultado);
      toast.success(`Cupón ${resultado.codigo} aplicado`);
    } catch (err) {
      setCupon(null);
      setErrorCupon(getErrorMessage(err));
    } finally {
      setValidando(false);
    }
    return undefined;
  };

  const quitarCupon = () => {
    setCupon(null);
    setCodigo('');
    setErrorCupon('');
  };

  const enviar = async (e) => {
    e.preventDefault();
    const encontrados = validar(ESQUEMA, form);
    setErrores(encontrados);
    setError('');
    if (Object.keys(encontrados).length) {
      document.querySelector('[aria-invalid=true]')?.focus();
      return;
    }
    setEnviando(true);
    try {
      const orden = await storeCheckout(slug, {
        cliente: { nombres: form.nombres.trim(), apellidos: form.apellidos.trim(), telefono: form.telefono.replace(/[\s-]/g, ''), email: form.email.trim() },
        destino: { departamento: form.departamento, municipio: form.municipio.trim(), direccion: form.direccion.trim(), ...(form.referencias.trim() ? { referencias: form.referencias.trim() } : {}) },
        items,
        transportadora: form.transportadora,
        metodoPago,
        ...(cupon ? { cupon: cupon.codigo } : {}),
      });
      terminado.current = true;
      navigate(`/tienda/${slug}/pedido/${orden._id}`, { replace: true });
      carrito.vaciar();
    } catch (err) {
      setErrores(erroresDeApi(err));
      setError(getErrorMessage(err));
      // Si el problema es un producto del carrito, se revisa de nuevo para dejarlo al día
      if (err.response?.data?.errors?.some((e) => e.campo?.startsWith('items.'))) revalidar();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form onSubmit={enviar} noValidate className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-bold tracking-tight text-slate-900">Finalizar compra</h1>
      <AvisosCarrito avisos={carrito.avisos} onCerrar={carrito.descartarAvisos} className="mt-4" />
      {error && (
        <Alert tone="error" title="No pudimos crear tu pedido" className="mt-4">
          {error}
        </Alert>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_24rem]">
        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-semibold text-slate-900">1. Tus datos</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label="Nombres" name="nombres" value={form.nombres} onChange={cambiar} error={errores.nombres} autoComplete="given-name" required />
              <Input label="Apellidos" name="apellidos" value={form.apellidos} onChange={cambiar} error={errores.apellidos} autoComplete="family-name" required />
              <Input label="Teléfono" name="telefono" type="tel" inputMode="numeric" prefix="+502" value={form.telefono} onChange={cambiar} error={errores.telefono} placeholder="5555 1234" autoComplete="tel-national" required />
              <Input label="Correo electrónico" name="email" type="email" value={form.email} onChange={cambiar} error={errores.email} placeholder="Opcional" autoComplete="email" />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
              <MapPin className="h-4 w-4 text-primary" aria-hidden="true" /> 2. Dirección de entrega
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="Departamento" name="departamento" value={form.departamento} onChange={cambiar} error={errores.departamento} placeholder="Selecciona" options={DEPARTAMENTOS} required />
              <Select
                label="Municipio"
                name="municipio"
                value={form.municipio}
                onChange={cambiar}
                error={errores.municipio}
                placeholder={form.departamento ? 'Selecciona' : 'Elige primero el departamento'}
                options={municipiosDe(form.departamento)}
                disabled={!form.departamento}
                autoComplete="address-level2"
                required
              />
              <Input className="sm:col-span-2" label="Dirección" name="direccion" value={form.direccion} onChange={cambiar} error={errores.direccion} placeholder="Calle, número, zona o colonia" autoComplete="street-address" required />
              <Textarea className="sm:col-span-2" label="Referencias" name="referencias" value={form.referencias} onChange={cambiar} rows={2} maxLength={200} placeholder="Ej. Portón negro, frente a la iglesia" />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 flex items-center gap-2 font-semibold text-slate-900">
              <Truck className="h-4 w-4 text-primary" aria-hidden="true" /> 3. Transportadora
            </h2>
            {!form.departamento && <p className="text-sm text-slate-500">Elige primero el departamento para ver las transportadoras disponibles.</p>}
            {form.departamento && cotizacion.cargando && !cotizacion.data && <Skeleton className="h-16 w-full" />}
            {cotizacion.error && <Alert tone="error">{cotizacion.error}</Alert>}
            {form.departamento && cotizacion.data && !opciones.length && <Alert tone="warning">Aún no hay transportadoras que lleguen a {form.departamento}.</Alert>}
            {opciones.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Transportadora">
                {opciones.map((o) => {
                  const activa = form.transportadora === o.carrier._id;
                  return (
                    <button
                      key={o.carrier._id}
                      type="button"
                      role="radio"
                      aria-checked={activa}
                      onClick={() => {
                        setForm((f) => ({ ...f, transportadora: o.carrier._id }));
                        setErrores((er) => ({ ...er, transportadora: undefined }));
                      }}
                      className={`flex items-center gap-3 rounded-xl border p-3 text-left transition-colors ${activa ? 'border-primary bg-primary-50 ring-1 ring-primary' : 'border-slate-200 hover:border-slate-300'}`}
                    >
                      <img src={o.carrier.logo} alt="" className="h-10 w-10 rounded-lg border border-slate-200 object-cover" />
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-slate-900">{o.carrier.nombre}</span>
                        <span className="flex items-center gap-1 text-xs text-slate-500">
                          <Clock className="h-3 w-3" aria-hidden="true" /> {plural(o.dias, 'día', 'días')}
                          {o.masRapida && (
                            <span className="ml-1 inline-flex items-center gap-0.5 font-medium text-primary">
                              <Zap className="h-3 w-3" aria-hidden="true" /> Más rápida
                            </span>
                          )}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            {errores.transportadora && !errores.departamento && <p className="mt-2 text-xs font-medium text-danger">{errores.transportadora}</p>}
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 font-semibold text-slate-900">4. Método de pago</h2>
            <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Método de pago">
              {PAGOS.map((p) => {
                const activo = metodoPago === p.value;
                return (
                  <button key={p.value} type="button" role="radio" aria-checked={activo} onClick={() => setMetodoPago(p.value)} className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-colors ${activo ? 'border-primary bg-primary-50 ring-1 ring-primary' : 'border-slate-200 hover:border-slate-300'}`}>
                    <p.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
                    <span>
                      <span className="block text-sm font-semibold text-slate-900">{p.label}</span>
                      <span className="block text-xs text-slate-500">{p.detalle}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        </div>

        <aside className="h-fit space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-24">
          <h2 className="font-semibold text-slate-900">Resumen del pedido</h2>
          <ul className="divide-y divide-slate-100">
            {carrito.items.map((i) => (
              <li key={i.product} className="flex items-center gap-3 py-2.5">
                <img src={i.imagen} alt="" className="h-12 w-12 shrink-0 rounded-lg border border-slate-200 object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900">{i.nombre}</p>
                  <p className="text-xs text-slate-500">
                    {i.cantidad} × {formatQ(i.precio)}
                  </p>
                </div>
                <p className="text-sm font-semibold text-slate-900">{formatQ(i.precio * i.cantidad)}</p>
              </li>
            ))}
          </ul>

          <div>
            <label htmlFor="cupon" className="text-sm font-medium text-slate-700">
              Cupón de descuento
            </label>
            {cupon ? (
              <div className="mt-1.5 flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                <span className="flex items-center gap-2 font-medium">
                  <Tag className="h-4 w-4" aria-hidden="true" /> {cupon.codigo} {cupon.tipo === 'PORCENTAJE' ? `(${cupon.valor}%)` : ''}
                </span>
                <button type="button" onClick={quitarCupon} aria-label="Quitar cupón" className="rounded p-1 hover:bg-emerald-100">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="mt-1.5 flex gap-2">
                <input
                  id="cupon"
                  value={codigo}
                  onChange={(e) => {
                    setCodigo(e.target.value.toUpperCase().replace(/\s/g, ''));
                    setErrorCupon('');
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      aplicarCupon();
                    }
                  }}
                  maxLength={20}
                  placeholder="Ej. BIENVENIDO10"
                  className="h-10 min-w-0 flex-1 rounded-lg border border-slate-300 px-3 text-sm uppercase focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-100"
                />
                <Button type="button" variant="secondary" loading={validando} onClick={aplicarCupon}>
                  Aplicar
                </Button>
              </div>
            )}
            {errorCupon && <p className="mt-1.5 text-xs font-medium text-danger">{errorCupon}</p>}
          </div>

          <dl className="space-y-2 border-t border-slate-100 pt-4 text-sm">
            <div className="flex justify-between text-slate-600">
              <dt>Subtotal</dt>
              <dd>{formatQ(carrito.subtotal)}</dd>
            </div>
            {cupon && (
              <div className="flex justify-between text-success">
                <dt>Descuento</dt>
                <dd>− {formatQ(cupon.descuento)}</dd>
              </div>
            )}
            <div className="flex justify-between text-slate-600">
              <dt>Envío{elegida ? ` · ${elegida.carrier.nombre}` : ''}</dt>
              <dd className="font-medium text-success">Incluido</dd>
            </div>
            <div className="flex justify-between border-t border-slate-100 pt-3 text-xl font-bold text-slate-900">
              <dt>{metodoPago === 'CONTRAENTREGA' ? 'Total a pagar al recibir' : 'Total'}</dt>
              <dd>{formatQ(total)}</dd>
            </div>
          </dl>

          <Button type="submit" size="lg" fullWidth loading={enviando} disabled={revisandoCarrito}>
            Confirmar pedido
          </Button>
          <p className="text-center text-xs text-slate-500">
            Al confirmar aceptas los{' '}
            <Link to="/politicas/terminos-y-condiciones" target="_blank" className="text-primary hover:underline">
              términos y condiciones
            </Link>
            .
          </p>
        </aside>
      </div>
    </form>
  );
}
