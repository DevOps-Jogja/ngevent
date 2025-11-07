import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendApiKey = process.env.RESEND_API_KEY;

// Debug: Log all environment variable states at module load
console.log('📝 Environment Variables Check:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Not set');
console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ Set' : '❌ Not set');
console.log('RESEND_API_KEY:', resendApiKey ? `✅ Set (${resendApiKey.substring(0, 8)}...)` : '❌ Not set');

// Validate required environment variables
if (!supabaseUrl) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL is not set');
}
if (!supabaseServiceKey) {
    console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY is not set - email system will not work');
}
if (!resendApiKey) {
    console.warn('⚠️ RESEND_API_KEY is not set - emails will not be sent');
    console.warn('💡 Make sure RESEND_API_KEY is in .env.local and server is restarted');
} else {
    // Verify API key format (should start with 're_')
    if (!resendApiKey.startsWith('re_')) {
        console.error('❌ RESEND_API_KEY format invalid - should start with "re_"');
        console.error('Current value starts with:', resendApiKey.substring(0, 3));
    } else {
        console.log('✅ RESEND_API_KEY loaded and valid:', resendApiKey.substring(0, 8) + '...');
    }
}

// Create Supabase client with service role for admin operations
const supabaseAdmin = supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : null;

interface EmailPayload {
    type: 'welcome_email' | 'registration_confirmation';
    user_id: string;
    email: string;
    name?: string;
    event_id?: string;
    event_title?: string;
    event_date?: string;
    event_location?: string;
    organizer_name?: string;
    registration_id?: string;
    registered_at?: string;
}

