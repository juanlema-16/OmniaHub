import Customer from '../models/Customer.js';
import { escapeRegex, paginate } from '../utils/pagination.js';

// Los clientes se crean solos al hacer una orden; aquí solo se consultan
export const list = async (dropshipper, { search, departamento, page, limit }) => {
  const filter = { dropshipper: dropshipper._id };
  if (departamento) filter.departamento = departamento;
  if (search) {
    const re = new RegExp(escapeRegex(search), 'i');
    filter.$or = [{ nombres: re }, { apellidos: re }, { telefono: re }, { email: re }];
  }
  return paginate(Customer, filter, { page, limit, sort: { updatedAt: -1 } });
};
