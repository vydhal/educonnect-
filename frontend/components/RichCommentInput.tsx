import React, { useState, useRef, useEffect } from 'react';
import { usersAPI } from '../api';

interface RichCommentInputProps {
    onSubmit: (content: string) => Promise<void>;
    userAvatar?: string;
    initialContent?: string;
    placeholder?: string;
    submitLabel?: string;
    onCancel?: () => void;
    autoFocus?: boolean;
}

export const RichCommentInput: React.FC<RichCommentInputProps> = ({
    onSubmit,
    userAvatar,
    initialContent = '',
    placeholder = 'Escreva um comentário...',
    submitLabel = 'Enviar',
    onCancel,
    autoFocus = false
}) => {
    const [content, setContent] = useState(initialContent);
    const [loading, setLoading] = useState(false);
    const [mentionQuery, setMentionQuery] = useState<string | null>(null);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [cursorPosition, setCursorPosition] = useState<number | null>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (autoFocus && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [autoFocus]);

    const handleSubmit = async () => {
        if (!content.trim() || loading) return;
        setLoading(true);
        try {
            await onSubmit(content);
            setContent('');
        } catch (error) {
            console.error('Failed to submit comment', error);
        } finally {
            setLoading(false);
        }
    };

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

        const mentionText = `@[${user.name}](${user.id})`;
        const newContent = textBeforeMention + mentionText + ' ' + textAfterMention;

        setContent(newContent);
        setMentionQuery(null);
        setSuggestions([]);
        textareaRef.current.focus();
    };

    // Auto-expand logic
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const scrollHeight = textareaRef.current.scrollHeight;
            textareaRef.current.style.height = `${Math.max(45, scrollHeight)}px`;
        }
    }, [content]);

    return (
        <div className="relative w-full">
            <div className="flex gap-3">
                <div 
                    className="size-10 rounded-xl bg-cover bg-center shrink-0 border border-gray-100 dark:border-gray-800"
                    style={{ backgroundImage: `url(${userAvatar || 'https://via.placeholder.com/40'})` }}
                />
                <div className="flex-1 relative group">
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-2xl transition-all focus-within:ring-2 focus-within:ring-primary/20 focus-within:bg-white dark:focus-within:bg-gray-900 border border-transparent focus-within:border-primary/30 overflow-hidden">
                        <textarea
                            ref={textareaRef}
                            value={content}
                            onChange={handleContentChange}
                            placeholder={placeholder}
                            disabled={loading}
                            rows={1}
                            className="w-full bg-transparent border-none focus:ring-0 resize-none py-3 px-4 text-sm dark:text-gray-100 placeholder-gray-400 outline-none min-h-[45px] max-h-[200px]"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey && suggestions.length === 0) {
                                    e.preventDefault();
                                    handleSubmit();
                                }
                                if (e.key === 'Escape' && onCancel) {
                                    onCancel();
                                }
                            }}
                        />
                        
                        <div className={`px-3 pb-2 flex justify-end gap-2 transition-all duration-200 ${content.trim() || initialContent ? 'opacity-100 h-auto' : 'opacity-0 h-0 overflow-hidden'}`}>
                            {onCancel && (
                                <button
                                    onClick={onCancel}
                                    className="px-3 py-1 text-xs font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                                >
                                    Cancelar
                                </button>
                            )}
                            <button
                                onClick={handleSubmit}
                                disabled={!content.trim() || loading}
                                className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
                                    content.trim() 
                                    ? 'bg-primary text-white shadow-md shadow-primary/20 active:scale-95' 
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                            >
                                {loading ? '...' : submitLabel}
                            </button>
                        </div>
                    </div>

                    {/* Suggestions Popover */}
                    {suggestions.length > 0 && (
                        <div className="absolute left-0 bottom-full mb-2 w-full max-w-[280px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden z-[110] animate-in fade-in slide-in-from-bottom-2 duration-200">
                            <div className="max-h-60 overflow-y-auto p-1">
                                {suggestions.map(user => (
                                    <button
                                        key={user.id}
                                        onClick={() => handleSuggestionClick(user)}
                                        className="w-full text-left px-3 py-2 hover:bg-primary/5 dark:hover:bg-primary/20 flex items-center gap-3 transition-all rounded-xl group"
                                    >
                                        <div
                                            className="size-8 rounded-lg bg-cover bg-center shrink-0 border border-gray-100 dark:border-gray-800"
                                            style={{ backgroundImage: `url(${user.avatar || `https://ui-avatars.com/api/?name=${user.name}`})` }}
                                        />
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold truncate text-gray-900 dark:text-gray-100 group-hover:text-primary">{user.name}</p>
                                            <p className="text-[9px] text-gray-500 truncate uppercase">{user.role}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
