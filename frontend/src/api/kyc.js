import api from './axios';

export const getMyKyc = () => api.get('/kyc/me').then((res) => res.data.data);

export const submitKyc = ({ dpiFrente, dpiReverso, selfie }) => {
  const form = new FormData();
  form.append('dpiFrente', dpiFrente);
  form.append('dpiReverso', dpiReverso);
  form.append('selfie', selfie);
  return api.post('/kyc', form, { headers: { 'Content-Type': 'multipart/form-data' } }).then((res) => res.data.data);
};
