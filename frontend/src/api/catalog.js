import api from './axios';

const data = (res) => res.data.data;

export const getCatalog = (params) => api.get('/catalog', { params }).then(data);
export const getCatalogProduct = (id) => api.get(`/catalog/${id}`).then(data);
export const getProveedores = () => api.get('/catalog/proveedores').then(data);
export const getCategories = () => api.get('/categories').then(data);
