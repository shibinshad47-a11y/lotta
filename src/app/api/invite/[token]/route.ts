import { NextRequest, NextResponse } from 'next/server';
import { chatService } from '@/services/chatService';

export async function GET(
  req: NextRequest,
  { params }: { params: { token: string } }
) {
  const token = params.token;
  if (!token) {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 });
  }

  const res = await chatService.getInvitationByToken(token);
  if (!res) {
    return NextResponse.json(
      { error: 'Invitation link is invalid or does not exist.' },
      { status: 404 }
    );
  }

  const { invitation, inviter } = res;

  if (invitation.status !== 'active') {
    return NextResponse.json(
      { error: 'This invitation has been revoked.' },
      { status: 410 }
    );
  }

  if (new Date(invitation.expires_at) <= new Date()) {
    return NextResponse.json(
      { error: 'This invitation link has expired.' },
      { status: 410 }
    );
  }

  // Return public inviter information only (name, username, avatar_url, bio)
  return NextResponse.json({
    valid: true,
    inviter: {
      id: inviter.id,
      name: inviter.name,
      username: inviter.username,
      avatar_url: inviter.avatar_url,
      bio: inviter.bio,
    },
    expires_at: invitation.expires_at,
  });
}
