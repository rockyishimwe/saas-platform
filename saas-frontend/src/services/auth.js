import api from '/api';

export const authService = {
    login:async (email,password)=>{
        const response = await api.post('/auth/Login',{email,password});
        return response.data;
    },
    register:async(userData) =>{
        const response = await api.post('/auth/register',userData);
        return response.data;
    },
    logout:() =>{
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
    },
    refreshToken:async(refreshToken)=>{
        const response = await api.post('/auth/refresh-token',{refreshToken});
        return response.data;
    },
    getCurrentUser:async()=>{
        const response = await api.get('/users/profile');
        return response.data;
    }
};