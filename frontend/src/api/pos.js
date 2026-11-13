import api from './axios';

const data = (res) => res.data.data;

export const getCurrentCash = () => api.get('/pos/cash/current').then(data);
export const openCash = (body) => api.post('/pos/cash/open', body).then(data);
export const closeCash = (body) => api.post('/pos/cash/close', body).then(data);
export const listCashSessions = (params) => api.get('/pos/cash/sessions', { params }).then(data);
export const listPosSales = (params) => api.get('/pos/sales', { params }).then(data);
export const createPosSale = (body) => api.post('/pos/sales', body).then(data);
