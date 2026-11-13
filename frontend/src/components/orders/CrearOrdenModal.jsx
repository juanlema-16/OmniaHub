import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { CircleAlert, Clock, Coins, Mail, MapPin, Plus, Search, Trash2, Truck, User, UserCheck, Wallet } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import Switch from '../ui/Switch';
import Alert from '../ui/Alert';
import Skeleton from '../ui/Skeleton';
import { useAuth } from '../../context/AuthContext';
import useDebounce from '../../hooks/useDebounce';
import { getErrorMessage } from '../../api/axios';
import { getCatalog } from '../../api/catalog';
import { quoteShipping } from '../../api/shipping';
import { createOrder, previewOrder } from '../../api/orders';
import { listCustomers } from '../../api/customers';
import { DEPARTAMENTOS } from '../../utils/constants';
import { formatQ } from '../../utils/formatQ';
import { erroresDeApi, reglas, validar } from '../../utils/validation';
import { plural } from '../../utils/plural';

const CLIENTE_VACIO = { nombres: '', apellidos: '', telefono: '', email: '', departamento: '', municipio: '', direccion: '', referencias: '' };

const ESQUEMA = {
  nombres: [reglas.requerido('El nombre'), reglas.minimo('El nombre', 2)],
  apellidos: [reglas.requerido('El apellido'), reglas.minimo('El apellido', 2)],
  telefono: [reglas.requerido('El teléfono'), reglas.telefono],
  email: [reglas.email],
  departamento: [reglas.requerido('El departamento')],
  municipio: [reglas.requerido('El municipio'), reglas.minimo('El municipio', 2)],
  direccion: [reglas.requerido('La dirección', 'a'), reglas.minimo('La dirección', 5)],
};

// Un producto del catálogo (o de la tienda) como línea de la orden
export const lineaDesdeProducto = (p, precioVenta) => ({
  product: p._id,
  nombre: p.nombre,
  imagen: p.imagenes?.[0],
  proveedorId: p.proveedor?._id || p.proveedor,
  proveedorNombre: p.proveedor?.empresa?.nombre,
  precioProveedor: p.precioProveedor,
  precioSugerido: p.precioSugerido,
  stock: p.stock,
  precioVenta: String(precioVenta ?? p.storeProduct?.precioVenta ?? p.precioSugerido),
  cantidad: '1',
});

const errorLinea = (l) => {
  const precio = Number(l.precioVenta);
  const cantidad = Number(l.cantidad);
  if (!(precio > 0)) return { precioVenta: 'Ingresa el precio de venta' };
  if (precio < l.precioProveedor) return { precioVenta: `No puede ser menor al precio proveedor (${formatQ(l.precioProveedor)})` };
  if (!Number.isInteger(cantidad) || cantidad < 1) return { cantidad: 'La cantidad mínima es 1' };
  if (cantidad > l.stock) return { cantidad: `Solo hay ${plural(l.stock, 'unidad')} disponibles` };
  return null;
};

function Columna({ titulo, children, className = '' }) {
  return (
    <section className={`min-w-0 ${className}`}>
      <h3 className="mb-3 text-sm font-semibold text-slate-900">{titulo}</h3>
      {children}
    </section>
  );
}

function FilaResumen({ label, value, fuerte = false, className = '' }) {
  return (
    <div className={`flex items-center justify-between gap-3 py-2 text-sm ${className}`}>
      <span className={fuerte ? 'font-semibold text-slate-900' : 'text-slate-600'}>{label}</span>
      <span className={fuerte ? 'font-semibold text-slate-900' : 'text-slate-800'}>{value}</span>
    </div>
  );
}

