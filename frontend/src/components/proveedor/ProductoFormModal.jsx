import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { ImagePlus, X } from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import Switch from '../ui/Switch';
import Alert from '../ui/Alert';
import { createProduct, updateProduct } from '../../api/products';
import { getErrorMessage } from '../../api/axios';
import { erroresDeApi, reglas, validar } from '../../utils/validation';
import { plural } from '../../utils/plural';

export const MAX_IMAGENES = 5;
const MAX_MB = 5;
const TIPOS = ['image/jpeg', 'image/png', 'image/webp'];

const VACIO = { nombre: '', sku: '', descripcion: '', categoria: '', precioProveedor: '', precioSugerido: '', stock: '0', stockMinimo: '5', bodega: '', activo: true };

const entero = (label) => (v) => (v !== '' && !(Number.isInteger(Number(v)) && Number(v) >= 0) ? `${label} debe ser un número entero, 0 o mayor` : null);

const esquema = {
  nombre: [reglas.requerido('El nombre'), reglas.minimo('El nombre', 3)],
  sku: [(v) => (v && !/^[A-Za-z0-9-]{3,30}$/.test(v.trim()) ? 'El SKU solo puede tener letras, números y guiones (3 a 30)' : null)],
  categoria: [reglas.requerido('La categoría', 'a')],
  precioProveedor: [reglas.requerido('El precio proveedor'), reglas.positivo('El precio proveedor')],
  precioSugerido: [
    reglas.requerido('El precio sugerido'),
    reglas.positivo('El precio sugerido'),
    (v, f) => (v !== '' && f.precioProveedor !== '' && Number(v) < Number(f.precioProveedor) ? 'El precio sugerido no puede ser menor al precio proveedor' : null),
  ],
  stock: [reglas.requerido('El stock'), entero('El stock')],
  stockMinimo: [reglas.requerido('El stock mínimo'), entero('El stock mínimo')],
};

