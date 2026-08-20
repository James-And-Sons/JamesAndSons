import { NextRequest, NextResponse } from 'next/server';
import { sendMetaCapiEvent } from '@/lib/meta-capi';
import { createClient } from '@/utils/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventName, eventId, eventSourceUrl, customData, rawUserData, testEventCode } = body;

    if (!eventName || !eventId) {
      return NextResponse.json({ error: 'Missing eventName or eventId' }, { status: 400 });
    }

    // Try to get logged in user details to enrich user_data for higher match quality
    let userDetails = rawUserData || {};
    try {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userDetails = {
          email: user.email,
          phone: user.phone || user.user_metadata?.phone,
          firstName: user.user_metadata?.first_name || user.user_metadata?.name?.split(' ')[0],
          lastName: user.user_metadata?.last_name || user.user_metadata?.name?.split(' ').slice(1).join(' '),
          externalId: user.id,
          ...userDetails
        };
      }
    } catch (authErr) {
      // Gracefully continue without user details if auth retrieval fails
      console.log('[Meta CAPI] Session retrieval skipped or failed:', authErr);
    }

    const result = await sendMetaCapiEvent({
      eventName,
      eventId,
      eventSourceUrl: eventSourceUrl || req.headers.get('referer') || '',
      rawUserData: userDetails,
      customData,
      testEventCode,
    });

    return NextResponse.json(result);
  } catch (err: any) {
    console.error('[Meta CAPI Route] Handler error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
