import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Package, Users, Users2, PieChart, LogOut, Inbox } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
    children: React.ReactNode;
    activeTab: string;
    setActiveTab: (tab: string) => void;
    badges?: Record<string, number>;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, badges }) => {
    const { logout } = useAuth();

    const tabs = [
        { id: 'home', icon: Home, label: 'Inicio' },
        { id: 'inventory', icon: Package, label: 'Inventario' },
        { id: 'crm', icon: Users, label: 'Clientes' },
        { id: 'tandas', icon: Users2, label: 'Tandas' },
        { id: 'requests', icon: Inbox, label: 'Solicitudes' },
        { id: 'reports', icon: PieChart, label: 'Resumen' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row relative overflow-hidden">
            {/* Sidebar for Desktop/Tablet */}
            <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-white fixed h-full z-50 shadow-2xl">
                <div className="p-8">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-2 h-2 bg-primary-500 rounded-full animate-pulse"></div>
                        <span className="text-[8px] text-primary-400 font-black tracking-[0.2em] uppercase">Panel de Control</span>
                    </div>
                    <h1 className="text-2xl font-black tracking-tighter text-white">Miss Ventas</h1>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all ${isActive
                                    ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                                    : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
                            >
                                <div className="relative">
                                    <Icon size={20} />
                                    {badges && (badges[tab.id] || 0) > 0 && !isActive && (
                                        <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 text-white text-[8px] font-black flex items-center justify-center rounded-full border border-slate-900">
                                            {badges[tab.id] > 9 ? '+9' : badges[tab.id]}
                                        </span>
                                    )}
                                </div>
                                <span className="font-bold text-sm tracking-tight">{tab.label}</span>
                            </button>
                        );
                    })}
                </nav>

                <div className="p-6 mt-auto">
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-red-400 hover:bg-red-500/10 transition-all font-bold text-sm"
                    >
                        <LogOut size={20} />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>

            {/* Main Wrapper */}
            <div className="flex-1 flex flex-col md:ml-64 min-h-screen transition-all duration-300">
                {/* Header Mobile/Tablet */}
                <header className="p-6 md:p-8 pb-4 sticky top-0 bg-slate-50/90 backdrop-blur-2xl z-40 flex justify-between items-center w-full max-w-7xl mx-auto">
                    <div>
                        <div className="hidden md:flex items-center gap-2 mb-1">
                            <span className="text-[10px] text-primary-500 font-black tracking-widest uppercase">Sistema Administrativo</span>
                        </div>
                        <div className="md:hidden flex items-center gap-2 mb-1">
                            <div className="w-3 h-3 bg-primary-500 rounded-full animate-pulse-subtle"></div>
                            <span className="text-[10px] text-primary-500 font-black tracking-[0.2em] uppercase">Sistema En Línea</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter uppercase">
                            {activeTab === 'home' ? 'Miss Ventas' : tabs.find(t => t.id === activeTab)?.label}
                            {activeTab === 'home' && <span className="text-[10px] bg-slate-900 text-white px-2 py-1 rounded-lg ml-2 align-middle font-bold lowercase">v1.8</span>}
                        </h1>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 p-4 md:p-8 pb-32 md:pb-8 w-full max-w-7xl mx-auto">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {children}
                        </motion.div>
                    </AnimatePresence>
                </main>

                {/* Navigation Bar Mobile Only */}
                <nav className="md:hidden fixed bottom-0 left-0 right-0 p-4 z-20">
                    <div className="bg-slate-900/95 backdrop-blur-xl rounded-[2.5rem] p-2 flex justify-between items-center shadow-2xl shadow-slate-900/40">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`relative flex items-center justify-center p-4 rounded-full transition-all duration-300 ${isActive ? 'bg-primary-500 text-white' : 'text-slate-400 hover:text-slate-200'
                                        }`}
                                >
                                    <Icon size={24} />
                                    {badges && (badges[tab.id] || 0) > 0 && !isActive && (
                                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-slate-900 shadow-lg animate-pulse">
                                            {badges[tab.id] > 9 ? '+9' : badges[tab.id]}
                                        </span>
                                    )}
                                    {isActive && (
                                        <motion.div
                                            layoutId="activeTabMobile"
                                            className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full"
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </nav>
            </div>
        </div>
    );
};
