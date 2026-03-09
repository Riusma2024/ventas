import React, { useState, useRef } from 'react';
import ReactCrop, { centerCrop, makeAspectCrop, Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { X, Check, Crop as CropIcon } from 'lucide-react';
import { getCroppedImg } from '../utils/imageUtils';

interface CropModalProps {
    image: string;
    onClose: () => void;
    onDone: (croppedImage: string) => void;
}

// Helper function to center the initial crop
function centerAspectCrop(
    mediaWidth: number,
    mediaHeight: number,
    aspect: number,
) {
    return centerCrop(
        makeAspectCrop(
            {
                unit: '%',
                width: 90,
            },
            aspect,
            mediaWidth,
            mediaHeight,
        ),
        mediaWidth,
        mediaHeight,
    )
}

export const CropModal: React.FC<CropModalProps> = ({ image, onClose, onDone }) => {
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
    const imgRef = useRef<HTMLImageElement>(null);

    function onImageLoad(e: React.SyntheticEvent<HTMLImageElement>) {
        const { width, height } = e.currentTarget;
        setCrop(centerAspectCrop(width, height, 1));
    }

    const handleDone = async () => {
        if (completedCrop && imgRef.current) {
            const img = imgRef.current;

            // Calcular el factor de escala entre la imagen mostrada y su tamaño natural
            const scaleX = img.naturalWidth / img.width;
            const scaleY = img.naturalHeight / img.height;

            // Escalar las coordenadas del recorte al tamaño real de la imagen
            const naturalCrop = {
                x: completedCrop.x * scaleX,
                y: completedCrop.y * scaleY,
                width: completedCrop.width * scaleX,
                height: completedCrop.height * scaleY
            };

            const cropped = await getCroppedImg(image, naturalCrop);
            onDone(cropped);
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[300] flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-2xl bg-white rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                <div className="p-6 flex justify-between items-center border-b border-slate-100 flex-shrink-0">
                    <div className="flex items-center gap-3 text-slate-900">
                        <div className="p-2 bg-slate-100 rounded-xl">
                            <CropIcon size={20} className="text-primary-500" />
                        </div>
                        <h3 className="text-xl font-black tracking-tighter">Recortar Imagen</h3>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                        <X size={24} strokeWidth={3} />
                    </button>
                </div>

                <div className="relative flex-1 bg-slate-100 overflow-auto flex items-center justify-center p-6 min-h-0">
                    <ReactCrop
                        crop={crop}
                        onChange={(_, percentCrop) => setCrop(percentCrop)}
                        onComplete={(c) => setCompletedCrop(c)}
                        aspect={1}
                        className="max-w-full max-h-full"
                    >
                        <img
                            ref={imgRef}
                            alt="Crop me"
                            src={image}
                            onLoad={onImageLoad}
                            style={{ maxWidth: '100%', maxHeight: '60vh' }}
                        />
                    </ReactCrop>
                </div>

                <div className="p-8 bg-white border-t border-slate-100 flex-shrink-0">
                    <div className="flex gap-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-6 py-4 rounded-2xl font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 transition-all active:scale-95"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
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
                Arrastra las esquinas para ajustar el área de recorte
            </p>
        </div>
    );
};
