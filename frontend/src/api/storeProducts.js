import api from './axios';

const data = (res) => res.data.data;

export const listStoreProducts = (params) => api.get('/store-products', { params }).then(data);
export const importProduct = (body) => api.post('/store-products', body).then(data);
export const updateStoreProduct = (id, body) => api.patch(`/store-products/${id}`, body).then(data);
export const removeStoreProduct = (id) => api.delete(`/store-products/${id}`).then(data);