// Buscador de productos del catálogo; si ya hay productos, solo del mismo proveedor
function AgregarProducto({ proveedorId, excluir, onAgregar }) {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState('');
  const busqueda = useDebounce(texto, 300);
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!abierto) return undefined;
    let vigente = true;
    setCargando(true);
    getCatalog({ search: busqueda || undefined, proveedor: proveedorId || undefined, conStock: true, limit: 6 })
      .then((d) => vigente && setResultados(d.items.filter((p) => !excluir.split(',').includes(p._id))))
      .catch(() => vigente && setResultados([]))
      .finally(() => vigente && setCargando(false));
    return () => {
      vigente = false;
    };
  }, [abierto, busqueda, proveedorId, excluir]);

  if (!abierto) {
    return (
      <Button variant="soft" size="sm" icon={Plus} fullWidth onClick={() => setAbierto(true)}>
        Agregar producto
      </Button>
    );
  }

  return (
    <div className="rounded-lg border border-slate-200 p-3">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
        <input
          autoFocus
          type="search"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Buscar producto por nombre o SKU"
          aria-label="Buscar producto"
          className="h-9 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-100"
        />
      </div>
      {proveedorId && <p className="mt-2 text-xs text-slate-500">Solo se muestran productos del mismo proveedor: una orden va a un solo proveedor.</p>}
      <ul className="mt-2 max-h-56 divide-y divide-slate-100 overflow-y-auto">
        {cargando && <li className="py-3"><Skeleton className="h-8 w-full" /></li>}
        {!cargando && !resultados.length && <li className="py-3 text-center text-sm text-slate-500">No hay productos con ese nombre</li>}
        {!cargando &&
          resultados.map((p) => (
            <li key={p._id}>
              <button
                type="button"
                onClick={() => {
                  onAgregar(p);
                  setAbierto(false);
                  setTexto('');
                }}
                className="flex w-full items-center gap-3 rounded-md px-1 py-2 text-left hover:bg-slate-50"
              >
                <img src={p.imagenes?.[0]} alt="" className="h-9 w-9 rounded-md border border-slate-200 object-cover" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-slate-900">{p.nombre}</span>
                  <span className="text-xs text-slate-500">
                    {formatQ(p.precioProveedor)} · Stock {p.stock}
                  </span>
                </span>
                <Plus className="h-4 w-4 text-primary" aria-hidden="true" />
              </button>
            </li>
          ))}
      </ul>
      <button type="button" onClick={() => setAbierto(false)} className="mt-1 text-xs font-medium text-slate-500 hover:text-slate-700">
        Cerrar buscador
      </button>
    </div>
  );
}

