import api from './axios';

const data = (res) => res.data.data;

export const addFavorite = (productId) => api.put(`/favorites/${productId}`).then(data);
export const removeFavorite = (productId) => api.delete(`/favorites/${productId}`).then(data);
