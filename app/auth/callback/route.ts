import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
    const requestUrl = new URL(request.url);
    const code = requestUrl.searchParams.get('code');

    if (code) {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll(cookiesToSet: Array<{ name: string; value: string; options: any }>) {
                        cookiesToSet.forEach(({ name, value, options }) => {
                            cookieStore.set(name, value, options);
                        });
                    },
                },
            }
        );

        const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);

        // Check if this is a new user and send welcome email
        if (user && !error) {
            // Check if profile exists (new user won't have one yet)
            const { data: profile } = await supabase
                .from('profiles')
                .select('id, full_name')
                .eq('id', user.id)
                .single();

            // If profile was just created, send welcome email
            // The trigger will handle this automatically via the database
            // But we can also manually trigger it here if needed
            if (profile) {
                try {
                    console.log('📧 Attempting to send welcome email...');
                    // Send welcome email via our API
                    const response = await fetch(`${requestUrl.origin}/api/webhooks/email`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            type: 'welcome_email',
                            user_id: user.id,
                            email: user.email,
                            name: profile.full_name || user.email?.split('@')[0],
                        }),
                    });

                    if (response.ok) {
                        console.log('✅ Welcome email sent successfully');
                    } else {
                        console.warn('⚠️ Welcome email not sent (system not configured)');
                    }
                } catch (emailError: any) {
                    console.warn('⚠️ Failed to send welcome email (non-critical):', emailError.message || emailError);
                    // Don't fail the auth flow if email fails
                }
            }
        }
    }

    // Redirect to dashboard after successful login
    return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
}
