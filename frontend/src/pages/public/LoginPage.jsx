import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Lock, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthLayout from '../../components/layout/AuthLayout';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { useAuth } from '../../context/AuthContext';
import { getErrorMessage } from '../../api/axios';
import { resendCode } from '../../api/auth';
import { homeFor } from '../../utils/constants';
import { erroresDeApi, reglas, validar } from '../../utils/validation';

const ESQUEMA = {
  email: [reglas.requerido('El correo'), reglas.email],
  password: [reglas.requerido('La contraseña', 'a')],
};

// Accesos rápidos solo en desarrollo para probar cada rol con el seed
const DEMO = [
  ['Admin', 'admin@omniahub.test'],
  ['Proveedor', 'proveedor@omniahub.test'],
  ['Dropshipper', 'dropshipper@omniahub.test'],
  ['Transportadora', 'rutaexpress@omniahub.test'],
  ['Cliente', 'cliente@omniahub.test'],
  ['KYC pendiente', 'nuevo@omniahub.test'],
];

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: location.state?.email || '', password: '' });
  const [errores, setErrores] = useState({});
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);

  const cambiar = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrores((er) => ({ ...er, [e.target.name]: undefined }));
  };

  const enviar = async (e) => {
    e.preventDefault();
    const encontrados = validar(ESQUEMA, form);
    setErrores(encontrados);
    setError('');
    if (Object.keys(encontrados).length) return;

    setEnviando(true);
    try {
      const user = await login({ email: form.email.trim(), password: form.password });
      toast.success(`¡Hola, ${user.nombre}!`);
      const destino = location.state?.from;
      // Solo se vuelve a una ruta del propio panel o, siendo cliente, a la tienda donde estaba comprando
      const permitido = destino && (destino.startsWith(homeFor(user.role)) || (user.role === 'cliente' && destino.startsWith('/tienda/')));
      navigate(permitido ? destino : homeFor(user.role), { replace: true });
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors?.codigo === 'EMAIL_NO_VERIFICADO') {
        const { devCode } = await resendCode(form.email.trim()).catch(() => ({}));
        toast('Te enviamos un nuevo código de verificación', { icon: '✉️' });
        navigate('/verificar-correo', { state: { email: form.email.trim(), devCode } });
        return;
      }
      setErrores(erroresDeApi(err));
      setError(getErrorMessage(err));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <AuthLayout
      title="Inicia sesión"
      subtitle="Entra a tu panel de OmniaHub."
      footer={
        <>
          ¿No tienes cuenta?{' '}
          <Link to="/registro" state={{ from: location.state?.from }} className="font-semibold text-primary hover:text-primary-hover">
            Regístrate gratis
          </Link>
        </>
      }
    >
      <form onSubmit={enviar} className="space-y-4" noValidate>
        {error && <Alert tone="error">{error}</Alert>}
        <Input label="Correo electrónico" name="email" type="email" icon={Mail} autoComplete="email" value={form.email} onChange={cambiar} error={errores.email} placeholder="nombre@correo.com" />
        <Input label="Contraseña" name="password" type="password" icon={Lock} autoComplete="current-password" value={form.password} onChange={cambiar} error={errores.password} placeholder="Tu contraseña" />
        <Button type="submit" fullWidth size="lg" loading={enviando}>
          {enviando ? 'Entrando…' : 'Iniciar sesión'}
        </Button>
      </form>

      {import.meta.env.DEV && (
        <div className="mt-8 rounded-xl border border-dashed border-slate-300 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Usuarios demo · contraseña Demo123*</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {DEMO.map(([rol, email]) => (
              <button
                key={email}
                type="button"
                onClick={() => {
                  setForm({ email, password: 'Demo123*' });
                  setErrores({});
                  setError('');
                }}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 hover:border-primary hover:text-primary"
              >
                {rol}
              </button>
            ))}
          </div>
        </div>
      )}
    </AuthLayout>
  );
}
