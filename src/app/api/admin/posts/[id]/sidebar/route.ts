// src/app/api/admin/posts/[id]/route.ts
import { dbConnect } from '@/lib/mongodb';
import Post from '@/models/Post';
import Comment from '@/models/Comment';
import { NextResponse } from 'next/server';

interface PostWithViews {
    views?: number;
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
    await dbConnect();

    const post = await Post.findById(params.id).lean() as PostWithViews;
    if (!post) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    console.log('Sidebar API - fetched post:', post);

    const commentsCount = await Comment.countDocuments({ postId: params.id });

    return NextResponse.json({
        views: post.views ?? 0,
        commentsCount
    });
}
