import api from './axios';

const data = (res) => res.data.data;

export const getBanners = (ubicacion) => api.get('/public/banners', { params: { ubicacion } }).then(data);
export const listPolicies = () => api.get('/public/policies').then(data);
export const getPolicy = (slug) => api.get(`/public/policies/${slug}`).then(data);