export default function CrearOrdenModal({ open, onClose, producto, precioVenta, clienteInicial, onCreated }) {
  const { wallet, refresh } = useAuth();
  const [cliente, setCliente] = useState(CLIENTE_VACIO);
  const [lineas, setLineas] = useState([]);
  const [tipoPago, setTipoPago] = useState('CON_RECAUDO');
  const [carrier, setCarrier] = useState('');
  const [conNotas, setConNotas] = useState(false);
  const [notas, setNotas] = useState('');
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [cotizacion, setCotizacion] = useState({ opciones: [], cargando: false, error: '' });
  const [resumen, setResumen] = useState({ data: null, cargando: false, error: '' });
  const [sugerido, setSugerido] = useState(null);

  // Cada vez que se abre, arranca limpio con el producto y el cliente que vengan
  useEffect(() => {
    if (!open) return;
    setCliente(
      clienteInicial
        ? {
            ...CLIENTE_VACIO,
            nombres: clienteInicial.nombres,
            apellidos: clienteInicial.apellidos,
            telefono: clienteInicial.telefono,
            email: clienteInicial.email || '',
            departamento: clienteInicial.departamento || '',
            municipio: clienteInicial.municipio || '',
            direccion: clienteInicial.direccion || '',
          }
        : CLIENTE_VACIO
    );
    setLineas(producto ? [lineaDesdeProducto(producto, precioVenta)] : []);
    setTipoPago('CON_RECAUDO');
    setCarrier('');
    setConNotas(false);
    setNotas('');
    setErrores({});
    setErrorGeneral('');
    setSugerido(null);
    setResumen({ data: null, cargando: false, error: '' });
  }, [open, producto, precioVenta, clienteInicial]);

  // Cotiza las transportadoras al elegir departamento y preselecciona la favorita o la más barata
  useEffect(() => {
    if (!open || !cliente.departamento) {
      setCotizacion({ opciones: [], cargando: false, error: '' });
      setCarrier('');
      return undefined;
    }
    let vigente = true;
    setCotizacion((c) => ({ ...c, cargando: true, error: '' }));
    quoteShipping(cliente.departamento)
      .then((d) => {
        if (!vigente) return;
        setCotizacion({ opciones: d.opciones, cargando: false, error: '' });
        const elegida = d.opciones.find((o) => o.preferida) || d.opciones.find((o) => o.masBarata) || d.opciones[0];
        setCarrier(elegida?.carrier._id || '');
      })
      .catch((err) => vigente && setCotizacion({ opciones: [], cargando: false, error: getErrorMessage(err) }));
    return () => {
      vigente = false;
    };
  }, [open, cliente.departamento]);

  // Sugiere los datos de un cliente que ya compró con ese teléfono
  const telefono = cliente.telefono.replace(/[\s-]/g, '');
  useEffect(() => {
    if (!open || clienteInicial || !/^\d{8}$/.test(telefono)) {
      setSugerido(null);
      return undefined;
    }
    let vigente = true;
    listCustomers({ search: telefono, limit: 1 })
      .then((d) => vigente && setSugerido(d.items.find((c) => c.telefono === telefono) || null))
      .catch(() => vigente && setSugerido(null));
    return () => {
      vigente = false;
    };
  }, [open, telefono, clienteInicial]);

  const erroresLineas = lineas.map(errorLinea);
  const lineasValidas = lineas.length > 0 && erroresLineas.every((e) => !e);
  const clave = useDebounce(JSON.stringify({ lineas: lineas.map((l) => [l.product, l.cantidad, l.precioVenta]), d: cliente.departamento, carrier }), 350);

  // Resumen en vivo calculado por la API (misma fórmula que al crear la orden)
  useEffect(() => {
    if (!open || !lineasValidas || !cliente.departamento || !carrier) {
      setResumen({ data: null, cargando: false, error: '' });
      return undefined;
    }
    let vigente = true;
    setResumen((r) => ({ ...r, cargando: true, error: '' }));
    previewOrder({
      items: lineas.map((l) => ({ product: l.product, cantidad: Number(l.cantidad), precioVenta: Number(l.precioVenta) })),
      departamento: cliente.departamento,
      transportadora: carrier,
    })
      .then((data) => vigente && setResumen({ data, cargando: false, error: '' }))
      .catch((err) => vigente && setResumen({ data: null, cargando: false, error: getErrorMessage(err) }));
    return () => {
      vigente = false;
    };
    // la clave resume líneas, departamento y transportadora con debounce
  }, [open, clave, lineasValidas]);

  const subtotalLocal = useMemo(() => lineas.reduce((s, l) => s + (Number(l.precioVenta) || 0) * (Number(l.cantidad) || 0), 0), [lineas]);
  const proveedorLocal = useMemo(() => lineas.reduce((s, l) => s + l.precioProveedor * (Number(l.cantidad) || 0), 0), [lineas]);
  const r = resumen.data;
  const saldo = wallet?.saldoDisponible ?? 0;
  const sinSaldo = tipoPago === 'SIN_RECAUDO' && r && r.salidaSinRecaudo > saldo;
  const puedeEnviar = Boolean(r?.puedeEnviar) && !sinSaldo && !resumen.cargando;

  const cambiar = (e) => {
    const { name, value } = e.target;
    setCliente((c) => ({ ...c, [name]: value }));
    setErrores((er) => ({ ...er, [name]: undefined }));
    setErrorGeneral('');
  };
  const cambiarLinea = (i, campo, valor) => setLineas((ls) => ls.map((l, j) => (j === i ? { ...l, [campo]: valor } : l)));

  const usarSugerido = () => {
    setCliente((c) => ({
      ...c,
      nombres: sugerido.nombres,
      apellidos: sugerido.apellidos,
      email: sugerido.email || '',
      departamento: sugerido.departamento || c.departamento,
      municipio: sugerido.municipio || c.municipio,
      direccion: sugerido.direccion || c.direccion,
    }));
    setErrores({});
    setErrorGeneral('');
    setSugerido(null);
  };

  const enviar = async () => {
    const encontrados = validar(ESQUEMA, cliente);
    if (!carrier && cliente.departamento) encontrados.transportadora = 'Elige una transportadora';
    setErrores(encontrados);
    setErrorGeneral('');
    if (!lineas.length) return setErrorGeneral('Agrega al menos un producto a la orden');
    if (Object.keys(encontrados).length || !lineasValidas) return setErrorGeneral('Revisa los campos marcados en rojo');
    if (resumen.cargando || !r) return setErrorGeneral(resumen.error || 'Espera a que se calcule el resumen de la orden');
    if (!puedeEnviar) return undefined;

    setEnviando(true);
    try {
      const orden = await createOrder({
        cliente: { nombres: cliente.nombres.trim(), apellidos: cliente.apellidos.trim(), telefono, email: cliente.email.trim() },
        destino: { departamento: cliente.departamento, municipio: cliente.municipio.trim(), direccion: cliente.direccion.trim(), referencias: cliente.referencias.trim() || undefined },
        items: lineas.map((l) => ({ product: l.product, cantidad: Number(l.cantidad), precioVenta: Number(l.precioVenta) })),
        tipoPago,
        transportadora: carrier,
        notasProveedor: conNotas && notas.trim() ? notas.trim() : undefined,
      });
      toast.success(`Orden ${orden.numero} creada. Confírmala para que el proveedor la prepare.`);
      refresh();
      onCreated?.(orden);
      onClose();
    } catch (err) {
      setErrores(erroresDeApi(err));
      setErrorGeneral(getErrorMessage(err));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="2xl"
      title="Crear orden"
      description="Completa los datos del cliente, elige la transportadora y revisa tu ganancia."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={enviando}>
            Cancelar
          </Button>
          <Button icon={Truck} onClick={enviar} loading={enviando} disabled={Boolean(r) && (r.ganancia < 0 || sinSaldo)}>
            {enviando ? 'Creando orden…' : 'Enviar al cliente'}
          </Button>
        </>
      }
    >
      {errorGeneral && (
        <Alert tone="error" className="mb-4">
          {errorGeneral}
        </Alert>
      )}
      <div className="grid gap-6 lg:grid-cols-[1.2fr_1fr_0.95fr] lg:divide-x lg:divide-slate-100">
        <Columna titulo="Información del cliente">
          <div className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Nombres" name="nombres" icon={User} value={cliente.nombres} onChange={cambiar} error={errores.nombres} required />
              <Input label="Apellidos" name="apellidos" value={cliente.apellidos} onChange={cambiar} error={errores.apellidos} required />
            </div>
            <Input label="Teléfono" name="telefono" type="tel" inputMode="numeric" prefix="+502" maxLength={9} value={cliente.telefono} onChange={cambiar} error={errores.telefono} placeholder="5555 1234" required />
            {sugerido && (
              <button type="button" onClick={usarSugerido} className="flex w-full items-center gap-2 rounded-lg bg-primary-50 px-3 py-2 text-left text-xs text-primary hover:bg-primary-100">
                <UserCheck className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>
                  Ya le vendiste a <strong>{sugerido.nombres} {sugerido.apellidos}</strong>. Usar sus datos
                </span>
              </button>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <Select label="Departamento" name="departamento" options={DEPARTAMENTOS} placeholder="Selecciona" value={cliente.departamento} onChange={cambiar} error={errores.departamento} required />
              <Input label="Municipio" name="municipio" value={cliente.municipio} onChange={cambiar} error={errores.municipio} placeholder="Ej. Mixco" required />
            </div>
            <Input label="Dirección" name="direccion" icon={MapPin} value={cliente.direccion} onChange={cambiar} error={errores.direccion} placeholder="Calle, número, zona o colonia" required />
            <Input label="Referencias" name="referencias" value={cliente.referencias} onChange={cambiar} placeholder="Ej. Portón negro, frente a la iglesia" />
            <Input label="Correo electrónico" name="email" type="email" icon={Mail} value={cliente.email} onChange={cambiar} error={errores.email} placeholder="Opcional" />
            <Switch checked={conNotas} onChange={setConNotas} label="Agregar notas para el proveedor" />
            {conNotas && <Textarea aria-label="Notas para el proveedor" value={notas} onChange={(e) => setNotas(e.target.value)} maxLength={500} placeholder="Ej. Empacar para regalo" />}
          </div>

          <h3 className="mb-3 mt-6 text-sm font-semibold text-slate-900">Productos</h3>
          <div className="space-y-3">
            {lineas.map((l, i) => (
              <div key={l.product} className="rounded-lg bg-slate-50 p-3 ring-1 ring-inset ring-slate-200">
                <div className="flex gap-3">
                  <img src={l.imagen} alt="" className="h-14 w-14 shrink-0 rounded-lg border border-slate-200 bg-white object-cover" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{l.nombre}</p>
                    {l.proveedorNombre && <p className="text-xs text-slate-500">Proveedor: {l.proveedorNombre}</p>}
                    <p className="text-xs text-slate-500">Precio proveedor: {formatQ(l.precioProveedor)}</p>
                  </div>
                  <button type="button" onClick={() => setLineas((ls) => ls.filter((_, j) => j !== i))} className="self-start rounded-md p-1 text-slate-400 hover:bg-white hover:text-danger" aria-label={`Quitar ${l.nombre}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <Input label="Precio de venta" type="number" min="0" step="0.01" prefix="Q" value={l.precioVenta} onChange={(e) => cambiarLinea(i, 'precioVenta', e.target.value)} error={erroresLineas[i]?.precioVenta} hint={`Sugerido: ${formatQ(l.precioSugerido)}`} />
                  <Input label="Cantidad" type="number" min="1" step="1" value={l.cantidad} onChange={(e) => cambiarLinea(i, 'cantidad', e.target.value)} error={erroresLineas[i]?.cantidad} hint={`Existencia: ${l.stock}`} />
                </div>
              </div>
            ))}
            {!lineas.length && <p className="rounded-lg border border-dashed border-slate-300 p-4 text-center text-sm text-slate-500">Agrega el primer producto de la orden.</p>}
            <AgregarProducto
              proveedorId={lineas[0]?.proveedorId}
              excluir={lineas.map((l) => l.product).join(',')}
              onAgregar={(p) => setLineas((ls) => [...ls, lineaDesdeProducto(p)])}
            />
          </div>
        </Columna>

        <Columna titulo="Tipo de pago y transportadora" className="lg:pl-6">
          <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Tipo de pago">
            {[
              { value: 'CON_RECAUDO', label: 'Con recaudo', desc: 'El cliente paga al recibir' },
              { value: 'SIN_RECAUDO', label: 'Sin recaudo', desc: 'Ya te pagó: se cobra de tu billetera' },
            ].map((t) => (
              <button
                key={t.value}
                type="button"
                role="radio"
                aria-checked={tipoPago === t.value}
                aria-label={`${t.label}: ${t.desc}`}
                onClick={() => setTipoPago(t.value)}
                className={`rounded-lg border p-3 text-left transition-colors ${tipoPago === t.value ? 'border-primary bg-primary-50 ring-1 ring-primary' : 'border-slate-200 hover:border-slate-300'}`}
              >
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                  <span className={`flex h-4 w-4 items-center justify-center rounded-full border ${tipoPago === t.value ? 'border-primary' : 'border-slate-300'}`}>
                    {tipoPago === t.value && <span className="h-2 w-2 rounded-full bg-primary" />}
                  </span>
                  {t.label}
                </span>
                <span className="mt-1 block text-xs text-slate-500">{t.desc}</span>
              </button>
            ))}
          </div>

          <div className="mt-4 space-y-2" role="radiogroup" aria-label="Transportadora">
            {!cliente.departamento && (
              <p className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-inset ring-amber-200">
                <CircleAlert className="h-4 w-4 shrink-0" aria-hidden="true" /> Para cotizar, selecciona el departamento de destino.
              </p>
            )}
            {cotizacion.cargando && [0, 1].map((i) => <Skeleton key={i} className="h-16 w-full" />)}
            {cotizacion.error && <Alert tone="error">{cotizacion.error}</Alert>}
            {!cotizacion.cargando &&
              cotizacion.opciones.map((o) => {
                const activa = carrier === o.carrier._id;
                return (
                  <button
                    key={o.carrier._id}
                    type="button"
                    role="radio"
                    aria-checked={activa}
                    aria-label={`${o.carrier.nombre}, ${formatQ(o.precio)}, ${plural(o.dias, 'día', 'días')}`}
                    onClick={() => setCarrier(o.carrier._id)}
                    className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${activa ? 'border-primary bg-primary-50 ring-1 ring-primary' : 'border-slate-200 hover:border-slate-300'}`}
                  >
                    <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${activa ? 'border-primary' : 'border-slate-300'}`}>
                      {activa && <span className="h-2 w-2 rounded-full bg-primary" />}
                    </span>
                    <img src={o.carrier.logo} alt="" className="h-8 w-8 rounded-md border border-slate-200 bg-white object-cover" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-900">{o.carrier.nombre}</span>
                      <span className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" aria-hidden="true" /> {plural(o.dias, 'día', 'días')}
                        </span>
                        {o.preferida && <span className="font-medium text-primary">Tu favorita</span>}
                        {o.masBarata && <span className="font-medium text-success">Más barata</span>}
                      </span>
                    </span>
                    <span className="text-sm font-semibold text-slate-900">{formatQ(o.precio)}</span>
                  </button>
                );
              })}
            {errores.transportadora && <p className="text-xs font-medium text-danger">{errores.transportadora}</p>}
          </div>

          {tipoPago === 'SIN_RECAUDO' && (
            <div className="mt-4 rounded-lg bg-slate-50 p-3 text-xs text-slate-600 ring-1 ring-inset ring-slate-200">
              <p className="flex items-center gap-1.5 font-medium text-slate-800">
                <Wallet className="h-4 w-4" aria-hidden="true" /> Saldo disponible: {formatQ(saldo)}
              </p>
              <p className="mt-1">Al crear la orden se descuenta de tu billetera el precio proveedor, el envío y la comisión{r ? ` (${formatQ(r.salidaSinRecaudo)})` : ''}.</p>
            </div>
          )}
        </Columna>

        <Columna titulo="Resumen de la orden" className="lg:pl-6">
          <div className="rounded-lg bg-slate-50 p-3 ring-1 ring-inset ring-slate-200">
            <div className="flex justify-between border-b border-slate-200 pb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <span>Producto</span>
              <span>Precio de venta</span>
            </div>
            {lineas.length ? (
              <ul className="divide-y divide-slate-200">
                {lineas.map((l) => (
                  <li key={l.product} className="flex justify-between gap-3 py-2 text-sm">
                    <span className="min-w-0 truncate text-slate-700">
                      {l.nombre} <strong>({l.cantidad || 0})</strong>
                    </span>
                    <span className="shrink-0 text-slate-900">{formatQ((Number(l.precioVenta) || 0) * (Number(l.cantidad) || 0))}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="py-3 text-center text-sm text-slate-500">Sin productos</p>
            )}
          </div>

          <div className="mt-3 divide-y divide-slate-100">
            <FilaResumen label={tipoPago === 'CON_RECAUDO' ? 'Total a recaudar' : 'Total de la venta'} value={formatQ(r?.totalARecaudar ?? subtotalLocal)} fuerte />
            <FilaResumen label="Precio proveedor" value={formatQ(r?.precioProveedor ?? proveedorLocal)} />
            <FilaResumen label="Precio de envío" value={r ? formatQ(r.costoEnvio) : '—'} />
            <FilaResumen label={`Comisión de la plataforma${r ? ` (${r.comisionPorcentaje}%)` : ''}`} value={r ? formatQ(r.comision) : '—'} />
          </div>

          <div className={`mt-3 flex items-center justify-between rounded-lg px-3 py-3 ${!r ? 'bg-slate-50' : r.ganancia < 0 ? 'bg-red-50' : 'bg-emerald-50'}`}>
            <span className={`flex items-center gap-2 text-sm font-semibold ${!r ? 'text-slate-500' : r.ganancia < 0 ? 'text-danger' : 'text-success'}`}>
              <Coins className="h-4 w-4" aria-hidden="true" /> Ganancia
            </span>
            {resumen.cargando ? <Skeleton className="h-6 w-20" /> : <span className={`text-lg font-bold ${!r ? 'text-slate-400' : r.ganancia < 0 ? 'text-danger' : 'text-success'}`}>{r ? formatQ(r.ganancia) : '—'}</span>}
          </div>
          {r && r.ganancia < 0 && <p className="mt-2 text-xs font-medium text-danger">Con este precio pierdes dinero. Sube el precio de venta para poder enviar la orden.</p>}
          {sinSaldo && <p className="mt-2 text-xs font-medium text-danger">No tienes saldo suficiente para una orden sin recaudo. Recarga tu billetera o usa contraentrega.</p>}
          {r?.diasEstimados && <p className="mt-2 text-xs text-slate-500">Entrega estimada en {plural(r.diasEstimados, 'día', 'días')} con {r.transportadora.nombre}.</p>}
          {!r && !resumen.error && <p className="mt-2 text-xs text-slate-500">Completa los productos, el departamento y la transportadora para calcular tu ganancia.</p>}
          {resumen.error && (
            <Alert tone="error" className="mt-3">
              {resumen.error}
            </Alert>
          )}
        </Columna>
      </div>
    </Modal>
  );
}
