import api from './axios';

export const getBanners = (ubicacion) => api.get('/public/banners', { params: { ubicacion } }).then((res) => res.data.data);
