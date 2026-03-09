import React, { useState } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check, Crop } from 'lucide-react';
import { getCroppedImg } from '../utils/imageUtils';

interface CropModalProps {
    image: string;
    onClose: () => void;
    onDone: (croppedImage: string) => void;
}

export const CropModal: React.FC<CropModalProps> = ({ image, onClose, onDone }) => {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

    const onCropComplete = (_croppedArea: any, croppedAreaPixels: any) => {
        setCroppedAreaPixels(croppedAreaPixels);
    };

    const handleDone = async () => {
        if (croppedAreaPixels) {
            const cropped = await getCroppedImg(image, croppedAreaPixels);
            onDone(cropped);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[300] flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-lg bg-white rounded-[3rem] overflow-hidden shadow-2xl flex flex-col h-[80vh]">
                <div className="p-6 flex justify-between items-center border-b border-slate-100">
                    <div className="flex items-center gap-3 text-slate-900">
                        <div className="p-2 bg-slate-100 rounded-xl">
                            <Crop size={20} className="text-primary-500" />
                        </div>
                        <h3 className="text-xl font-black tracking-tighter">Recortar Imagen</h3>
                    </div>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                        <X size={24} strokeWidth={3} />
                    </button>
                </div>

                <div className="relative flex-1 bg-slate-200">
                    <Cropper
                        image={image}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        onCropChange={setCrop}
                        onCropComplete={onCropComplete}
                        onZoomChange={setZoom}
                    />
                </div>

                <div className="p-8 space-y-6 bg-white">
                    <div className="space-y-4">
                        <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">
                            <span>Zoom</span>
                            <span>{zoom.toFixed(1)}x</span>
                        </div>
                        <input
                            type="range"
                            value={zoom}
                            min={1}
                            max={3}
                            step={0.1}
                            aria-labelledby="Zoom"
                            onChange={(e) => setZoom(Number(e.target.value))}
                            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-primary-500"
                        />
                    </div>

                    <div className="flex gap-4">
                        <button
                            onClick={onClose}
                            className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all active:scale-95"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleDone}
                            className="flex-1 px-6 py-4 rounded-2xl font-black text-white bg-primary-500 shadow-lg shadow-primary-500/30 flex items-center justify-center gap-2 hover:translate-y-[-2px] active:scale-95 transition-all"
                        >
                            <Check size={20} strokeWidth={4} />
                            Aplicar Recorte
                        </button>
                    </div>
                </div>
            </div>

            <p className="mt-6 text-white/50 text-xs font-medium bg-white/10 px-4 py-2 rounded-full backdrop-blur-md italic">
                Arrastra la imagen para centrarla y usa la barra de zoom para ajustar
            </p>
        </div>
    );
};
