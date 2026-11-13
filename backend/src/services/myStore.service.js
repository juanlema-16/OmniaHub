import User from '../models/User.js';
import StoreProduct from '../models/StoreProduct.js';
import Order from '../models/Order.js';
import { fileUrl, removeFilesByUrl } from '../middlewares/upload.js';

const resumen = async (user) => {
  const [productosActivos, productosTotal, ventasTienda] = await Promise.all([
    StoreProduct.countDocuments({ dropshipper: user._id, activo: true }),
    StoreProduct.countDocuments({ dropshipper: user._id }),
    Order.countDocuments({ dropshipper: user._id, origen: 'TIENDA' }),
  ]);
  return { ...user.toJSON().tienda, productosActivos, productosTotal, ventasTienda };
};

export const get = async (dropshipper) => resumen(await User.findById(dropshipper._id));

// El slug no cambia al renombrar: así el link público que ya compartió sigue funcionando
export const update = async (dropshipper, { nombre, quitarLogo }, file) => {
  const user = await User.findById(dropshipper._id);
  const logoAnterior = user.tienda.logo;
  if (nombre) user.tienda.nombre = nombre;
  if (file) user.tienda.logo = fileUrl('logos', file.filename);
  else if (quitarLogo) user.tienda.logo = undefined;
  await user.save();
  if (logoAnterior && logoAnterior !== user.tienda.logo && logoAnterior.startsWith('/uploads/')) removeFilesByUrl([logoAnterior]);
  return resumen(user);
};
