import { supabase } from './supabase';

export type NotificationType = 'registration' | 'event_update' | 'reminder' | 'general' | 'payment';

interface CreateNotificationParams {
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    eventId?: string;
}

/**
 * Manually create a notification for a user
 * Useful for custom notifications that don't fit the auto-trigger patterns
 */
export async function createNotification({
    userId,
    type,
    title,
    message,
    eventId
}: CreateNotificationParams) {
    try {
        const { data, error } = await supabase
            .from('notifications')
            .insert({
                user_id: userId,
                type,
                title,
                message,
                event_id: eventId,
                read: false
            })
            .select()
            .single();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error creating notification:', error);
        return { data: null, error };
    }
}

/**
 * Create notifications for multiple users at once
 * Useful for broadcasting announcements
 */
export async function createBulkNotifications({
    userIds,
    type,
    title,
    message,
    eventId
}: {
    userIds: string[];
    type: NotificationType;
    title: string;
    message: string;
    eventId?: string;
}) {
    try {
        const notifications = userIds.map(userId => ({
            user_id: userId,
            type,
            title,
            message,
            event_id: eventId,
            read: false
        }));

        const { data, error } = await supabase
            .from('notifications')
            .insert(notifications)
            .select();

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Error creating bulk notifications:', error);
        return { data: null, error };
    }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userId: string) {
    try {
        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('read', false);

        if (error) throw error;
        return { count: count || 0, error: null };
    } catch (error) {
        console.error('Error getting unread count:', error);
        return { count: 0, error };
    }
}

/**
 * Mark notification as read
 */
export async function markAsRead(notificationId: string) {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('id', notificationId);

        if (error) throw error;
        return { error: null };
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return { error };
    }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string) {
    try {
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', userId)
            .eq('read', false);

        if (error) throw error;
        return { error: null };
    } catch (error) {
        console.error('Error marking all as read:', error);
        return { error };
    }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string) {
    try {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', notificationId);

        if (error) throw error;
        return { error: null };
    } catch (error) {
        console.error('Error deleting notification:', error);
        return { error };
    }
}

/**
 * Delete all read notifications for a user
 */
export async function deleteReadNotifications(userId: string) {
    try {
        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('user_id', userId)
            .eq('read', true);

        if (error) throw error;
        return { error: null };
    } catch (error) {
        console.error('Error deleting read notifications:', error);
        return { error };
    }
}

/**
 * Send payment notification to user
 */
export async function sendPaymentNotification(
    userId: string,
    eventId: string,
    eventTitle: string,
    status: 'pending' | 'verified' | 'rejected'
) {
    const messages = {
        pending: `Your payment for "${eventTitle}" is being verified`,
        verified: `Your payment for "${eventTitle}" has been verified. You're all set!`,
        rejected: `Your payment for "${eventTitle}" was rejected. Please upload a valid proof of payment.`
    };

    return createNotification({
        userId,
        type: 'payment',
        title: `Payment ${status.charAt(0).toUpperCase() + status.slice(1)}`,
        message: messages[status],
        eventId
    });
}

/**
 * Send event reminder to all participants
 */
export async function sendEventReminder(eventId: string, eventTitle: string) {
    try {
        // Get all participants for the event
        const { data: registrations, error } = await supabase
            .from('registrations')
            .select('user_id')
            .eq('event_id', eventId);

        if (error) throw error;
        if (!registrations || registrations.length === 0) {
            return { data: null, error: null };
        }

        const userIds = registrations.map(r => r.user_id);

        return createBulkNotifications({
            userIds,
            type: 'reminder',
            title: 'Event Starting Soon',
            message: `"${eventTitle}" will start soon. Don't forget to join!`,
            eventId
        });
    } catch (error) {
        console.error('Error sending event reminder:', error);
        return { data: null, error };
    }
}
