import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { sendEmail } from '@/lib/email';
import { ReportShareEmail } from '@/lib/email-templates';

// POST /api/share - Create a new share link
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { runId, password, expiresInDays, recipientEmail, message } = body;

    if (!runId) {
      return NextResponse.json({ error: 'runId is required' }, { status: 400 });
    }

    // Verify the run belongs to the user and get details for email
    const { data: run, error: runError } = await supabase
      .from('runs')
      .select('id, user_id, niche_query')
      .eq('id', runId)
      .eq('user_id', user.id)
      .single();

    if (runError || !run) {
      return NextResponse.json(
        { error: 'Run not found or access denied' },
        { status: 404 }
      );
    }

    // Get user's name for email
    const { data: userData } = await supabase
      .from('users')
      .select('name, email')
      .eq('id', user.id)
      .single();

    // Generate unique token
    const { data: tokenData, error: tokenError } = await supabase.rpc(
      'generate_share_token'
    );

    if (tokenError) {
      console.error('Error generating token:', tokenError);
      return NextResponse.json(
        { error: 'Failed to generate share token' },
        { status: 500 }
      );
    }

    const token = tokenData as string;

    // Hash password if provided
    let passwordHash = null;
    if (password && password.trim()) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    // Calculate expiration date
    let expiresAt = null;
    if (expiresInDays && expiresInDays > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    // Create share link
    const { data: shareLink, error: createError } = await supabase
      .from('share_links')
      .insert({
        token,
        run_id: runId,
        user_id: user.id,
        password_hash: passwordHash,
        expires_at: expiresAt,
        is_active: true,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating share link:', createError);
      return NextResponse.json(
        { error: 'Failed to create share link' },
        { status: 500 }
      );
    }

    // Generate share URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
    const shareUrl = `${baseUrl}/share/${token}`;

    // Send email to recipient if email provided
    if (recipientEmail && recipientEmail.trim()) {
      try {
        await sendEmail({
          to: recipientEmail,
          subject: `${userData?.name || 'Someone'} shared a GapRadar report with you`,
          react: ReportShareEmail({
            recipientEmail,
            senderName: userData?.name,
            reportTitle: run.niche_query,
            shareUrl,
            message,
            hasPassword: !!passwordHash,
          }),
        });
        console.log('✅ Share notification email sent to:', recipientEmail);
      } catch (emailError) {
        // Don't fail the share creation if email fails
        console.error('⚠️ Failed to send share notification email:', emailError);
      }
    }

    return NextResponse.json({
      success: true,
      shareLink: {
        id: shareLink.id,
        token: shareLink.token,
        url: shareUrl,
        hasPassword: !!passwordHash,
        expiresAt: shareLink.expires_at,
        createdAt: shareLink.created_at,
      },
      emailSent: !!recipientEmail,
    });
  } catch (error) {
    console.error('Error in share API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/share?runId={runId} - Get existing share links for a run
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const runId = searchParams.get('runId');

    if (!runId) {
      return NextResponse.json({ error: 'runId is required' }, { status: 400 });
    }

    // Get share links for this run
    const { data: shareLinks, error } = await supabase
      .from('share_links')
      .select('*')
      .eq('run_id', runId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching share links:', error);
      return NextResponse.json(
        { error: 'Failed to fetch share links' },
        { status: 500 }
      );
    }

    // Generate URLs and format response
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || request.nextUrl.origin;
    const formattedLinks = shareLinks?.map((link) => ({
      id: link.id,
      token: link.token,
      url: `${baseUrl}/share/${link.token}`,
      hasPassword: !!link.password_hash,
      expiresAt: link.expires_at,
      isActive: link.is_active,
      viewCount: link.view_count,
      lastViewedAt: link.last_viewed_at,
      createdAt: link.created_at,
    })) || [];

    return NextResponse.json({
      success: true,
      shareLinks: formattedLinks,
    });
  } catch (error) {
    console.error('Error in share API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/share?id={shareId} - Delete a share link
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = request.nextUrl;
    const shareId = searchParams.get('id');

    if (!shareId) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // Delete the share link (RLS will ensure user owns it)
    const { error } = await supabase
      .from('share_links')
      .delete()
      .eq('id', shareId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error deleting share link:', error);
      return NextResponse.json(
        { error: 'Failed to delete share link' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Share link deleted',
    });
  } catch (error) {
    console.error('Error in share API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
