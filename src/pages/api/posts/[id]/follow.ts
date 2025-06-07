// src/pages/api/posts/[id]/follow.ts
import { dbConnect } from '@/lib/mongodb';
import Post from '@/models/Post';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { NextResponse } from 'next/server';

export async function POST(req: Request, { params }: { params: { id: string } }) {
  await dbConnect();
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });
  }
  const userId = session.user.id;
  const post = await Post.findById(params.id);
  if (!post) {
    return NextResponse.json({ error: 'Post not found' }, { status: 404 });
  }

  const isFollowing = post.subscribers.includes(userId);
  if (isFollowing) {
    post.subscribers.pull(userId);
  } else {
    post.subscribers.push(userId);
  }
  await post.save();

  return NextResponse.json({ isFollowing: !isFollowing });
}
