import React from 'react';
import {
    X,
    MessageCircle,
    Send,
    Facebook,
    Mail,
    MessageSquare,
    Copy,
    Smartphone,
    Share2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ShareOption {
    id: string;
    name: string;
    icon: any;
    color: string;
    action: () => void;
}

interface ShareMenuProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    text: string;
    url: string;
    onCopySuccess: () => void;
}

export const ShareMenu: React.FC<ShareMenuProps> = ({ isOpen, onClose, title, text, url, onCopySuccess }) => {

    const shareData = {
        title: title,
        text: text,
        url: url,
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share(shareData);
                onClose();
            } catch (err) {
                console.log('Error sharing:', err);
            }
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(`${text} ${url}`);
        onCopySuccess();
        onClose();
    };

    const options: ShareOption[] = [
        {
            id: 'whatsapp',
            name: 'WhatsApp',
            icon: MessageCircle,
            color: 'bg-[#25D366]',
            action: () => window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text + ' ' + url)}`, '_blank')
        },
        {
            id: 'facebook',
            name: 'Facebook',
            icon: Facebook,
            color: 'bg-[#1877F2]',
            action: () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank')
        },
        {
            id: 'messenger',
            name: 'Messenger',
            icon: MessageSquare,
            color: 'bg-[#0084FF]',
            action: () => window.open(`fb-messenger://share/?link=${encodeURIComponent(url)}`, '_blank')
        },
        {
            id: 'telegram',
            name: 'Telegram',
            icon: Send,
            color: 'bg-[#0088cc]',
            action: () => window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank')
        },
        {
            id: 'sms',
            name: 'SMS',
            icon: Smartphone,
            color: 'bg-slate-700',
            action: () => window.open(`sms:?body=${encodeURIComponent(text + ' ' + url)}`, '_blank')
        },
        {
            id: 'email',
            name: 'Correo',
            icon: Mail,
            color: 'bg-red-500',
            action: () => window.open(`mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(text + ' ' + url)}`, '_blank')
        },
        {
            id: 'copy',
            name: 'Copiar',
            icon: Copy,
            color: 'bg-slate-400',
            action: copyToClipboard
        }
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[150] flex items-end md:items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ y: "100%" }}
                        animate={{ y: 0 }}
                        exit={{ y: "100%" }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="bg-white w-full max-w-md rounded-t-[3rem] md:rounded-[3rem] p-8 pb-10 shadow-3xl z-10 relative"
                    >
                        <div className="w-12 h-1.5 bg-slate-100 rounded-full mx-auto mb-6 md:hidden" />

                        <div className="flex justify-between items-start mb-8">
                            <div>
                                <p className="text-[10px] font-black text-primary-500 uppercase tracking-[0.2em] mb-1">Compartir contenido</p>
                                <h3 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">{title}</h3>
                            </div>
                            <button onClick={onClose} className="p-3 bg-slate-50 text-slate-400 rounded-2xl active:scale-90 transition-all">
                                <X size={20} strokeWidth={3} />
                            </button>
                        </div>

                        {/* Native Share Shortcut (Only Mobile) */}
                        {typeof navigator.share !== 'undefined' && (
                            <button
                                onClick={handleNativeShare}
                                className="w-full mb-6 flex items-center justify-center gap-3 py-4 bg-primary-500 text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg shadow-primary-500/20 active:scale-95 transition-all"
                            >
                                <Share2 size={20} strokeWidth={3} />
                                Compartir con el Sistema
                            </button>
                        )}

                        <div className="grid grid-cols-4 gap-4">
                            {options.map((option) => {
                                const Icon = option.icon;
                                return (
                                    <button
                                        key={option.id}
                                        onClick={option.action}
                                        className="flex flex-col items-center gap-2 group"
                                    >
                                        <div className={`${option.color} w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform group-active:scale-90 group-hover:scale-110`}>
                                            <Icon size={24} strokeWidth={2.5} />
                                        </div>
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">{option.name}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
