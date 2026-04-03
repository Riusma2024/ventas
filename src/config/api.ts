/// <reference types="vite/client" />
import axios from 'axios';

// URL de la API — backend en ventas-murex.vercel.app (Root Dir: miss-ventas-api)
const API_URL = 'https://ventas-murex.vercel.app/api';

export const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor para inyectar el Token en cada petición automáticamente
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Interceptor para manejar tokens caducados (Si el token muere, cerramos sesión)
api.interceptors.response.use((response) => {
    return response;
}, (error) => {
    if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        window.location.href = '/login';
    }
    return Promise.reject(error);
});
