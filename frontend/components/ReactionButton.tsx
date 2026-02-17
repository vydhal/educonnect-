
import React, { useState } from 'react';
import { useSettings } from '../contexts/SettingsContext';

interface ReactionButtonProps {
    postId: string;
    currentUserReaction: string | null;
    likesCount: number;
    onReact: (type: string) => void;
}

const REACTIONS = [
    { type: 'LIKE', icon: 'thumb_up', label: 'Curtir', color: 'text-blue-500' },
    { type: 'LOVE', icon: 'favorite', label: 'Amei', color: 'text-red-500' },
    { type: 'CLAP', icon: 'celebration', label: 'Parabéns', color: 'text-green-500' },
    { type: 'ROCKET', icon: 'rocket_launch', label: 'Inovador', color: 'text-purple-500' },
    { type: 'IDEA', icon: 'lightbulb', label: 'Genial', color: 'text-yellow-500' },
];

export const ReactionButton: React.FC<ReactionButtonProps> = ({ postId, currentUserReaction, likesCount, onReact }) => {
    const [showReactions, setShowReactions] = useState(false);
    const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

    const handleMouseEnter = () => {
        if (hoverTimeout) clearTimeout(hoverTimeout);
        setShowReactions(true);
    };

    const handleMouseLeave = () => {
        const timeout = setTimeout(() => setShowReactions(false), 500);
        setHoverTimeout(timeout);
    };

    const currentReaction = REACTIONS.find(r => r.type === currentUserReaction);

    return (
        <div
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Popover Reactions */}
            {showReactions && (
                <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 shadow-xl rounded-full p-2 flex gap-2 animate-in fade-in zoom-in duration-200 border dark:border-gray-700 z-10">
                    {REACTIONS.map((reaction) => (
                        <button
                            key={reaction.type}
                            onClick={() => {
                                onReact(reaction.type);
                                setShowReactions(false);
                            }}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-transform hover:scale-125 tooltip"
                            title={reaction.label}
                        >
                            <span className={`material-symbols-outlined text-2xl ${reaction.color} filled`}>
                                {reaction.icon}
                            </span>
                        </button>
                    ))}
                </div>
            )}

            {/* Main Button */}
            <button
                onClick={() => onReact(currentUserReaction ? currentUserReaction : 'LIKE')}
                className={`flex items-center gap-2 px-2 py-1 rounded-lg transition-colors ${currentUserReaction
                        ? currentReaction?.color
                        : 'text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
                    }`}
            >
                <span className={`material-symbols-outlined ${currentUserReaction ? 'filled' : ''}`}>
                    {currentReaction ? currentReaction.icon : 'thumb_up'}
                </span>
                <span className="font-medium">
                    {currentReaction ? currentReaction.label : 'Curtir'}
                    {likesCount > 0 && ` (${likesCount})`}
                </span>
            </button>
        </div>
    );
};
