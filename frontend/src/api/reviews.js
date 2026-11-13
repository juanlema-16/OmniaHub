import api from './axios';

const data = (res) => res.data.data;

export const getProductReviews = (productId, params) => api.get(`/reviews/products/${productId}`, { params }).then(data);
export const listMyReviews = () => api.get('/reviews/mine').then(data);
export const createReview = (body) => api.post('/reviews', body).then(data);
export const listAllReviews = (params) => api.get('/reviews', { params }).then(data);
export const setReviewVisible = (id, visible) => api.patch(`/reviews/${id}`, { visible }).then(data);