export async function POST(request: NextRequest) {
    try {
        // Runtime check: Re-read environment variable
        const runtimeResendKey = process.env.RESEND_API_KEY;
        console.log('🔍 Runtime RESEND_API_KEY check:', runtimeResendKey ? `✅ ${runtimeResendKey.substring(0, 8)}...` : '❌ Not found');

        const payload: EmailPayload = await request.json();

        // Validate payload
        if (!payload.type || !payload.email || !payload.user_id) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Check if email system is configured
        if (!supabaseAdmin) {
            console.warn('⚠️ Email system not configured - SUPABASE_SERVICE_ROLE_KEY missing');
            return NextResponse.json(
                {
                    success: true,
                    message: 'Email system not configured (logging only)',
                    email_type: payload.type,
                    recipient: payload.email
                },
                { status: 200 }
            );
        }

        // Get email template
        const { data: template, error: templateError } = await supabaseAdmin!
            .from('email_templates')
            .select('*')
            .eq('template_type', payload.type === 'welcome_email' ? 'welcome' : 'registration_confirmation')
            .eq('active', true)
            .single();

        if (templateError || !template) {
            console.error('Template not found:', templateError);
            console.warn('⚠️ Database migration may not have been run. Please run: supabase/migrations/create_email_system.sql');

            // Return success but log the issue
            return NextResponse.json(
                {
                    success: true,
                    message: 'Email template not found (database not initialized)',
                    warning: 'Please run database migration',
                    email_type: payload.type,
                    recipient: payload.email
                },
                { status: 200 }
            );
        }

        // Replace template variables
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
        let htmlBody = template.html_body;
        let textBody = template.text_body || '';
        let subject = template.subject;

        // Replace common variables
        htmlBody = htmlBody.replace(/{{user_name}}/g, payload.name || 'User');
        htmlBody = htmlBody.replace(/{{base_url}}/g, baseUrl);
        textBody = textBody.replace(/{{user_name}}/g, payload.name || 'User');
        textBody = textBody.replace(/{{base_url}}/g, baseUrl);
        subject = subject.replace(/{{user_name}}/g, payload.name || 'User');

        // Replace event-specific variables
        if (payload.type === 'registration_confirmation') {
            htmlBody = htmlBody.replace(/{{event_title}}/g, payload.event_title || 'Event');
            htmlBody = htmlBody.replace(/{{event_date}}/g, payload.event_date || 'TBA');
            htmlBody = htmlBody.replace(/{{event_location}}/g, payload.event_location || 'TBA');
            htmlBody = htmlBody.replace(/{{organizer_name}}/g, payload.organizer_name || 'Event Organizer');
            htmlBody = htmlBody.replace(/{{event_id}}/g, payload.event_id || '');

            textBody = textBody.replace(/{{event_title}}/g, payload.event_title || 'Event');
            textBody = textBody.replace(/{{event_date}}/g, payload.event_date || 'TBA');
            textBody = textBody.replace(/{{event_location}}/g, payload.event_location || 'TBA');
            textBody = textBody.replace(/{{organizer_name}}/g, payload.organizer_name || 'Event Organizer');
            textBody = textBody.replace(/{{event_id}}/g, payload.event_id || '');

            subject = subject.replace(/{{event_title}}/g, payload.event_title || 'Event');
        }

        // Send email using Supabase Auth (will use configured SMTP)
        // Note: This requires SMTP to be configured in Supabase dashboard
        // For now, we'll log the email and use Supabase's built-in auth emails

        // Log email attempt
        const { error: logError } = await supabaseAdmin!
            .from('email_logs')
            .insert({
                user_id: payload.user_id,
                email_type: payload.type,
                recipient_email: payload.email,
                subject: subject,
                status: 'sent',
                metadata: {
                    template_type: template.template_type,
                    event_id: payload.event_id,
                    registration_id: payload.registration_id
                },
                sent_at: new Date().toISOString()
            });

        if (logError) {
            console.error('Failed to log email:', logError);
        }

        // Send email using Resend
        console.log('📧 Sending email to:', payload.email);
        console.log('Subject:', subject);
        console.log('Type:', payload.type);

        let emailSent = false;
        let resendId = null;

        // Use runtime check for API key
        const actualResendKey = runtimeResendKey || resendApiKey;

        // Check if Resend API key is available
        if (!actualResendKey) {
            console.warn('⚠️ RESEND_API_KEY not set - skipping email send');
            console.warn('💡 Add RESEND_API_KEY to .env.local and restart server');
            return NextResponse.json({
                success: true,
                message: 'Email logged (Resend not configured)',
                email_type: payload.type,
                recipient: payload.email
            });
        }

        // Verify format before using
        if (!actualResendKey.startsWith('re_')) {
            console.error('❌ RESEND_API_KEY format invalid!');
            console.error('Current value:', actualResendKey.substring(0, 10) + '...');
            console.error('Expected: Should start with "re_"');

            return NextResponse.json({
                success: false,
                message: 'Invalid Resend API key format',
                email_type: payload.type,
                recipient: payload.email
            }, { status: 500 });
        }

        try {
            console.log('🔑 Using Resend API key:', actualResendKey.substring(0, 8) + '...');
            console.log('🔑 Full key length:', actualResendKey.length, 'characters');

            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${actualResendKey}`
                },
                body: JSON.stringify({
                    from: 'NGEvent <onboarding@resend.dev>', // Change to your domain after verification
                    to: payload.email,
                    subject: subject,
                    html: htmlBody,
                    text: textBody
                })
            });

            const resendData = await response.json();

            if (!response.ok) {
                console.error('❌ Resend API error:', resendData);
                throw new Error(`Resend API error: ${JSON.stringify(resendData)}`);
            }

            emailSent = true;
            resendId = resendData.id;
            console.log('✅ Email sent successfully via Resend:', resendId);

            // Update email log with Resend ID
            await supabaseAdmin!
                .from('email_logs')
                .update({
                    metadata: {
                        template_type: template.template_type,
                        event_id: payload.event_id,
                        registration_id: payload.registration_id,
                        resend_id: resendId
                    }
                })
                .eq('recipient_email', payload.email)
                .order('created_at', { ascending: false })
                .limit(1);

        } catch (emailError: any) {
            console.error('❌ Failed to send email via Resend:', emailError.message);

            // Update log status to failed
            await supabaseAdmin!
                .from('email_logs')
                .update({
                    status: 'failed',
                    error_message: emailError.message
                })
                .eq('recipient_email', payload.email)
                .order('created_at', { ascending: false })
                .limit(1);
        }

        return NextResponse.json({
            success: true,
            message: emailSent ? 'Email sent successfully' : 'Email logged (sending failed)',
            email_type: payload.type,
            recipient: payload.email,
            resend_id: resendId
        });

    } catch (error: any) {
        console.error('Email webhook error:', error);

        // Log failed email
        try {
            if (supabaseAdmin) {
                const payload: EmailPayload = await request.json();
                await supabaseAdmin
                    .from('email_logs')
                    .insert({
                        user_id: payload.user_id,
                        email_type: payload.type,
                        recipient_email: payload.email,
                        subject: 'Email Failed',
                        status: 'failed',
                        error_message: error.message,
                        metadata: { error: error.toString() }
                    });
            }
        } catch (logError) {
            console.error('Failed to log error:', logError);
        }

        return NextResponse.json(
            { error: 'Failed to send email', details: error.message },
            { status: 500 }
        );
    }
}
