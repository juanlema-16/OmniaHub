import api from './axios';

const data = (res) => res.data.data;
const MULTIPART = { headers: { 'Content-Type': 'multipart/form-data' } };

export const listMyProducts = (params) => api.get('/products/mine', { params }).then(data);
export const createProduct = (formData) => api.post('/products', formData, MULTIPART).then(data);
export const updateProduct = (id, formData) => api.patch(`/products/${id}`, formData, MULTIPART).then(data);
export const deactivateProduct = (id) => api.delete(`/products/${id}`).then((res) => res.data);
