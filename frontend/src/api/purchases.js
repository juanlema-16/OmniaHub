import api from './axios';

const data = (res) => res.data.data;

export const listPurchases = (params) => api.get('/purchases', { params }).then(data);
export const getPurchase = (id) => api.get(`/purchases/${id}`).then(data);
export const createPurchase = (body) => api.post('/purchases', body).then(data);
