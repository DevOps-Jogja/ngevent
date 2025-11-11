import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// POST /api/auth/send-confirmation
// Creates a signup link using Supabase Admin API and sends a branded email via Resend
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const email: string | undefined = body?.email;
        const password: string | undefined = body?.password;
        const full_name: string | undefined = body?.full_name;

        if (!email || !password) {
            return NextResponse.json({ success: false, message: 'email and password are required' }, { status: 400 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const resendKey = process.env.RESEND_API_KEY;

        if (!supabaseUrl || !serviceKey) {
            return NextResponse.json({
                success: false,
                message: 'Server email signup is not configured. Missing SUPABASE envs.'
            }, { status: 500 });
        }

        if (!resendKey) {
            return NextResponse.json({
                success: false,
                message: 'RESEND_API_KEY is not set on server.'
            }, { status: 500 });
        }

        const baseUrl = process.env.NEXT_PUBLIC_SITE_URL
            || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined)
            || req.nextUrl.origin;

        const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
            auth: { autoRefreshToken: false, persistSession: false },
            global: { headers: { 'x-client-info': 'ngevent-send-confirmation' } }
        });

        // Generate signup link (does not send email)
        const { data, error } = await supabaseAdmin.auth.admin.generateLink({
            type: 'signup',
            email,
            password,
            options: { redirectTo: `${baseUrl}/auth/callback` },
            data: full_name ? { full_name } : undefined,
        } as any);

        if (error) {
            return NextResponse.json({ success: false, message: error.message }, { status: 400 });
        }

        // Try to ensure profile row exists ahead of time (idempotent)
        try {
            const userId = (data as any)?.user?.id;
            if (userId) {
                await supabaseAdmin.from('profiles').upsert({
                    id: userId,
                    full_name: full_name || null,
                    role: 'participant'
                }, { onConflict: 'id' } as any);
            }
        } catch (e) {
            // Not fatal
            console.warn('profiles upsert skipped:', (e as any)?.message || e);
        }

        // Build a branded verification URL that proxies verification via our domain
        let verifyUrl = `${baseUrl}/auth/callback`;
        let usedFallbackActionLink = false;
        const props: any = (data as any)?.properties || (data as any);
        const actionLink: string | undefined = props?.action_link || (data as any)?.action_link;
        if (actionLink) {
            // Avoid parsing params here; pass full action_link to /auth/verify for maximum compatibility
            verifyUrl = `${baseUrl}/auth/verify?link=${encodeURIComponent(actionLink)}`;
        }

        // Compose email
        const subject = 'Verifikasi akun Anda di NGEvent';
        const displayName = full_name || email.split('@')[0];
        const html = `
      <div style="font-family:Arial,Helvetica,sans-serif; line-height:1.6; color:#111827;">
        <h2 style="margin:0 0 16px;">Halo ${displayName},</h2>
        <p>Terima kasih telah mendaftar di NGEvent. Klik tombol di bawah ini untuk verifikasi akun Anda:</p>
        <p style="margin:24px 0;">
          <a href="${verifyUrl}"
             style="background:#2563eb;color:#fff;text-decoration:none;padding:12px 20px;border-radius:8px;display:inline-block">
            Verifikasi Akun
          </a>
        </p>
        <p>Atau salin tautan berikut ke browser Anda:</p>
        <p style="word-break:break-all;color:#2563eb">
          ${verifyUrl}
        </p>
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0"/>
        <p style="font-size:12px;color:#6b7280">Jika Anda tidak merasa mendaftar, abaikan email ini.</p>
      </div>
    `;

        const text = `Halo ${displayName},\n\n` +
            `Klik tautan berikut untuk verifikasi akun Anda: ${verifyUrl}\n\n` +
            `Jika Anda tidak merasa mendaftar, abaikan email ini.`;

        // Send via Resend
        const rsp = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${resendKey}`
            },
            body: JSON.stringify({
                from: 'NGEvent <ngevent@notifications.devopsjogja.com>',
                to: email,
                subject,
                html,
                text
            })
        });

        const rspJson = await rsp.json();
        if (!rsp.ok) {
            return NextResponse.json({ success: false, message: 'Failed to send email', detail: rspJson }, { status: 502 });
        }

        return NextResponse.json({ success: true, verifyUrl, usedFallbackActionLink, providerId: rspJson?.id || null });
    } catch (e: any) {
        return NextResponse.json({ success: false, message: e?.message || 'Unexpected error' }, { status: 500 });
    }
}
