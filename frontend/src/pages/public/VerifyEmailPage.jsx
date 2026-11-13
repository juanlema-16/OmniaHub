import { useEffect, useRef, useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { MailCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthLayout from '../../components/layout/AuthLayout';
import Button from '../../components/ui/Button';
import Alert from '../../components/ui/Alert';
import { useAuth } from '../../context/AuthContext';
import { resendCode } from '../../api/auth';
import { getErrorMessage } from '../../api/axios';
import { homeFor } from '../../utils/constants';

const ESPERA = 60;

export default function VerifyEmailPage() {
  const { verifyEmail } = useAuth();
  const navigate = useNavigate();
  const { state } = useLocation();
  const email = state?.email;
  const [digitos, setDigitos] = useState(Array(6).fill(''));
  const [devCode, setDevCode] = useState(state?.devCode);
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [reenviando, setReenviando] = useState(false);
  const [espera, setEspera] = useState(ESPERA);
  const inputs = useRef([]);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (espera <= 0) return undefined;
    const t = setTimeout(() => setEspera((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [espera]);

  if (!email) return <Navigate to="/login" replace />;

  const codigo = digitos.join('');

  const escribir = (i, valor) => {
    const solo = valor.replace(/\D/g, '');
    if (solo.length > 1) {
      // Pegar el código completo
      const nuevos = solo.slice(0, 6).split('');
      setDigitos([...nuevos, ...Array(6 - nuevos.length).fill('')]);
      inputs.current[Math.min(nuevos.length, 5)]?.focus();
      return;
    }
    setDigitos((d) => d.map((x, j) => (j === i ? solo : x)));
    setError('');
    if (solo && i < 5) inputs.current[i + 1]?.focus();
  };

  const tecla = (i, e) => {
    if (e.key === 'Backspace' && !digitos[i] && i > 0) inputs.current[i - 1]?.focus();
  };

  const verificar = async (e) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(codigo)) {
      setError('Ingresa los 6 dígitos del código');
      return;
    }
    setEnviando(true);
    try {
      const user = await verifyEmail(email, codigo);
      toast.success('¡Correo verificado! Bienvenido a OmniaHub');
      const destino = state?.from;
      navigate(user.role === 'cliente' && destino?.startsWith('/tienda/') ? destino : homeFor(user.role), { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
      setDigitos(Array(6).fill(''));
      inputs.current[0]?.focus();
    } finally {
      setEnviando(false);
    }
  };

  const reenviar = async () => {
    setReenviando(true);
    try {
      const data = await resendCode(email);
      setDevCode(data.devCode);
      setEspera(ESPERA);
      setError('');
      toast.success('Te enviamos un nuevo código');
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setReenviando(false);
    }
  };

  return (
    <AuthLayout
      title="Verifica tu correo"
      subtitle={`Escribe el código de 6 dígitos que enviamos a ${email}. Vence en 15 minutos.`}
      footer={
        <Link to="/login" className="font-medium text-slate-600 hover:text-slate-900">
          Volver a iniciar sesión
        </Link>
      }
    >
      <form onSubmit={verificar} className="space-y-6" noValidate>
        {devCode && (
          <Alert tone="info" title="Modo desarrollo">
            Tu código es <strong className="font-mono text-base tracking-widest">{devCode}</strong> (en producción llegaría por correo).
          </Alert>
        )}
        <div className="flex justify-between gap-2" role="group" aria-label="Código de verificación">
          {digitos.map((d, i) => (
            <input
              key={i}
              ref={(el) => (inputs.current[i] = el)}
              value={d}
              onChange={(e) => escribir(i, e.target.value)}
              onKeyDown={(e) => tecla(i, e)}
              inputMode="numeric"
              autoComplete={i === 0 ? 'one-time-code' : 'off'}
              maxLength={6}
              aria-label={`Dígito ${i + 1}`}
              className={`h-14 w-12 rounded-xl border text-center text-xl font-bold text-slate-900 focus:outline-none focus:ring-2 sm:w-14 ${
                error ? 'border-danger focus:ring-red-100' : 'border-slate-300 focus:border-primary focus:ring-primary-100'
              }`}
            />
          ))}
        </div>
        {error && (
          <p className="text-center text-sm font-medium text-danger" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" fullWidth size="lg" icon={MailCheck} loading={enviando} disabled={codigo.length < 6}>
          {enviando ? 'Verificando…' : 'Verificar correo'}
        </Button>
        <p className="text-center text-sm text-slate-600">
          ¿No te llegó?{' '}
          {espera > 0 ? (
            <span className="text-slate-400">Puedes pedir otro en {espera} s</span>
          ) : (
            <button type="button" onClick={reenviar} disabled={reenviando} className="font-semibold text-primary hover:text-primary-hover disabled:opacity-60">
              {reenviando ? 'Enviando…' : 'Reenviar código'}
            </button>
          )}
        </p>
      </form>
    </AuthLayout>
  );
}
