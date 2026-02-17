
import React, { useState, useRef } from 'react';
import { uploadAPI } from '../api';

interface ImageUploadProps {
    currentImage?: string;
    onImageUploaded: (url: string) => void;
    className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({ currentImage, onImageUploaded, className = '' }) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate size (e.g., 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('A imagem deve ter no máximo 5MB');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await uploadAPI.uploadImage(file);
            onImageUploaded(response.url);
        } catch (err: any) {
            console.error('Upload failed', err);
            setError('Erro ao enviar imagem. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={`flex flex-col gap-2 ${className}`}>
            <div className="flex items-center gap-4">
                <div
                    className="size-16 rounded-full bg-cover bg-center border-2 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden"
                    style={{ backgroundImage: currentImage ? `url(${currentImage})` : 'none' }}
                >
                    {!currentImage && !loading && (
                        <span className="material-symbols-outlined text-gray-400">image</span>
                    )}
                    {loading && (
                        <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                    )}
                </div>

                <div className="flex flex-col gap-1">
                    <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={loading}
                        className="text-sm font-bold text-primary hover:underline flex items-center gap-1 disabled:opacity-50"
                    >
                        <span className="material-symbols-outlined text-lg">upload</span>
                        {currentImage ? 'Alterar foto' : 'Enviar foto'}
                    </button>
                    <p className="text-xs text-gray-400">JPG, PNG ou WEBP (Max 5MB)</p>
                </div>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
            />

            {error && <p className="text-xs text-red-500 font-medium">{error}</p>}
        </div>
    );
};
