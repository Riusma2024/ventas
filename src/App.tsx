import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard from './pages/Dashboard';
import SuperadminDashboard from './pages/SuperadminDashboard';
import PublicCatalog from './pages/PublicCatalog';

// Rutas para cualquier usuario autenticado
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, isLoading } = useAuth();
    if (isLoading) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-400">Cargando aplicación...</div>;
    if (!user) return <Navigate to="/login" replace />;
    return <>{children}</>;
};

// Rutas estrictas por rol
const RoleRoute: React.FC<{ allowedRoles: string[] }> = ({ allowedRoles }) => {
    const { user, isLoading } = useAuth();
    if (isLoading) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-400">Cargando...</div>;
    if (!user) return <Navigate to="/login" replace />;

    const userRole = user.rol;
    // Mapeo temporal si el rol antiguo persiste en el token
    const effectiveRoles = allowedRoles.map(r => r === 'vendedor' ? ['vendedor', 'gestionador'] : [r]).flat();

    if (!effectiveRoles.includes(userRole)) {
        if (userRole === 'superadmin') return <Navigate to="/admin" replace />;
        return <Navigate to="/" replace />; 
    }

    return <Outlet />;
};

const AppRoutes: React.FC = () => {
    return (
        <Routes>
            {/* Rutas Públicas */}
            <Route path="/catalogo/:tenant_id" element={<PublicCatalog />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Rutas exclusivas del SUPERADMIN */}
            <Route element={<RoleRoute allowedRoles={['superadmin']} />}>
                <Route path="/admin" element={
                    <ProtectedRoute>
                        <SuperadminDashboard />
                    </ProtectedRoute>
                } />
            </Route>

            {/* Rutas exclusivas del VENDEDOR (Anteriormente Gestionador) */}
            <Route element={<RoleRoute allowedRoles={['vendedor', 'gestionador']} />}>
                <Route path="/" element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                } />
                <Route path="/dashboard" element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                } />
            </Route>

            {/* Redirección por defecto si no hay ruta */}
            <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
    );
};

const App: React.FC = () => {
    return (
        <Router>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </Router>
    );
};

export default App;
