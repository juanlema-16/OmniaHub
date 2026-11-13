import api from './axios';

const data = (res) => res.data.data;

export const listCoupons = (params) => api.get('/coupons', { params }).then(data);
export const createCoupon = (body) => api.post('/coupons', body).then(data);
export const updateCoupon = (id, body) => api.patch(`/coupons/${id}`, body).then(data);
export const removeCoupon = (id) => api.delete(`/coupons/${id}`).then((res) => res.data);
