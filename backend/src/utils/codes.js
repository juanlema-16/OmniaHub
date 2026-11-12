import Counter from '../models/Counter.js';

export const pad = (n, size = 6) => String(n).padStart(size, '0');

export const formatNumeroOrden = (seq) => `ORD-${pad(seq)}`;
export const formatGuia = (seq, year = new Date().getFullYear()) => `OH-${year}-${pad(seq)}`;
export const formatNumeroFactura = (seq) => `FAC-${pad(seq)}`;

export const nextSequence = async (key, session = null) => {
  const counter = await Counter.findOneAndUpdate(
    { _id: key },
    { $inc: { seq: 1 } },
    { upsert: true, returnDocument: 'after', session }
  );
  return counter.seq;
};

export const generarNumeroOrden = async (session) => formatNumeroOrden(await nextSequence('order', session));
export const generarGuia = async (session) => formatGuia(await nextSequence('guia', session));
export const generarNumeroFactura = async (session) => formatNumeroFactura(await nextSequence('invoice', session));

export const slugify = (text) =>
  text
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export const generarCodigoVerificacion = () => String(Math.floor(100000 + Math.random() * 900000));

export const round2 = (n) => Math.round((Number(n) + Number.EPSILON) * 100) / 100;
