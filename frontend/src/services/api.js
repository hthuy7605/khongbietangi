import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

export const getAllDishes = (category) => api.get('/monan', { params: category ? { category } : {} }).then(res => res.data);
export const getDish = (id) => api.get(`/monan/${id}`).then(res => res.data);
export const createDish = (data) => api.post('/monan', data).then(res => res.data);
export const updateDish = (id, data) => api.put(`/monan/${id}`, data).then(res => res.data);
export const deleteDish = (id) => api.delete(`/monan/${id}`).then(res => res.data);
export const login = (username, password) => api.post('/login', { username, password }).then(res => res.data);

export default api;
