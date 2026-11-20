import { NextRequest, NextResponse } from 'next/server';
import { chatService } from '@/services/chatService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, userId } = body;

    if (!token || !userId) {
      return NextResponse.json(
        { error: 'token and userId are required' },
        { status: 400 }
      );
    }

    const result = await chatService.acceptInvitation(token, userId);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      conversationId: result.conversationId,
      inviter: result.inviter,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
