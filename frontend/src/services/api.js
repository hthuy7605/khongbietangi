import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add response interceptor for error handling
api.interceptors.response.use(
    response => response,
    error => {
        let message = 'Có lỗi xảy ra';

        if (error.response) {
            // Server responded with error status
            switch (error.response.status) {
                case 400:
                    message = error.response.data?.error || 'Dữ liệu không hợp lệ';
                    break;
                case 401:
                    message = error.response.data?.error || 'Bạn cần đăng nhập để thực hiện thao tác này';
                    break;
                case 403:
                    message = 'Bạn không có quyền thực hiện thao tác này';
                    break;
                case 404:
                    message = error.response.data?.error || 'Không tìm thấy dữ liệu';
                    break;
                case 405:
                    message = 'Phương thức không được hỗ trợ';
                    break;
                case 500:
                    message = 'Lỗi server, vui lòng thử lại sau';
                    break;
                default:
                    message = error.response.data?.error || error.response.data?.message || 'Có lỗi xảy ra';
            }
        } else if (error.request) {
            // Request made but no response
            message = 'Không thể kết nối đến server';
        } else {
            // Error in request setup
            message = error.message || 'Có lỗi xảy ra';
        }

        return Promise.reject({ message, originalError: error });
    }
);

export const getAllDishes = (category) => api.get('/monan', { params: category ? { category } : {} }).then(res => res.data);
export const getDish = (id) => api.get(`/monan/${id}`).then(res => res.data);
export const createDish = (data) => api.post('/monan', data).then(res => res.data);
export const updateDish = (id, data) => api.put(`/monan/${id}`, data).then(res => res.data);
export const deleteDish = (id) => api.delete(`/monan/${id}`).then(res => res.data);
export const login = (username, password) => api.post('/login', { username, password }).then(res => res.data);

export default api;
