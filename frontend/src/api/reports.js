import api from './axios';
import { descargarBlob } from '../utils/download';

export const getSummary = (params) => api.get('/reports/summary', { params }).then((res) => res.data.data);

// Descarga el CSV de órdenes (el backend agrega BOM para que Excel respete los acentos)
export const exportOrders = async (params) => {
  const res = await api.get('/reports/orders/export', { params, responseType: 'blob' });
  descargarBlob(res.data, `ordenes-${params.desde || 'periodo'}-${params.hasta || 'hoy'}.csv`);
};
