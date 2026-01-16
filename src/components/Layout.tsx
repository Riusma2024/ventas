import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home, Package, Users, Users2, PieChart, Menu } from 'lucide-react';

interface LayoutProps {
    children: React.ReactNode;
    activeTab: string;
    setActiveTab: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
    const tabs = [
        { id: 'home', icon: Home, label: 'Inicio' },
        { id: 'inventory', icon: Package, label: 'Inventario' },
        { id: 'crm', icon: Users, label: 'Clientes' },
        { id: 'tandas', icon: Users2, label: 'Tandas' },
        { id: 'reports', icon: PieChart, label: 'Resumen' },
    ];

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col max-w-md mx-auto relative shadow-2xl">
            {/* Header */}
            <header className="p-8 pb-4 sticky top-0 bg-slate-50/90 backdrop-blur-2xl z-40 flex justify-between items-end">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-3 h-3 bg-primary-500 rounded-full animate-pulse-subtle"></div>
                        <span className="text-[10px] text-primary-500 font-black tracking-[0.2em] uppercase">Sistema En Línea</span>
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter">
                        Miss Ventas
                        <span className="text-[10px] bg-slate-900 text-white px-2 py-1 rounded-lg ml-2 align-middle font-bold">V1.7</span>
                    </h1>
                </div>
                <button className="p-4 bg-white shadow-premium rounded-2xl text-slate-900 border border-slate-100 active:scale-90 transition-transform">
                    <Menu size={22} strokeWidth={2.5} />
                </button>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-6 pb-32">
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

            {/* Navigation Bar */}
            <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto p-4 z-20">
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
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute -top-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full"
                                    />
                                )}
                            </button>
                        );
                    })}
                </div>
            </nav>
        </div>
    );
};
