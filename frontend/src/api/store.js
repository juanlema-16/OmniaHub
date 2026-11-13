import api from './axios';

const data = (res) => res.data.data;

export const getStore = (slug, params) => api.get(`/store/${slug}`, { params }).then(data);
export const getStoreProduct = (slug, productId) => api.get(`/store/${slug}/products/${productId}`).then(data);
export const checkStoreCoupon = (slug, body) => api.post(`/store/${slug}/coupon`, body).then(data);
export const storeCheckout = (slug, body) => api.post(`/store/${slug}/checkout`, body).then(data);
