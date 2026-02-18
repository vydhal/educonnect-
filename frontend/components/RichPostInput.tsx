import React, { useState, useRef, useEffect } from 'react';
import { usersAPI, postsAPI } from '../api';
import { MultiImageUpload } from './MultiImageUpload';

interface RichPostInputProps {
    onPostCreated: (post: any) => void;
    userAvatar?: string;
    initialContent?: string;
    initialImages?: string[];
    submitLabel?: string;
    postId?: string;
}

export const RichPostInput: React.FC<RichPostInputProps> = ({
    onPostCreated,
    userAvatar,
    initialContent = '',
    initialImages = [],
    submitLabel = 'Publicar',
    postId
}) => {
    const [content, setContent] = useState(initialContent);
    const [images, setImages] = useState<string[]>(initialImages);
    const [loading, setLoading] = useState(false);

    // Mentions state
    const [mentionQuery, setMentionQuery] = useState<string | null>(null);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [cursorPosition, setCursorPosition] = useState<number | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = e.target.value;
        const pos = e.target.selectionStart;
        setContent(text);

        const textBeforeCursor = text.slice(0, pos);
        const lastAt = textBeforeCursor.lastIndexOf('@');

        if (lastAt !== -1) {
            const query = textBeforeCursor.slice(lastAt + 1);
            if (!/\s/.test(query)) {
                setMentionQuery(query);
                setCursorPosition(lastAt);
                return;
            }
        }
        setMentionQuery(null);
        setSuggestions([]);
    };

    useEffect(() => {
        if (mentionQuery !== null) {
            const delayDebounceFn = setTimeout(async () => {
                try {
                    let results;
                    if (mentionQuery.trim() === '') {
                        // If query is empty, fetch general user list (or top users)
                        results = await usersAPI.getUsers();
                    } else {
                        results = await usersAPI.searchUsers(mentionQuery);
                    }
                    setSuggestions(results);
                } catch (error) {
                    console.error('Search failed', error);
                    setSuggestions([]);
                }
            }, 300);
            return () => clearTimeout(delayDebounceFn);
        } else {
            setSuggestions([]);
        }
    }, [mentionQuery]);

    const selectUser = (user: any) => {
        if (cursorPosition === null || !textareaRef.current) return;

        const beforeMention = content.slice(0, cursorPosition);
        const afterCursor = content.slice(textareaRef.current.selectionStart);

        const newContent = `${beforeMention}@${user.name} ${afterCursor}`;
        setContent(newContent);
        setMentionQuery(null);
        setSuggestions([]);
    };

    const handleSubmit = async () => {
        if (!content.trim() && images.length === 0) return;
        setLoading(true);
        try {
            let resultPost;
            if (postId) {
                resultPost = await postsAPI.updatePost(postId, { content, images });
            } else {
                resultPost = await postsAPI.createPost({ content, images });
                setContent('');
                setImages([]);
            }
            onPostCreated(resultPost);
        } catch (error) {
            console.error('Failed to submit post', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm border dark:border-gray-800 p-4 mb-6 relative z-30">
            <div className="flex gap-4">
                <div
                    className="size-12 rounded-full bg-gray-200 dark:bg-gray-700 bg-cover bg-center flex-shrink-0"
                    style={{ backgroundImage: `url(${userAvatar || 'https://ui-avatars.com/api/?background=random'})` }}
                />

                <div className="flex-1">
                    <div className="relative border dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-800 focus-within:ring-2 focus-within:ring-primary transition-all overflow-visible mb-3">
                        <textarea
                            ref={textareaRef}
                            value={content}
                            onChange={handleContentChange}
                            className="w-full min-h-[100px] p-3 bg-transparent border-none focus:ring-0 resize-none dark:text-gray-100 placeholder-gray-400"
                            placeholder="No que você está pensando? Use @ para mencionar."
                        />

                        {/* Suggestions Popover */}
                        {suggestions.length > 0 && (
                            <div className="absolute left-0 top-full mt-1 w-64 bg-white dark:bg-gray-800 rounded-xl shadow-xl border dark:border-gray-700 overflow-hidden z-50">
                                <div className="max-h-48 overflow-y-auto">
                                    {suggestions.map(user => (
                                        <button
                                            key={user.id}
                                            onClick={() => selectUser(user)}
                                            className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3 transition-colors border-b dark:border-gray-700/50 last:border-none"
                                        >
                                            <div
                                                className="size-8 rounded-full bg-cover bg-center shrink-0 border"
                                                style={{ backgroundImage: `url(${user.avatar || `https://ui-avatars.com/api/?name=${user.name}`})` }}
                                            />
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold truncate dark:text-gray-200">{user.name}</p>
                                                <p className="text-[10px] text-gray-500 truncate">{user.school || user.role}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="mb-4">
                        <MultiImageUpload
                            images={images}
                            onImagesChange={setImages}
                        />
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex gap-2">
                            <span className="text-xs text-gray-400 hidden md:block">Dica: Use @ para mencionar alguém.</span>
                        </div>

                        <button
                            onClick={handleSubmit}
                            disabled={(!content.trim() && images.length === 0) || loading}
                            className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-full font-bold shadow-lg shadow-primary/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {loading && <span className="material-symbols-outlined animate-spin text-sm">progress_activity</span>}
                            {submitLabel}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
