import api from './axios';
import { descargarBlob } from '../utils/download';
import { isoDate } from '../utils/dates';

const data = (res) => res.data.data;

export const listInvoices = (params) => api.get('/invoices', { params }).then(data);
export const getInvoice = (id) => api.get(`/invoices/${id}`).then(data);

export const exportInvoices = async (params) => {
  const res = await api.get('/invoices/export', { params, responseType: 'blob' });
  descargarBlob(res.data, `facturas-${isoDate()}.csv`);
};
