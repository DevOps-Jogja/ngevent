import { NextResponse } from 'next/server';

// GET /auth/verify?token=...&type=signup&redirect_to=https://domain.com/auth/callback
// This endpoint keeps the email link branded while delegating verification to Supabase
export async function GET(request: Request) {
    const url = new URL(request.url);
    const link = url.searchParams.get('link');
    const token = url.searchParams.get('token');
    const type = url.searchParams.get('type') || 'signup';
    const redirectTo = url.searchParams.get('redirect_to');

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || url.origin;

    if (!supabaseUrl) {
        // Missing essentials, just fallback
        return NextResponse.redirect(new URL('/auth/callback', siteUrl));
    }

    const finalRedirect = redirectTo || `${siteUrl}/auth/callback`;

    try {
        // Build target: prefer full action_link if provided, else construct from token/type
        const verifyUrl = link
            ? link
            : `${supabaseUrl}/auth/v1/verify?token=${encodeURIComponent(token || '')}&type=${encodeURIComponent(type)}&redirect_to=${encodeURIComponent(finalRedirect)}`;
        const headers: Record<string, string> = {};
        if (supabaseAnon) {
            headers['apikey'] = supabaseAnon;
            headers['Authorization'] = `Bearer ${supabaseAnon}`;
        }
        const rsp = await fetch(verifyUrl, { redirect: 'manual', headers });

        // If Supabase responds with a redirect (302/303) to our callback with a `code`, capture it
        const location = rsp.headers.get('location');
        if (location) {
            try {
                const loc = new URL(location);
                const code = loc.searchParams.get('code');
                if (code) {
                    // Redirect to our callback with the code (keeps domain branded)
                    const cb = new URL('/auth/callback', siteUrl);
                    cb.searchParams.set('code', code);
                    return NextResponse.redirect(cb);
                }
                // If no code param, verification likely succeeded; send user to login with a hint
                const login = new URL('/auth/login', siteUrl);
                login.searchParams.set('verified', '1');
                return NextResponse.redirect(login);
            } catch {
                // If Location is not a valid absolute URL, send to login with verified hint
                const login = new URL('/auth/login', siteUrl);
                login.searchParams.set('verified', '1');
                return NextResponse.redirect(login);
            }
        }

        // If no redirect header, assume verification OK and send to login
        const login = new URL('/auth/login', siteUrl);
        login.searchParams.set('verified', '1');
        return NextResponse.redirect(login);
    } catch {
        // Any error, fallback to login without hint
        return NextResponse.redirect(new URL('/auth/login', siteUrl));
    }
}
