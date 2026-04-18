import React, { useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { uploadAPI, getMediaUrl } from '../api';
import { useModal } from '../contexts/ModalContext';

interface MultiImageUploadProps {
    images: string[];
    onImagesChange: (urls: string[]) => void;
    maxImages?: number;
    hideButton?: boolean;
}

export const MultiImageUpload = forwardRef<{ triggerUpload: () => void }, MultiImageUploadProps>(
    ({ images, onImagesChange, maxImages = 4, hideButton = false }, ref) => {
        const [loading, setLoading] = useState(false);
        const fileInputRef = useRef<HTMLInputElement>(null);
        const { showModal } = useModal();

        useImperativeHandle(ref, () => ({
            triggerUpload: () => {
                fileInputRef.current?.click();
            }
        }));

        const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
            const files = Array.from(e.target.files || []);
            if (files.length === 0) return;

            if (images.length + files.length > maxImages) {
                showModal({ title: 'Limite de Imagens', message: `Você pode enviar no máximo ${maxImages} imagens por publicação.`, type: 'info' });
                return;
            }

            setLoading(true);
            try {
                const uploadPromises = files.map(file => uploadAPI.uploadImage(file));
                const responses = await Promise.all(uploadPromises);
                const newUrls = responses.map(r => r.url);
                onImagesChange([...images, ...newUrls]);
            } catch (error) {
                console.error('Upload failed', error);
                showModal({ title: 'Erro de Upload', message: 'Houve uma falha ao enviar uma ou mais imagens. Por favor, tente novamente.', type: 'error' });
            } finally {
                setLoading(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };

        const removeImage = (index: number) => {
            const newImages = [...images];
            newImages.splice(index, 1);
            onImagesChange(newImages);
        };

        return (
            <div className="space-y-3 w-full">
                {/* Image Grid - Smaller thumbnails, aligned left */}
                {images.length > 0 && (
                    <div className="max-h-[30vh] overflow-y-auto custom-scrollbar pr-2">
                        <div className="flex flex-wrap gap-3 items-start justify-start">
                            {images.map((url, index) => (
                                <div key={index} className="relative group size-20 bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden border dark:border-gray-700 shadow-sm shrink-0">
                                    <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${getMediaUrl(url)})` }} />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all" />
                                    <button
                                        onClick={() => removeImage(index)}
                                        className="absolute top-1 right-1 bg-black/60 text-white size-6 rounded-full flex items-center justify-center hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100 backdrop-blur-md"
                                    >
                                        <span className="material-symbols-outlined text-[10px]">close</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Hidden File Input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    multiple
                    className="hidden"
                />

                {/* Standard Button (Optional) */}
                {!hideButton && images.length < maxImages && (
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={loading}
                        className="flex items-center gap-2 text-primary font-bold text-xs hover:bg-primary/5 px-4 py-2 rounded-xl transition-colors"
                    >
                        {loading ? (
                            <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>
                        ) : (
                            <span className="material-symbols-outlined text-xl">add_photo_alternate</span>
                        )}
                        {images.length === 0 ? 'Adicionar Fotos' : 'Adicionar mais'}
                    </button>
                )}
            </div>
        );
    }
);
