import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Login from './pages/Login';
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

    if (!allowedRoles.includes(user.rol)) {
        // Redirigir según el rol que sí tengan
        if (user.rol === 'superadmin') return <Navigate to="/admin" replace />;
        return <Navigate to="/" replace />; // Gestionador o Cliente
    }

    return <Outlet />;
};

const AppRoutes: React.FC = () => {
    return (
        <Routes>
            {/* Rutas Públicas */}
            <Route path="/catalogo/:tenant_id" element={<PublicCatalog />} />

            <Route path="/login" element={<Login />} />

            {/* Rutas exclusivas del SUPERADMIN */}
            <Route element={<RoleRoute allowedRoles={['superadmin']} />}>
                <Route path="/admin" element={
                    <ProtectedRoute>
                        <SuperadminDashboard />
                    </ProtectedRoute>
                } />
            </Route>

            {/* Rutas exclusivas del GESTIONADOR */}
            <Route element={<RoleRoute allowedRoles={['gestionador']} />}>
                <Route path="/*" element={
                    <ProtectedRoute>
                        <Dashboard />
                    </ProtectedRoute>
                } />
            </Route>
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
