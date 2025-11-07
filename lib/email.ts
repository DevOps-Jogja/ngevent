import { supabase } from './supabase';

interface SendWelcomeEmailParams {
    userId: string;
    email: string;
    name?: string;
}

interface SendRegistrationEmailParams {
    userId: string;
    email: string;
    userName?: string;
    eventId: string;
    eventTitle: string;
    eventDate: string;
    eventLocation?: string;
    organizerName?: string;
    registrationId: string;
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail({ userId, email, name }: SendWelcomeEmailParams) {
    try {
        const response = await fetch('/api/webhooks/email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: 'welcome_email',
                user_id: userId,
                email: email,
                name: name || email.split('@')[0],
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Email API returned error:', data);
            throw new Error(data.error || 'Failed to send welcome email');
        }

        // Check for warnings (e.g., database not initialized)
        if (data.warning) {
            console.warn('⚠️ Email system warning:', data.warning);
        }

        console.log('✅ Welcome email sent:', data);
        return { success: true, data };
    } catch (error: any) {
        console.error('❌ Failed to send welcome email:', error);
        return { success: false, error: error.message || 'Unknown error' };
    }
}

/**
 * Send registration confirmation email
 */
export async function sendRegistrationEmail(params: SendRegistrationEmailParams) {
    try {
        const response = await fetch('/api/webhooks/email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: 'registration_confirmation',
                user_id: params.userId,
                email: params.email,
                name: params.userName || params.email.split('@')[0],
                event_id: params.eventId,
                event_title: params.eventTitle,
                event_date: params.eventDate,
                event_location: params.eventLocation || 'TBA',
                organizer_name: params.organizerName || 'Event Organizer',
                registration_id: params.registrationId,
                registered_at: new Date().toISOString(),
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            console.error('❌ Email API returned error:', data);
            throw new Error(data.error || 'Failed to send registration email');
        }

        // Check for warnings (e.g., database not initialized)
        if (data.warning) {
            console.warn('⚠️ Email system warning:', data.warning);
        }

        console.log('✅ Registration email sent:', data);
        return { success: true, data };
    } catch (error: any) {
        console.error('❌ Failed to send registration email:', error);
        return { success: false, error: error.message || 'Unknown error' };
    }
}

/**
 * Get email logs for a user
 */
export async function getEmailLogs(userId: string) {
    try {
        const { data, error } = await supabase
            .from('email_logs')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Failed to get email logs:', error);
        return { success: false, error, data: [] };
    }
}

/**
 * Get email template
 */
export async function getEmailTemplate(templateType: 'welcome' | 'registration_confirmation' | 'event_reminder' | 'event_update') {
    try {
        const { data, error } = await supabase
            .from('email_templates')
            .select('*')
            .eq('template_type', templateType)
            .eq('active', true)
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Failed to get email template:', error);
        return { success: false, error, data: null };
    }
}

/**
 * Helper to format event date for email
 */
export function formatEventDateForEmail(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta'
    });
}
