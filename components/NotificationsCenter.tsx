'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import Link from 'next/link';

interface Notification {
    id: string;
    type: 'registration' | 'event_update' | 'reminder' | 'general' | 'payment';
    title: string;
    message: string;
    read: boolean;
    created_at: string;
    event_id?: string;
    event_title?: string;
}

export default function NotificationsCenter({ userId, preview = false }: { userId: string, preview?: boolean }) {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const loadNotifications = async () => {
        try {
            setLoading(true);

            // Fetch notifications dengan event title
            const { data, error } = await supabase
                .from('notifications')
                .select(`
                    *,
                    events (
                        title
                    )
                `)
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;

            const formattedNotifications: Notification[] = (data || []).map((n: any): Notification => ({
                id: n.id,
                type: n.type,
                title: n.title,
                message: n.message,
                read: n.read,
                created_at: n.created_at,
                event_id: n.event_id,
                event_title: n.events?.title
            }));

            setNotifications(formattedNotifications);
            setUnreadCount(formattedNotifications.filter((n: Notification) => !n.read).length);
        } catch (error) {
            console.error('Error loading notifications:', error);
        } finally {
            setLoading(false);
        }
    };

    const subscribeToNotifications = () => {
        const channel = supabase
            .channel('notifications-changes')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${userId}`
                },
                () => {
                    loadNotifications();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    };

    useEffect(() => {
        if (userId) {
            loadNotifications();
            const cleanup = subscribeToNotifications();
            return cleanup;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId]);

    const markAsRead = async (notificationId: string) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ read: true })
                .eq('id', notificationId);

            if (error) throw error;

            setNotifications(prev =>
                prev.map((n: Notification) =>
                    n.id === notificationId ? { ...n, read: true } : n
                )
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            const unreadIds = notifications
                .filter((n: Notification) => !n.read)
                .map((n: Notification) => n.id);

            if (unreadIds.length === 0) return;

            const { error } = await supabase
                .from('notifications')
                .update({ read: true })
                .in('id', unreadIds);

            if (error) throw error;

            setNotifications(prev => prev.map((n: Notification) => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    const getNotificationIcon = (type: Notification['type']) => {
        switch (type) {
            case 'registration':
                return (
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                        <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                    </div>
                );
            case 'reminder':
                return (
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                );
            case 'event_update':
                return (
                    <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-full">
                        <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                    </div>
                );
            case 'payment':
                return (
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                        <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                );
            default:
                return (
                    <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-full">
                        <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                );
        }
    };

    if (preview) {
        // Preview mode - show recent notifications list
        return (
            <div className="space-y-3">
                {loading ? (
                    <div className="space-y-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex gap-3 animate-pulse">
                                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="text-center py-6">
                        <svg className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                        <p className="text-sm text-gray-500 dark:text-gray-400">No recent notifications</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {notifications.slice(0, 5).map((notification) => {
                            const handleClick = () => {
                                if (!notification.read) {
                                    markAsRead(notification.id);
                                }
                            };

                            const content = (
                                <div className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer">
                                    {getNotificationIcon(notification.type)}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1">
                                                <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                                                    {notification.title}
                                                </h4>
                                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                                    {format(new Date(notification.created_at), 'dd MMM, HH:mm', { locale: id })}
                                                </p>
                                            </div>
                                            {!notification.read && (
                                                <span className="h-2 w-2 bg-primary-600 rounded-full flex-shrink-0 mt-1"></span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );

                            if (notification.event_id) {
                                return (
                                    <Link
                                        key={notification.id}
                                        href={`/events/${notification.event_id}`}
                                        onClick={handleClick}
                                    >
                                        {content}
                                    </Link>
                                );
                            }

                            return (
                                <div
                                    key={notification.id}
                                    onClick={handleClick}
                                >
                                    {content}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Notification Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Notifications Dropdown */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40 bg-black/5 dark:bg-black/20 backdrop-blur-[1px]"
                        onClick={() => setIsOpen(false)}
                    ></div>

                    {/* Dropdown Panel */}
                    <div className="fixed left-4 right-4 top-[70px] md:absolute md:left-auto md:right-0 md:top-full md:mt-2 md:w-96 bg-white dark:bg-dark-card rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 animate-fade-in overflow-hidden ring-1 ring-black/5">
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50">
                            <h3 className="font-bold text-gray-900 dark:text-white">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                                >
                                    Mark all as read
                                </button>
                            )}
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-[60vh] md:max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
                            {loading ? (
                                <div className="p-4 space-y-4">
                                    {[1, 2, 3].map((i) => (
                                        <div key={i} className="flex gap-3 animate-pulse">
                                            <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-full flex-shrink-0"></div>
                                            <div className="flex-1 space-y-2">
                                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                                                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="py-12 px-4 text-center">
                                    <div className="w-16 h-16 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                                        <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                        </svg>
                                    </div>
                                    <h4 className="text-gray-900 dark:text-white font-medium mb-1">No notifications</h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">You&apos;re all caught up!</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
                                    {notifications.map((notification) => {
                                        const handleClick = () => {
                                            if (!notification.read) {
                                                markAsRead(notification.id);
                                            }
                                            if (notification.event_id) {
                                                setIsOpen(false);
                                            }
                                        };

                                        const itemClassName = `block p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer relative ${!notification.read ? 'bg-primary-50/40 dark:bg-primary-900/10' : ''
                                            }`;

                                        const content = (
                                            <div className="flex gap-3">
                                                <div className="flex-shrink-0 mt-1">
                                                    {getNotificationIcon(notification.type)}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-start justify-between gap-2 mb-1">
                                                        <h4 className={`text-sm ${!notification.read ? 'font-semibold text-gray-900 dark:text-white' : 'font-medium text-gray-700 dark:text-gray-200'}`}>
                                                            {notification.title}
                                                        </h4>
                                                        <span className="text-[10px] text-gray-400 dark:text-gray-500 whitespace-nowrap ml-2">
                                                            {format(new Date(notification.created_at), 'MMM d, HH:mm', { locale: id })}
                                                        </span>
                                                    </div>
                                                    <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">
                                                        {notification.message}
                                                    </p>
                                                    {!notification.read && (
                                                        <span className="absolute top-4 right-4 w-2 h-2 bg-primary-500 rounded-full ring-2 ring-white dark:ring-dark-card"></span>
                                                    )}
                                                </div>
                                            </div>
                                        );

                                        if (notification.event_id) {
                                            return (
                                                <Link
                                                    key={notification.id}
                                                    href={`/events/${notification.event_id}`}
                                                    onClick={handleClick}
                                                    className={itemClassName}
                                                >
                                                    {content}
                                                </Link>
                                            );
                                        }

                                        return (
                                            <div
                                                key={notification.id}
                                                onClick={handleClick}
                                                className={itemClassName}
                                            >
                                                {content}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-3 border-t border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/50 text-center">
                            <Link
                                href="/dashboard/notifications"
                                onClick={() => setIsOpen(false)}
                                className="text-xs font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
                            >
                                View all notifications
                            </Link>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
