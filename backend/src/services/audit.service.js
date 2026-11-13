import { Types } from 'mongoose';
import AuditLog from '../models/AuditLog.js';
import User from '../models/User.js';

export const logAudit = async ({ user, accion, entidad, entidadId, detalle }, session = null) => {
  const [log] = await AuditLog.create([{ user, accion, entidad, entidadId, detalle }], { session });
  return log;
};

const ESTADOS = {
  PENDIENTE_CONFIRMACION: 'Pendiente de confirmación',
  PENDIENTE: 'Pendiente',
  GUIA_GENERADA: 'Guía generada',
  EN_TRANSITO: 'En tránsito',
  ENTREGADO: 'Entregado',
  NOVEDAD: 'Novedad',
  DEVOLUCION: 'Devolución',
  CANCELADO: 'Cancelado',
  ABIERTO: 'Abierto',
  EN_PROCESO: 'En proceso',
  RESUELTO: 'Resuelto',
  CERRADO: 'Cerrado',
};
const ROLES = { admin: 'administrador', proveedor: 'proveedor', dropshipper: 'dropshipper', transportadora: 'transportadora', cliente: 'cliente' };
const q = (n) => `Q ${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const estado = (e) => ESTADOS[e] || e;

// Frase legible de cada acción con los datos reales (nombres, montos, órdenes), para la tabla de auditoría
const frase = (r, nombreDe) => {
  const d = r.detalle || {};
  const actor = r.user ? `${r.user.nombre} ${r.user.apellido}` : 'El sistema';
  const afectado = nombreDe(d.usuario) || nombreDe(d.email) || nombreDe(r.entidadId) || d.email || 'un usuario';
  const conMotivo = (texto) => (d.motivo ? `${texto}: ${d.motivo}` : texto);
  switch (r.accion) {
    case 'KYC_ENVIADO': return `${actor} envió sus documentos de KYC`;
    case 'KYC_APROBADO': return `KYC de ${afectado} aprobado`;
    case 'KYC_RECHAZADO': return conMotivo(`KYC de ${afectado} rechazado`);
    case 'RECARGA_SOLICITADA': return `${actor} solicitó una recarga de ${q(d.monto)}`;
    case 'RECARGA_APROBADA': return `Recarga de ${q(d.monto)} de ${afectado} aprobada`;
    case 'RECARGA_RECHAZADA': return conMotivo(`Recarga de ${q(d.monto)} de ${afectado} rechazada`);
    case 'RETIRO_SOLICITADO': return `${actor} solicitó un retiro de ${q(d.monto)}${d.banco ? ` a ${d.banco}` : ''}`;
    case 'RETIRO_APROBADO': return `Retiro de ${q(d.monto)} de ${afectado} aprobado`;
    case 'RETIRO_RECHAZADO': return conMotivo(`Retiro de ${q(d.monto)} de ${afectado} rechazado`);
    case 'ESTADO_CORREGIDO': return `Orden ${d.numero}: de ${estado(d.de)} a ${estado(d.a)}${d.nota ? ` (${d.nota})` : ''}`;
    case 'USUARIO_CREADO': return `Cuenta de ${ROLES[d.role] || d.role} creada para ${afectado}`;
    case 'USUARIO_BLOQUEADO': return conMotivo(`${afectado} fue bloqueado`);
    case 'USUARIO_DESBLOQUEADO': return `${afectado} fue desbloqueado`;
    case 'CONFIGURACION_ACTUALIZADA': {
      const cambios = Object.keys(d.despues || {}).filter((k) => d.antes?.[k] !== d.despues[k]);
      const textos = { comisionPorcentaje: (v) => `comisión ${v}%`, montoMinimoRetiro: (v) => `retiro mínimo ${q(v)}` };
      return cambios.length ? `Configuración: ${cambios.map((k) => (textos[k] ? textos[k](d.despues[k]) : k)).join(', ')}` : 'Configuración actualizada';
    }
    case 'TRANSPORTADORA_ACTUALIZADA': return `Transportadora${d.nombre ? ` ${d.nombre}` : ''} actualizada`;
    case 'TARIFAS_ACTUALIZADAS': return `Tarifas actualizadas en ${d.departamentos?.length ?? 0} departamentos`;
    case 'BANNER_CREADO': return `Banner "${d.titulo}" creado`;
    case 'BANNER_ACTUALIZADO': return 'Banner actualizado';
    case 'BANNER_ELIMINADO': return `Banner "${d.titulo}" eliminado`;
    case 'POLITICA_ACTUALIZADA': return `Política "${d.slug}" actualizada`;
    case 'CUENTA_BANCARIA_CREADA': return `${actor} registró una cuenta en ${d.banco}`;
    case 'CUENTA_BANCARIA_EDITADA': return `${actor} editó su cuenta bancaria`;
    case 'CUENTA_BANCARIA_ELIMINADA': return `${actor} eliminó su cuenta en ${d.banco}`;
    case 'CAJA_ABIERTA': return `${actor} abrió caja con ${q(d.montoInicial)}`;
    case 'CAJA_CERRADA': return `${actor} cerró caja: esperado ${q(d.montoEsperado)}, contado ${q(d.montoContado)}`;
    case 'RESENA_OCULTA': return `Reseña de "${d.producto}" ocultada`;
    case 'RESENA_MOSTRADA': return `Reseña de "${d.producto}" visible de nuevo`;
    case 'TICKET_ESTADO': return `Ticket de ${estado(d.de)} a ${estado(d.a)}`;
    default: return '';
  }
};

// Agrega "resumen" a cada registro. Resuelve correos e IDs de usuarios del detalle a sus nombres reales.
export const conResumen = async (registros) => {
  const planos = registros.map((r) => (typeof r.toJSON === 'function' ? r.toJSON() : r));
  const valores = planos.flatMap((r) => [r.detalle?.usuario, r.detalle?.email, r.entidad === 'User' ? r.entidadId : null].filter(Boolean).map(String));
  const ids = valores.filter((v) => Types.ObjectId.isValid(v) && !v.includes('@'));
  const correos = valores.filter((v) => v.includes('@'));
  const usuarios = valores.length ? await User.find({ $or: [{ _id: { $in: ids } }, { email: { $in: correos } }] }).select('nombre apellido email').lean() : [];
  const nombres = new Map(usuarios.flatMap((u) => [[String(u._id), `${u.nombre} ${u.apellido}`], [u.email, `${u.nombre} ${u.apellido}`]]));
  const nombreDe = (v) => (v ? nombres.get(String(v)) : undefined);
  return planos.map((r) => ({ ...r, resumen: frase(r, nombreDe) }));
};
