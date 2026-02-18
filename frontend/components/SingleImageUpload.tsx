
import React, { useState, useRef } from 'react';
import { uploadAPI } from '../api';

interface SingleImageUploadProps {
    imageUrl: string;
    onImageChange: (url: string) => void;
    label?: string;
    description?: string;
}

export const SingleImageUpload: React.FC<SingleImageUploadProps> = ({ imageUrl, onImageChange, label, description }) => {
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setLoading(true);
        try {
            const result = await uploadAPI.uploadImage(file);
            onImageChange(result.url);
        } catch (error) {
            console.error('Upload failed', error);
            alert('Falha no upload da imagem.');
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-2">
            {label && <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">{label}</label>}

            <div className="flex items-start gap-4">
                <div
                    className="size-24 rounded-xl bg-gray-100 border dark:bg-gray-800 bg-contain bg-center bg-no-repeat shrink-0 shadow-sm"
                    style={{ backgroundImage: imageUrl ? `url(${imageUrl})` : 'none' }}
                >
                    {!imageUrl && !loading && (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <span className="material-symbols-outlined">image</span>
                        </div>
                    )}
                    {loading && (
                        <div className="w-full h-full flex items-center justify-center bg-black/10">
                            <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                        </div>
                    )}
                </div>

                <div className="flex-1 space-y-2">
                    <p className="text-sm text-gray-500">{description || "Faça upload de uma imagem (JPG, PNG). Recomendado: 512x512px para Logo."}</p>

                    <div className="flex gap-2">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="image/*"
                            className="hidden"
                        />
                        <button
                            type="button" // Prevent form submit
                            onClick={() => fileInputRef.current?.click()}
                            disabled={loading}
                            className="px-4 py-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                            Escolher Arquivo
                        </button>

                        {imageUrl && (
                            <button
                                type="button"
                                onClick={() => onImageChange('')}
                                className="px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Remover imagem"
                            >
                                <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
