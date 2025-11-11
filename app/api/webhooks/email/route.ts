import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { supabaseFetch } from '@/lib/supabase';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const resendApiKey = process.env.RESEND_API_KEY;

// Debug: Log all environment variable states at module load
console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level: 'info',
    message: 'Email webhook module initialization',
    environment: {
        supabase_url: supabaseUrl ? 'present' : 'missing',
        service_role_key: supabaseServiceKey ? 'present' : 'missing',
        resend_api_key: resendApiKey ? 'present' : 'missing',
        node_env: process.env.NODE_ENV || 'development'
    }
}));

// Validate required environment variables
if (!supabaseUrl) {
    console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'error',
        message: 'NEXT_PUBLIC_SUPABASE_URL is not set'
    }));
}
if (!supabaseServiceKey) {
    console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'warn',
        message: 'SUPABASE_SERVICE_ROLE_KEY is not set',
        impact: 'email system will not work',
        node_env: process.env.NODE_ENV
    }));

    if (process.env.NODE_ENV === 'production') {
        console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'error',
            message: 'CRITICAL: Email system disabled in production',
            action: 'Set SUPABASE_SERVICE_ROLE_KEY in environment variables'
        }));
    }
}
if (!resendApiKey) {
    console.log(JSON.stringify({
        timestamp: new Date().toISOString(),
        level: 'warn',
        message: 'RESEND_API_KEY is not set',
        impact: 'emails will not be sent',
        node_env: process.env.NODE_ENV
    }));

    if (process.env.NODE_ENV === 'production') {
        console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'error',
            message: 'CRITICAL: Emails disabled in production',
            action: 'Set RESEND_API_KEY in hosting platform environment variables',
            platforms: {
                vercel: 'Project Settings → Environment Variables',
                netlify: 'Site Settings → Environment Variables'
            }
        }));
    } else {
        console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'warn',
            message: 'RESEND_API_KEY not found in .env.local',
            action: 'Add RESEND_API_KEY to .env.local and restart server'
        }));
    }
} else {
    // Verify API key format (should start with 're_')
    if (!resendApiKey.startsWith('re_')) {
        console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'error',
            message: 'RESEND_API_KEY format invalid',
            expected: 'should start with "re_"',
            actual_prefix: resendApiKey.substring(0, 3)
        }));
    } else {
        console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'info',
            message: 'RESEND_API_KEY loaded and valid',
            key_preview: resendApiKey.substring(0, 8) + '...'
        }));
    }
}

// Create Supabase client with service role for admin operations
const supabaseAdmin = supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        },
        global: {
            headers: { 'x-client-info': 'ngevent-email-webhook' },
            fetch: supabaseFetch,
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
    const startTime = Date.now();

    try {
        // Runtime check: Re-read environment variable
        const runtimeResendKey = process.env.RESEND_API_KEY;

        // Use structured logging for Vercel
        console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'info',
            message: 'Email webhook invoked',
            runtime_check: {
                resend_key: runtimeResendKey ? 'present' : 'missing',
                node_env: process.env.NODE_ENV
            }
        }));

        const payload: EmailPayload = await request.json();

        console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'info',
            message: 'Email request received',
            email_type: payload.type,
            recipient: payload.email,
            user_id: payload.user_id
        }));

        // Validate payload
        if (!payload.type || !payload.email || !payload.user_id) {
            console.log(JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'error',
                message: 'Invalid payload',
                missing_fields: {
                    type: !payload.type,
                    email: !payload.email,
                    user_id: !payload.user_id
                }
            }));

            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Check if email system is configured
        if (!supabaseAdmin) {
            console.log(JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'warn',
                message: 'Email system not configured',
                reason: 'SUPABASE_SERVICE_ROLE_KEY missing'
            }));

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
        // Determine base URL - support multiple env var names and deployment platforms
        const baseUrl =
            process.env.NEXT_PUBLIC_APP_URL ||
            process.env.NEXT_PUBLIC_SITE_URL ||
            (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
            'http://localhost:3000';

        console.log('🌐 Using base URL for emails:', baseUrl);

        let htmlBody = template.html_body;
        let textBody = template.text_body || '';
        let subject = template.subject;        // Replace common variables
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
            console.log(JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'error',
                message: 'Failed to log email to database',
                error: logError.message || logError,
                email_type: payload.type,
                recipient: payload.email
            }));
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
            console.log(JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'warn',
                message: 'RESEND_API_KEY not configured',
                action: 'skipping email send',
                email_type: payload.type,
                recipient: payload.email
            }));

            return NextResponse.json({
                success: true,
                message: 'Email logged (Resend not configured)',
                email_type: payload.type,
                recipient: payload.email
            });
        }

        // Verify format before using
        if (!actualResendKey.startsWith('re_')) {
            console.log(JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'error',
                message: 'Invalid Resend API key format',
                key_prefix: actualResendKey.substring(0, 3),
                expected: 'Should start with re_'
            }));

            return NextResponse.json({
                success: false,
                message: 'Invalid Resend API key format',
                email_type: payload.type,
                recipient: payload.email
            }, { status: 500 });
        }

        try {
            console.log(JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'info',
                message: 'Sending email via Resend',
                recipient: payload.email,
                subject: subject,
                email_type: payload.type,
                key_length: actualResendKey.length
            }));
            console.log('🔑 Full key length:', actualResendKey.length, 'characters');

            const response = await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${actualResendKey}`
                },
                body: JSON.stringify({
                    from: 'NGEvent <ngevent@notifications.devopsjogja.com>', // Change to your domain after verification
                    to: payload.email,
                    subject: subject,
                    html: htmlBody,
                    text: textBody
                })
            });

            const resendData = await response.json();

            if (!response.ok) {
                console.log(JSON.stringify({
                    timestamp: new Date().toISOString(),
                    level: 'error',
                    message: 'Resend API error',
                    status: response.status,
                    error: resendData,
                    recipient: payload.email
                }));

                throw new Error(`Resend API error: ${JSON.stringify(resendData)}`);
            }

            emailSent = true;
            resendId = resendData.id;

            console.log(JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'info',
                message: 'Email sent successfully',
                resend_id: resendId,
                recipient: payload.email,
                email_type: payload.type,
                duration_ms: Date.now() - startTime
            }));

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
            console.log(JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'error',
                message: 'Failed to send email via Resend',
                error: emailError.message,
                stack: emailError.stack,
                recipient: payload.email,
                email_type: payload.type
            }));

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
        console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            level: 'error',
            message: 'Email webhook error',
            error: error.message,
            stack: error.stack,
            duration_ms: Date.now() - startTime
        }));

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
            console.log(JSON.stringify({
                timestamp: new Date().toISOString(),
                level: 'error',
                message: 'Failed to log error to database',
                error: String(logError)
            }));
        }

        return NextResponse.json(
            { error: 'Failed to send email', details: error.message },
            { status: 500 }
        );
    }
}
