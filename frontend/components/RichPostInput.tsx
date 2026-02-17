import React, { useState } from 'react';
// import { MentionsInput, Mention } from 'react-mentions'; // Disabled due to React 19 conflict
import { usersAPI, postsAPI } from '../api';
import { ImageUpload } from './ImageUpload';

interface RichPostInputProps {
    onPostCreated: (post: any) => void;
    userAvatar?: string;
}

export const RichPostInput: React.FC<RichPostInputProps> = ({ onPostCreated, userAvatar }) => {
    const [content, setContent] = useState('');
    const [image, setImage] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!content.trim() && !image) return;
        setLoading(true);
        try {
            // Clean up content if needed (e.g. valid hashtag logic) but backend stores raw string
            const newPost = await postsAPI.createPost({ content, image });
            onPostCreated(newPost);
            setContent('');
            setImage('');
        } catch (error) {
            console.error('Failed to create post', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border dark:border-gray-800 p-4 mb-6">
            <div className="flex gap-4">
                <div
                    className="size-12 rounded-full bg-gray-200 dark:bg-gray-700 bg-cover bg-center flex-shrink-0"
                    style={{ backgroundImage: `url(${userAvatar || 'https://ui-avatars.com/api/?background=random'})` }}
                />

                <div className="flex-1">
                    <div className="border dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 focus-within:ring-2 focus-within:ring-primary transition-all overflow-hidden mb-3">
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full min-h-[100px] p-3 bg-transparent border-none focus:ring-0 resize-none dark:text-gray-100 placeholder-gray-400"
                            placeholder="No que você está pensando?"
                        />
                    </div>

                    {image && (
                        <div className="relative mb-4 group inline-block">
                            <img src={image} alt="Preview" className="max-h-60 rounded-xl border dark:border-gray-700" />
                            <button
                                onClick={() => setImage('')}
                                className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-red-500 transition-colors opacity-0 group-hover:opacity-100"
                            >
                                <span className="material-symbols-outlined text-sm">close</span>
                            </button>
                        </div>
                    )}

                    <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                            {/* Custom Image Upload Button */}
                            <div className="relative overflow-hidden">
                                <ImageUpload
                                    onImageUploaded={setImage}
                                    currentImage={image}
                                    className="!flex-row !gap-0" // Override default styles
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={!content.trim() && !image || loading}
                            className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-full font-bold shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
                            Publicar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
