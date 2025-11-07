import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET() {
    try {
        // Simple query
        const { data: simple, error: simpleError } = await supabase
            .from('events')
            .select('id, title, status')
            .limit(3);

        // Join query
        const { data: joined, error: joinError } = await supabase
            .from('events')
            .select('id, title, speakers ( id, name )')
            .limit(3);

        return NextResponse.json({
            ok: true,
            simple: { count: simple?.length ?? 0, error: simpleError?.message || null },
            joined: { count: joined?.length ?? 0, error: joinError?.message || null },
        });
    } catch (e: any) {
        return NextResponse.json({ ok: false, error: e?.message || String(e) }, { status: 500 });
    }
}
