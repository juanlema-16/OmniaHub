import api from './axios';
import { descargarBlob } from '../utils/download';
import { isoDate } from '../utils/dates';

const data = (res) => res.data.data;

export const getWallet = () => api.get('/wallet').then(data);
export const listTransactions = (params) => api.get('/wallet/transactions', { params }).then(data);

// CSV de movimientos con los mismos filtros de la tabla (el backend agrega BOM para Excel)
export const exportTransactions = async (params) => {
  const res = await api.get('/wallet/transactions/export', { params, responseType: 'blob' });
  descargarBlob(res.data, `movimientos-${isoDate()}.csv`);
};

export const listTopUps = (params) => api.get('/wallet/topups', { params }).then(data);
export const createTopUp = (form) => api.post('/wallet/topups', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then(data);

export const listWithdrawals = (params) => api.get('/wallet/withdrawals', { params }).then(data);
export const createWithdrawal = (body) => api.post('/wallet/withdrawals', body).then(data);
