/// <reference types="vite/client" />
import axios from 'axios';

// URL de la API backend (proyecto "missventas" en Vercel, root: miss-ventas-api)
const API_URL = import.meta.env.VITE_API_URL || 'https://missventas.vercel.app/api';

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
