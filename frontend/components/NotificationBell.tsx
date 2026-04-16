import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: string;
  type: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  relatedId?: string;
  sender?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

interface NotificationBellProps {
  notificationsAPI: {
    getNotifications: () => Promise<Notification[]>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
  };
  socialAPI?: {
    updateFriendRequest: (id: string, status: 'ACCEPTED' | 'REJECTED') => Promise<any>;
  };
}

const timeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  let interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + 'h';
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + 'm';
  return 'Agora';
};

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'POST_LIKE': return { icon: 'favorite', color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/20' };
    case 'POST_COMMENT': return { icon: 'chat', color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/20' };
    case 'FOLLOW': return { icon: 'person_add', color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/20' };
    case 'FRIEND_REQUEST': return { icon: 'group_add', color: 'text-violet-500', bg: 'bg-violet-50 dark:bg-violet-900/20' };
    case 'BADGE': return { icon: 'workspace_premium', color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' };
    case 'TESTIMONIAL': return { icon: 'rate_review', color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' };
    case 'MENTION': return { icon: 'alternate_email', color: 'text-primary', bg: 'bg-primary/10' };
    default: return { icon: 'notifications', color: 'text-gray-500', bg: 'bg-gray-100' };
  }
};

export const NotificationBell: React.FC<NotificationBellProps> = ({ notificationsAPI, socialAPI }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    fetchNotifications();
    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await notificationsAPI.getNotifications();
      setNotifications(data);
    } catch (err) {
      // Silently fail
    }
  };

  const handleOpen = async () => {
    setIsOpen(prev => !prev);
    if (!isOpen && unreadCount > 0) {
      // Load fresh data when opening
      fetchNotifications();
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch {/* ok */}
  };

  const handleNotificationClick = async (notification: Notification) => {
    // If it's a friend request and we click the item (not the buttons), just navigate to profile
    if (notification.type === 'FRIEND_REQUEST') {
        if (notification.sender?.id) navigate(`/profile/${notification.sender.id}`);
        setIsOpen(false);
        return;
    }

    if (!notification.isRead) {
      try {
        await notificationsAPI.markAsRead(notification.id);
        setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n));
      } catch {/* ok */}
    }

    // Navigate based on type
    if (notification.type === 'POST_LIKE' || notification.type === 'POST_COMMENT' || notification.type === 'MENTION') {
      if (notification.relatedId) navigate(`/post/${notification.relatedId}`);
    } else if (notification.type === 'FOLLOW') {
      if (notification.sender?.id) navigate(`/profile/${notification.sender.id}`);
    } else if (notification.type === 'BADGE' || notification.type === 'TESTIMONIAL') {
      navigate('/profile/' + (notification.sender?.id || ''));
    }

    setIsOpen(false);
  };

  const handleFriendAction = async (e: React.MouseEvent, notification: Notification, status: 'ACCEPTED' | 'REJECTED') => {
    e.stopPropagation();
    if (!socialAPI || !notification.relatedId || processingId) return;

    try {
      setProcessingId(notification.id);
      await socialAPI.updateFriendRequest(notification.relatedId, status);
      
      // Mark as read and updated local state
      await notificationsAPI.markAsRead(notification.id);
      setNotifications(prev => prev.map(n => n.id === notification.id ? { ...n, isRead: true, content: status === 'ACCEPTED' ? 'Agora vocês são amigos!' : 'Solicitação removida.' } : n));
    } catch (err) {
      console.error('Failed to update friend request', err);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell Button */}
      <button
        onClick={handleOpen}
        className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 hover:text-primary transition-colors"
        title="Notificações"
      >
        <span className="material-symbols-outlined text-[22px]">
          {unreadCount > 0 ? 'notifications_active' : 'notifications'}
        </span>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 size-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 top-12 w-80 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800 z-[200] overflow-hidden animate-in slide-in-from-top-4 duration-200">
          {/* Header */}
          <div className="px-4 py-3 border-b dark:border-gray-800 flex items-center justify-between bg-gray-50/80 dark:bg-gray-800/50">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-sm">notifications</span>
              <h3 className="text-sm font-black dark:text-white">Notificações</h3>
              {unreadCount > 0 && (
                <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-full">
                  {unreadCount} novas
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[10px] font-black text-primary hover:text-primary/70 transition-colors"
              >
                Marcar todas
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-10 px-4 text-center">
                <span className="material-symbols-outlined text-4xl text-gray-300">notifications_off</span>
                <p className="text-xs text-gray-400 font-medium">Nenhuma notificação ainda.</p>
                <p className="text-[10px] text-gray-300">Interaja com a comunidade e fique por dentro!</p>
              </div>
            ) : (
              notifications.map(notification => {
                const { icon, color, bg } = getNotificationIcon(notification.type);
                const isFriendRequest = notification.type === 'FRIEND_REQUEST' && !notification.isRead;

                return (
                  <div
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`flex flex-col px-4 py-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors border-b border-gray-50 dark:border-gray-800 ${!notification.isRead ? 'bg-primary/3' : ''}`}
                  >
                    <div className="flex gap-3">
                      {/* Avatar or Icon */}
                      <div className="relative shrink-0">
                        {notification.sender?.avatar ? (
                          <div
                            className="size-10 rounded-full bg-cover bg-center border border-gray-100 dark:border-gray-700"
                            style={{ backgroundImage: `url(${notification.sender.avatar || `https://ui-avatars.com/api/?name=${notification.sender.name}&background=random`})` }}
                          />
                        ) : (
                          <div className={`size-10 rounded-full ${bg} flex items-center justify-center`}>
                            <span className={`material-symbols-outlined text-base ${color}`}>{icon}</span>
                          </div>
                        )}
                        {/* Type badge */}
                        <div className={`absolute -bottom-1 -right-1 size-5 ${bg} border-2 border-white dark:border-gray-900 rounded-full flex items-center justify-center`}>
                          <span className={`material-symbols-outlined text-[10px] ${color}`}>{icon}</span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs dark:text-gray-200 leading-snug">
                          {notification.sender && (
                            <span className="font-black">{notification.sender.name} </span>
                          )}
                          <span className="text-gray-600 dark:text-gray-400">{notification.content}</span>
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1 font-medium">{timeAgo(notification.createdAt)}</p>
                      </div>

                      {/* Unread indicator */}
                      {!notification.isRead && !isFriendRequest && (
                        <div className="size-2 bg-primary rounded-full shrink-0 mt-1" />
                      )}
                    </div>

                    {/* Friend Request Actions Inline */}
                    {isFriendRequest && (
                      <div className="flex gap-2 mt-3 pl-13">
                        <button
                          disabled={!!processingId}
                          onClick={(e) => handleFriendAction(e, notification, 'ACCEPTED')}
                          className="px-3 py-1.5 bg-primary text-white text-[10px] font-black rounded-lg hover:brightness-110 active:scale-95 disabled:opacity-50"
                        >
                          {processingId === notification.id ? '...' : 'Aceitar'}
                        </button>
                        <button
                          disabled={!!processingId}
                          onClick={(e) => handleFriendAction(e, notification, 'REJECTED')}
                          className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-500 text-[10px] font-black rounded-lg hover:bg-gray-200 active:scale-95 disabled:opacity-50"
                        >
                          Recusar
                        </button>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
