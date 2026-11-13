import { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { CheckCircle2, LifeBuoy, Send } from 'lucide-react';
import useAsync from '../../hooks/useAsync';
import { useAuth } from '../../context/AuthContext';
import { changeTicketStatus, getTicket, replyTicket } from '../../api/tickets';
import { getErrorMessage } from '../../api/axios';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Select from '../ui/Select';
import Alert from '../ui/Alert';
import Badge from '../ui/Badge';
import Skeleton from '../ui/Skeleton';
import { ROLES, TICKET_CATEGORIA, TICKET_ESTADO, TICKET_PRIORIDAD } from '../../utils/constants';
import { formatFechaHora } from '../../utils/dates';

const REFRESCO_MS = 15_000;

function Burbuja({ mensaje, propio, soporte }) {
  const nombre = `${mensaje.autor?.nombre ?? ''} ${mensaje.autor?.apellido ?? ''}`.trim();
  return (
    <li className={`flex ${propio ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${propio ? 'rounded-br-md bg-primary text-white' : soporte ? 'rounded-bl-md bg-emerald-50 text-slate-800 ring-1 ring-emerald-200' : 'rounded-bl-md bg-slate-100 text-slate-800'}`}>
        <p className={`mb-0.5 text-xs font-semibold ${propio ? 'text-primary-100' : soporte ? 'text-emerald-700' : 'text-slate-500'}`}>
          {propio ? 'Tú' : soporte ? 'Soporte OmniaHub' : `${nombre} · ${ROLES[mensaje.rol]?.label ?? mensaje.rol}`}
        </p>
        <p className="whitespace-pre-wrap break-words">{mensaje.texto}</p>
        <p className={`mt-1 text-right text-[11px] ${propio ? 'text-primary-100' : 'text-slate-400'}`}>{formatFechaHora(mensaje.fecha)}</p>
      </div>
    </li>
  );
}

// Conversación tipo chat de un ticket. El admin además cambia su estado; el usuario puede cerrarlo.
export default function TicketConversacion({ ticketId, onClose, onChanged }) {
  const { user } = useAuth();
  const esAdmin = user.role === 'admin';
  const { data: ticket, cargando, error, recargar, setData } = useAsync(() => (ticketId ? getTicket(ticketId) : Promise.resolve(null)), [ticketId]);
  const [texto, setTexto] = useState('');
  const [errorTexto, setErrorTexto] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [cambiando, setCambiando] = useState(false);
  const fin = useRef(null);

  useEffect(() => {
    setTexto('');
    setErrorTexto('');
  }, [ticketId]);

  // Mensajes nuevos de la otra parte sin tener que recargar
  useEffect(() => {
    if (!ticketId) return undefined;
    const id = setInterval(recargar, REFRESCO_MS);
    return () => clearInterval(id);
  }, [ticketId, recargar]);

  useEffect(() => {
    fin.current?.scrollIntoView({ block: 'end' });
  }, [ticket?.mensajes?.length]);

  const cerrado = ticket?.estado === 'CERRADO';

  const enviar = async (e) => {
    e.preventDefault();
    const limpio = texto.trim();
    if (limpio.length < 2) return setErrorTexto('Escribe tu mensaje');
    setEnviando(true);
    try {
      setData(await replyTicket(ticketId, limpio));
      setTexto('');
      setErrorTexto('');
      onChanged?.();
    } catch (err) {
      setErrorTexto(getErrorMessage(err));
    } finally {
      setEnviando(false);
    }
    return undefined;
  };

  const cambiarEstado = async (estado) => {
    setCambiando(true);
    try {
      setData(await changeTicketStatus(ticketId, estado));
      toast.success(`Ticket ${TICKET_ESTADO[estado].label.toLowerCase()}`);
      onChanged?.();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCambiando(false);
    }
  };

  return (
    <Modal
      open={Boolean(ticketId)}
      onClose={onClose}
      size="lg"
      title={ticket ? `${ticket.numero} · ${ticket.asunto}` : 'Ticket'}
      description={ticket && esAdmin ? `${ticket.user.nombre} ${ticket.user.apellido} · ${ROLES[ticket.user.role]?.label} · ${ticket.user.email}` : undefined}
    >
      {error && <Alert tone="error">{error}</Alert>}
      {cargando && !ticket && <Skeleton className="h-64 w-full" />}
      {ticket && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={TICKET_ESTADO[ticket.estado].tone} dot>
              {TICKET_ESTADO[ticket.estado].label}
            </Badge>
            <Badge tone={TICKET_PRIORIDAD[ticket.prioridad].tone}>Prioridad {TICKET_PRIORIDAD[ticket.prioridad].label.toLowerCase()}</Badge>
            <Badge>{TICKET_CATEGORIA[ticket.categoria]}</Badge>
            {ticket.order && <Badge tone="indigo">Orden {ticket.order.numero}</Badge>}
            {esAdmin && (
              <div className="ml-auto w-44">
                <Select aria-label="Cambiar estado" value={ticket.estado} disabled={cambiando} onChange={(e) => cambiarEstado(e.target.value)} options={Object.entries(TICKET_ESTADO).map(([value, s]) => ({ value, label: s.label }))} />
              </div>
            )}
          </div>

          <ul className="max-h-[45vh] min-h-40 space-y-3 overflow-y-auto rounded-xl bg-white p-1" aria-label="Mensajes del ticket" aria-live="polite">
            {ticket.mensajes.map((m) => (
              <Burbuja key={m._id} mensaje={m} propio={m.autor?._id === user._id} soporte={m.rol === 'admin' && !esAdmin} />
            ))}
            <li ref={fin} aria-hidden="true" />
          </ul>

          {cerrado ? (
            <Alert tone="info">Este ticket está cerrado. {esAdmin ? 'Cámbiale el estado para volver a responder.' : 'Si necesitas más ayuda, abre un ticket nuevo.'}</Alert>
          ) : (
            <form onSubmit={enviar} className="space-y-2" noValidate>
              <label htmlFor="respuesta-ticket" className="sr-only">
                Tu respuesta
              </label>
              <textarea
                id="respuesta-ticket"
                value={texto}
                onChange={(e) => {
                  setTexto(e.target.value);
                  setErrorTexto('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) enviar(e);
                }}
                rows={3}
                maxLength={2000}
                aria-invalid={Boolean(errorTexto)}
                placeholder={esAdmin ? 'Escribe tu respuesta al usuario…' : 'Escribe tu mensaje…'}
                className={`w-full resize-y rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${errorTexto ? 'border-danger focus:ring-red-100' : 'border-slate-300 focus:border-primary focus:ring-primary-100'}`}
              />
              {errorTexto && <p className="text-xs font-medium text-danger">{errorTexto}</p>}
              <div className="flex flex-wrap items-center justify-between gap-2">
                {!esAdmin ? (
                  <Button type="button" variant="ghost" size="sm" icon={CheckCircle2} loading={cambiando} onClick={() => cambiarEstado('CERRADO')}>
                    Ya se resolvió, cerrar ticket
                  </Button>
                ) : (
                  <span className="flex items-center gap-1.5 text-xs text-slate-500">
                    <LifeBuoy className="h-3.5 w-3.5" aria-hidden="true" /> Ctrl + Enter para enviar
                  </span>
                )}
                <Button type="submit" icon={Send} loading={enviando}>
                  Enviar
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </Modal>
  );
}