// Crear o editar un producto propio, con hasta 5 imágenes (JPG, PNG o WEBP de máximo 5 MB)
export default function ProductoFormModal({ producto, categorias, onClose, onSaved }) {
  const editando = Boolean(producto?._id);
  const [form, setForm] = useState(VACIO);
  const [existentes, setExistentes] = useState([]);
  const [nuevas, setNuevas] = useState([]);
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [errorImagen, setErrorImagen] = useState('');
  const [enviando, setEnviando] = useState(false);
  const inputArchivo = useRef(null);

  useEffect(() => {
    if (!producto) return;
    setForm(
      editando
        ? {
            nombre: producto.nombre,
            sku: producto.sku,
            descripcion: producto.descripcion || '',
            categoria: producto.categoria?._id || '',
            precioProveedor: String(producto.precioProveedor),
            precioSugerido: String(producto.precioSugerido),
            stock: String(producto.stock),
            stockMinimo: String(producto.stockMinimo),
            bodega: producto.bodega || '',
            activo: producto.activo,
          }
        : VACIO
    );
    setExistentes(editando ? producto.imagenes : []);
    setNuevas((anteriores) => {
      anteriores.forEach((n) => URL.revokeObjectURL(n.vista));
      return [];
    });
    setErrores({});
    setError('');
    setErrorImagen('');
  }, [producto, editando]);

  const vistas = useRef([]);
  vistas.current = nuevas;
  useEffect(() => () => vistas.current.forEach((n) => URL.revokeObjectURL(n.vista)), []);

  const quitarNueva = (n) => {
    URL.revokeObjectURL(n.vista);
    setNuevas((l) => l.filter((x) => x !== n));
  };

  if (!producto) return null;

  const cambiar = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: name === 'sku' ? value.toUpperCase() : value }));
    setErrores((er) => ({ ...er, [name]: undefined }));
  };

  const total = existentes.length + nuevas.length;

  const agregarArchivos = (e) => {
    const archivos = Array.from(e.target.files || []);
    e.target.value = '';
    const aceptados = [];
    let mensaje = '';
    for (const a of archivos) {
      if (!TIPOS.includes(a.type)) mensaje = `"${a.name}" no es JPG, PNG ni WEBP`;
      else if (a.size > MAX_MB * 1024 * 1024) mensaje = `"${a.name}" pesa más de ${MAX_MB} MB`;
      else if (total + aceptados.length >= MAX_IMAGENES) mensaje = `Máximo ${plural(MAX_IMAGENES, 'imagen', 'imágenes')} por producto`;
      else aceptados.push({ archivo: a, vista: URL.createObjectURL(a) });
    }
    setErrorImagen(mensaje);
    if (aceptados.length) setNuevas((n) => [...n, ...aceptados]);
  };

  const guardar = async (e) => {
    e.preventDefault();
    const encontrados = validar(esquema, form);
    setErrores(encontrados);
    setError('');
    if (Object.keys(encontrados).length) return;

    const datos = new FormData();
    datos.append('nombre', form.nombre.trim());
    if (form.sku.trim()) datos.append('sku', form.sku.trim());
    datos.append('descripcion', form.descripcion.trim());
    datos.append('categoria', form.categoria);
    datos.append('precioProveedor', form.precioProveedor);
    datos.append('precioSugerido', form.precioSugerido);
    datos.append('stock', form.stock);
    datos.append('stockMinimo', form.stockMinimo);
    datos.append('bodega', form.bodega.trim());
    datos.append('activo', String(form.activo));
    nuevas.forEach((n) => datos.append('imagenes', n.archivo));
    if (editando) {
      const quitadas = producto.imagenes.filter((url) => !existentes.includes(url));
      if (quitadas.length) datos.append('imagenesEliminar', JSON.stringify(quitadas));
    }

    setEnviando(true);
    try {
      const guardado = editando ? await updateProduct(producto._id, datos) : await createProduct(datos);
      toast.success(editando ? `"${guardado.nombre}" actualizado` : `"${guardado.nombre}" publicado`);
      onSaved();
      onClose();
    } catch (err) {
      setErrores(erroresDeApi(err));
      setError(getErrorMessage(err));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={editando ? 'Editar producto' : 'Nuevo producto'}
      description="Los dropshippers verán el precio proveedor y el sugerido en el catálogo."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={enviando}>
            Cancelar
          </Button>
          <Button type="submit" form="form-producto" loading={enviando}>
            {editando ? 'Guardar cambios' : 'Publicar producto'}
          </Button>
        </>
      }
    >
      <form id="form-producto" onSubmit={guardar} className="space-y-4" noValidate>
        {error && <Alert tone="error">{error}</Alert>}
        <Input label="Nombre" name="nombre" value={form.nombre} onChange={cambiar} error={errores.nombre} maxLength={120} required />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="SKU" name="sku" value={form.sku} onChange={cambiar} error={errores.sku} maxLength={30} hint={editando ? undefined : 'Déjalo vacío para generarlo automáticamente'} />
          <Select
            label="Categoría"
            name="categoria"
            value={form.categoria}
            onChange={cambiar}
            error={errores.categoria}
            placeholder="Elige una categoría"
            options={categorias.map((c) => ({ value: c._id, label: c.nombre }))}
            required
          />
        </div>
        <Textarea label="Descripción" name="descripcion" value={form.descripcion} onChange={cambiar} error={errores.descripcion} maxLength={2000} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Precio proveedor" name="precioProveedor" type="number" min="0" step="0.01" prefix="Q" value={form.precioProveedor} onChange={cambiar} error={errores.precioProveedor} hint="Lo que recibes por cada unidad" required />
          <Input label="Precio sugerido" name="precioSugerido" type="number" min="0" step="0.01" prefix="Q" value={form.precioSugerido} onChange={cambiar} error={errores.precioSugerido} hint="Precio de venta recomendado al público" required />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input label="Stock" name="stock" type="number" min="0" step="1" value={form.stock} onChange={cambiar} error={errores.stock} hint={editando ? 'Si lo cambias se registra un ajuste' : undefined} required />
          <Input label="Stock mínimo" name="stockMinimo" type="number" min="0" step="1" value={form.stockMinimo} onChange={cambiar} error={errores.stockMinimo} hint="Alerta de stock bajo" required />
          <Input label="Bodega" name="bodega" value={form.bodega} onChange={cambiar} error={errores.bodega} maxLength={80} placeholder="Municipio" />
        </div>

        <div>
          <p className="mb-1.5 text-sm font-medium text-slate-700">Imágenes</p>
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {existentes.map((url) => (
              <li key={url} className="relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button type="button" onClick={() => setExistentes((l) => l.filter((u) => u !== url))} className="absolute right-1 top-1 rounded-full bg-white/95 p-1 text-slate-600 shadow hover:text-danger" aria-label="Quitar imagen">
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
            {nuevas.map((n) => (
              <li key={n.vista} className="relative aspect-square overflow-hidden rounded-lg border border-primary/40 bg-slate-50">
                <img src={n.vista} alt="" className="h-full w-full object-cover" />
                <button type="button" onClick={() => quitarNueva(n)} className="absolute right-1 top-1 rounded-full bg-white/95 p-1 text-slate-600 shadow hover:text-danger" aria-label={`Quitar ${n.archivo.name}`}>
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
            {total < MAX_IMAGENES && (
              <li>
                <button
                  type="button"
                  onClick={() => inputArchivo.current?.click()}
                  className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 text-xs text-slate-500 hover:border-primary hover:text-primary"
                >
                  <ImagePlus className="h-5 w-5" aria-hidden="true" />
                  Agregar
                </button>
              </li>
            )}
          </ul>
          <input ref={inputArchivo} type="file" accept={TIPOS.join(',')} multiple onChange={agregarArchivos} className="sr-only" aria-label="Seleccionar imágenes del producto" tabIndex={-1} />
          {errorImagen || errores.imagenesEliminar ? (
            <p className="mt-1.5 text-xs font-medium text-danger" role="alert">
              {errorImagen || errores.imagenesEliminar}
            </p>
          ) : (
            <p className="mt-1.5 text-xs text-slate-500">Hasta {plural(MAX_IMAGENES, 'imagen', 'imágenes')} JPG, PNG o WEBP de máximo {MAX_MB} MB. Sin imágenes se usa una de ejemplo.</p>
          )}
        </div>

        <Switch checked={form.activo} onChange={(v) => setForm((f) => ({ ...f, activo: v }))} label="Producto activo (visible en el catálogo)" />
      </form>
    </Modal>
  );
}
