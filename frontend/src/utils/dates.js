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

// Fecha "AAAA-MM-DD" en hora de Guatemala, para inputs type="date" y filtros de la API
export const isoDate = (value = new Date()) => new Date(value).toLocaleDateString('en-CA', { timeZone: TZ });
export const haceDiasISO = (dias) => isoDate(Date.now() - dias * 86_400_000);

const diaCorto = new Intl.DateTimeFormat('es-GT', { timeZone: 'UTC', day: '2-digit', month: 'short' });
export const formatDiaCorto = (iso) => diaCorto.format(new Date(`${iso}T00:00:00Z`));

// Todos los días entre dos fechas "AAAA-MM-DD" (para que las gráficas no salten días sin datos)
export const diasEntre = (desde, hasta) => {
  const dias = [];
  for (let d = new Date(`${desde}T00:00:00Z`); d <= new Date(`${hasta}T00:00:00Z`); d.setUTCDate(d.getUTCDate() + 1)) {
    dias.push(d.toISOString().slice(0, 10));
  }
  return dias;
};
