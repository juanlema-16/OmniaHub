import Carrier from '../models/Carrier.js';
import CarrierPreference from '../models/CarrierPreference.js';
import { ApiError } from '../utils/ApiError.js';

export const listCarriers = () => Carrier.find({ activa: true }).sort({ nombre: 1 }).select('nombre logo tarifas activa');

export const getCarrierForUser = async (userId, session = null) => {
  const carrier = await Carrier.findOne({ user: userId }).session(session);
  if (!carrier) throw ApiError.forbidden('Tu usuario no está asociado a una transportadora');
  return carrier;
};

// Devuelve la tarifa de una transportadora activa para el departamento, o lanza 400
export const getTarifa = async (carrierId, departamento, session = null) => {
  const carrier = await Carrier.findOne({ _id: carrierId, activa: true }).session(session);
  if (!carrier) throw ApiError.badRequest('Datos inválidos', [{ campo: 'transportadora', mensaje: 'La transportadora no existe o no está activa' }]);
  const tarifa = carrier.tarifaPara(departamento);
  if (!tarifa) throw ApiError.badRequest(`${carrier.nombre} no tiene cobertura en ${departamento}`);
  return { carrier, tarifa };
};

export const quote = async (departamento, user) => {
  const carriers = await Carrier.find({ activa: true, 'tarifas.departamento': departamento }).select('nombre logo tarifas');
  const preferencia =
    user?.role === 'dropshipper'
      ? await CarrierPreference.findOne({ dropshipper: user._id, departamento }).select('carrier').lean()
      : null;

  const opciones = carriers
    .map((c) => {
      const { precio, dias } = c.tarifaPara(departamento);
      return {
        carrier: { _id: c._id, nombre: c.nombre, logo: c.logo },
        precio,
        dias,
        preferida: Boolean(preferencia && preferencia.carrier.equals(c._id)),
      };
    })
    .sort((a, b) => a.precio - b.precio || a.dias - b.dias);

  if (opciones.length) {
    const masBarata = opciones[0].precio;
    const masRapida = Math.min(...opciones.map((o) => o.dias));
    opciones.forEach((o) => {
      o.masBarata = o.precio === masBarata;
      o.masRapida = o.dias === masRapida;
    });
  }
  return { departamento, opciones };
};

export const listPreferences = (dropshipper) =>
  CarrierPreference.find({ dropshipper: dropshipper._id }).sort({ departamento: 1 }).populate('carrier', 'nombre logo');

export const setPreference = async (dropshipper, { departamento, carrier }) => {
  await getTarifa(carrier, departamento);
  return CarrierPreference.findOneAndUpdate(
    { dropshipper: dropshipper._id, departamento },
    { carrier },
    { upsert: true, returnDocument: 'after', runValidators: true }
  ).populate('carrier', 'nombre logo');
};

export const removePreference = async (dropshipper, departamento) => {
  const { deletedCount } = await CarrierPreference.deleteOne({ dropshipper: dropshipper._id, departamento });
  if (!deletedCount) throw ApiError.notFound(`No tienes transportadora favorita para ${departamento}`);
};
