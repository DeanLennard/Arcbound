// src/app/api/admin/posts/[id]/route.ts
import { dbConnect } from '@/lib/mongodb';
import Post from '@/models/Post';
import { NextResponse } from 'next/server';
import Category from '@/models/Category';

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    await dbConnect();

    const post = await Post.findByIdAndUpdate(
        params.id,
        { $inc: { views: 1 } },
        { new: true }
    )
        .populate('category')
        .populate('authorId', 'characterName profileImage') // 👈 populate author fields
        .lean();

    if (!post) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Make sure likes is always an array
    const likesCount = Array.isArray(post.likes) ? post.likes.length : 0;
    post.likesCount = likesCount;  // add a count field

    // Transform author field for frontend
    const transformedPost = {
        ...post,
        author: post.authorId
            ? {
                characterName: post.authorId.characterName || 'Unknown',
                profileImage: post.authorId.profileImage || null
            }
            : { characterName: 'Unknown', profileImage: null }
    };

    delete transformedPost.authorId; // optional: remove raw field

    return NextResponse.json({ post: transformedPost });
}
