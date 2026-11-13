const TZ = 'America/Guatemala';

const fecha = new Intl.DateTimeFormat('es-GT', { timeZone: TZ, day: '2-digit', month: 'short', year: 'numeric' });
const fechaHora = new Intl.DateTimeFormat('es-GT', {
  timeZone: TZ,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});
const relativa = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

export const formatFecha = (value) => (value ? fecha.format(new Date(value)) : '—');
export const formatFechaHora = (value) => (value ? fechaHora.format(new Date(value)) : '—');

export const formatRelativa = (value) => {
  if (!value) return '';
  const segundos = Math.round((new Date(value).getTime() - Date.now()) / 1000);
  const abs = Math.abs(segundos);
  if (abs < 60) return 'hace un momento';
  if (abs < 3600) return relativa.format(Math.round(segundos / 60), 'minute');
  if (abs < 86400) return relativa.format(Math.round(segundos / 3600), 'hour');
  if (abs < 604800) return relativa.format(Math.round(segundos / 86400), 'day');
  return formatFecha(value);
};
