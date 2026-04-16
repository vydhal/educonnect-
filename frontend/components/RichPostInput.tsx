import React, { useState, useRef, useEffect } from 'react';
import { usersAPI, postsAPI } from '../api';
import { MultiImageUpload } from './MultiImageUpload';
import { IMAGES } from '../constants';

interface RichPostInputProps {
    onPostCreated: (post: any) => void;
    userAvatar?: string;
    initialContent?: string;
    initialImages?: string[];
    submitLabel?: string;
    postId?: string;
    hideSubmit?: boolean;
    inputRef?: React.MutableRefObject<{ submit: () => void } | null>;
}

export const RichPostInput: React.FC<RichPostInputProps> = ({
    onPostCreated,
    userAvatar,
    initialContent = '',
    initialImages = [],
    submitLabel = 'Publicar',
    postId,
    hideSubmit = false,
    inputRef
}) => {
    const [content, setContent] = useState(initialContent);
    const [images, setImages] = useState<string[]>(initialImages);
    const [loading, setLoading] = useState(false);

    // Mentions state
    const [mentionQuery, setMentionQuery] = useState<string | null>(null);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [cursorPosition, setCursorPosition] = useState<number | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

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

    // Expose submit to parent if needed
    if (inputRef) {
        inputRef.current = { submit: handleSubmit };
    }

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

    const handleSuggestionClick = (user: any) => {
        if (cursorPosition === null || !textareaRef.current) return;

        const textBeforeMention = content.substring(0, cursorPosition);
        const textAfterMention = content.substring(textareaRef.current.selectionStart);

        // Structured mention: @[Name](id)
        const mentionText = `@[${user.name}](${user.id})`;
        const newContent = textBeforeMention + mentionText + ' ' + textAfterMention;

        setContent(newContent);
        setMentionQuery(null);
        setSuggestions([]);
        textareaRef.current.focus();
    };

    const imageUploadRef = useRef<{ triggerUpload: () => void } | null>(null);

    // Auto-expand textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = '120px'; // Reset to min-height
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = `${Math.max(120, scrollHeight)}px`;
        }
    }, [content]);

    return (
        <div className="relative z-30 flex flex-col w-full">
            <div className="bg-white dark:bg-gray-900 border-2 border-gray-100 dark:border-gray-800 rounded-[32px] p-4 md:p-6 transition-all focus-within:border-primary/30 focus-within:shadow-xl shadow-sm group">
                {/* Text Area */}
                <div className="relative">
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={handleContentChange}
                        className="w-full bg-transparent border-none focus:ring-0 resize-none dark:text-gray-100 placeholder-gray-400 text-base md:text-lg outline-none font-medium overflow-hidden transition-all duration-100 min-h-[120px]"
                        placeholder="Sobre o que você quer falar?"
                        rows={1}
                    />

                    {/* Suggestions Popover */}
                    {suggestions.length > 0 && (
                        <div className="absolute left-0 top-full mt-4 w-full max-w-[320px] bg-white dark:bg-gray-900 rounded-[32px] shadow-[0_25px_60px_rgba(0,0,0,0.2)] border border-gray-100 dark:border-gray-800 overflow-hidden z-[110] animate-in slide-in-from-top-4 duration-300 ring-8 ring-black/5">
                            <div className="max-h-72 overflow-y-auto custom-scrollbar p-2">
                                {suggestions.map(user => (
                                    <button
                                        key={user.id}
                                        onClick={() => handleSuggestionClick(user)}
                                        className="w-full text-left px-4 py-4 hover:bg-primary/5 dark:hover:bg-primary/20 flex items-center gap-4 transition-all rounded-2xl group active:scale-[0.98]"
                                    >
                                        <div
                                            className="size-11 rounded-full bg-cover bg-center shrink-0 border-2 border-white dark:border-gray-800 shadow-sm"
                                            style={{ backgroundImage: `url(${user.avatar || IMAGES.DEFAULT_AVATAR})` }}
                                        />
                                        <div className="min-w-0">
                                            <p className="text-sm font-black truncate text-gray-900 dark:text-gray-100 group-hover:text-primary transition-colors">{user.name}</p>
                                            <p className="text-[10px] text-gray-500 font-bold tracking-tight truncate uppercase dark:text-gray-400">{user.school || user.role}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Images Preview Area */}
                <div className="mt-2">
                    <MultiImageUpload
                        ref={imageUploadRef}
                        images={images}
                        onImagesChange={setImages}
                        hideButton={images.length > 0} 
                    />
                </div>

                {/* Action Bar (Footer) */}
                <div className="flex items-center justify-between mt-2 pt-4 border-t border-gray-50 dark:border-gray-800/50">
                    <div className="flex items-center gap-1 md:gap-3">
                        <button 
                            type="button"
                            onClick={() => imageUploadRef.current?.triggerUpload()}
                            className="size-10 md:size-12 rounded-full flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 hover:text-primary transition-all active:scale-90"
                            title="Adicionar fotos"
                        >
                            <span className="material-symbols-outlined text-2xl">add_photo_alternate</span>
                        </button>

                        <button 
                            type="button"
                            className="size-10 md:size-12 rounded-full flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-primary transition-all active:scale-90"
                            title="Mencionar pessoa"
                            onClick={() => {
                                if (textareaRef.current) {
                                    const pos = textareaRef.current.selectionStart;
                                    const newContent = content.slice(0, pos) + '@' + content.slice(pos);
                                    setContent(newContent);
                                    setMentionQuery('');
                                    textareaRef.current.focus();
                                }
                            }}
                        >
                            <span className="material-symbols-outlined text-2xl">alternate_email</span>
                        </button>

                        <button 
                            type="button"
                            className="size-10 md:size-12 rounded-full flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-400 transition-all active:scale-90"
                            title="Emojis (Brevemente)"
                        >
                            <span className="material-symbols-outlined text-2xl">sentiment_satisfied</span>
                        </button>
                    </div>

                    {!hideSubmit && (
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={(!content.trim() && images.length === 0) || loading}
                            className={`size-12 md:size-14 rounded-full flex items-center justify-center transition-all shadow-xl ${
                                (content.trim() || images.length > 0) 
                                ? 'bg-primary text-white shadow-primary/30 hover:scale-105 active:scale-95' 
                                : 'bg-gray-100 text-gray-300 shadow-none cursor-not-allowed'
                            }`}
                        >
                            {loading ? (
                                <span className="material-symbols-outlined animate-spin text-2xl">progress_activity</span>
                            ) : (
                                <span className="material-symbols-outlined text-2xl font-fill-1 -rotate-45 mb-1 ml-1">send</span>
                            )}
                        </button>
                    )}
                </div>
            </div>

            {/* Hint only visible when typing and no mentions open */}
            {content.length > 0 && suggestions.length === 0 && (
                <div className="mt-4 flex justify-center animate-in fade-in slide-in-from-top-2 duration-500">
                    <div className="bg-gray-50 dark:bg-gray-800/50 px-4 py-2 rounded-full border border-gray-100 dark:border-gray-800 flex items-center gap-2">
                       <span className="material-symbols-outlined text-sm text-primary">tips_and_updates</span>
                       <span className="text-[10px] font-black uppercase text-gray-400 tracking-wider">Use @ para mencionar alguém</span>
                    </div>
                </div>
            )}
        </div>
    );
};
