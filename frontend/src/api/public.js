import api from './axios';

const data = (res) => res.data.data;

// rol: en los paneles solo se piden los banners dirigidos a ese rol (o a todos)
export const getBanners = (ubicacion, rol) => api.get('/public/banners', { params: { ubicacion, rol } }).then(data);
export const listPolicies = () => api.get('/public/policies').then(data);
export const getPolicy = (slug) => api.get(`/public/policies/${slug}`).then(data);
