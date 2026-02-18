import React, { useRef, useState } from 'react';
import { uploadAPI } from '../api';

interface MultiImageUploadProps {
    images: string[];
    onImagesChange: (urls: string[]) => void;
    maxImages?: number;
}

export const MultiImageUpload: React.FC<MultiImageUploadProps> = ({ images, onImagesChange, maxImages = 4 }) => {
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        if (images.length + files.length > maxImages) {
            alert(`Você pode enviar no máximo ${maxImages} imagens.`);
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
            alert('Falha ao enviar algumas imagens.');
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
        <div className="space-y-3">
            {/* Image Grid */}
            {images.length > 0 && (
                <div className={`grid gap-2 ${images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {images.map((url, index) => (
                        <div key={index} className="relative group aspect-video bg-gray-100 rounded-xl overflow-hidden border dark:border-gray-700">
                            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${url})` }} />
                            <button
                                onClick={() => removeImage(index)}
                                className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* Upload Button */}
            {images.length < maxImages && (
                <div>
                    <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={loading}
                        className="flex items-center gap-2 text-primary font-bold text-sm hover:bg-primary/5 px-3 py-2 rounded-lg transition-colors"
                    >
                        {loading ? (
                            <span className="material-symbols-outlined animate-spin">progress_activity</span>
                        ) : (
                            <span className="material-symbols-outlined">add_photo_alternate</span>
                        )}
                        {images.length === 0 ? 'Adicionar Fotos' : 'Adicionar mais'}
                    </button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*"
                        multiple
                        className="hidden"
                    />
                </div>
            )}
        </div>
    );
};
