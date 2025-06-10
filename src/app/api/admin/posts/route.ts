// src/app/api/admin/posts/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/authOptions';
import { dbConnect } from '@/lib/mongodb';
import Post from '@/models/Post';
import Comment from '@/models/Comment';

export async function GET(req: Request) {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    const query: any = {};
    if (categoryId && categoryId !== 'all') {
        query.category = categoryId;
    }

    const posts = await Post.find(query)
        .populate('category')
        .populate('authorId', 'characterName profileImage')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

    const totalPosts = await Post.countDocuments(query);
    const totalPages = Math.ceil(totalPosts / limit);

    const transformedPosts = await Promise.all(posts.map(async post => {
        const { authorId, ...rest } = post;
        const comments = await Comment.find({ postId: post._id }).lean();
        return {
            ...rest,
            author: authorId
                ? {
                    characterName: authorId.characterName || 'Unknown',
                    profileImage: authorId.profileImage || null
                }
                : { characterName: 'Unknown', profileImage: null },
            comments: comments.map(comment => ({
                content: comment.content
            }))
        };
    }));

    return NextResponse.json({ posts: transformedPosts, totalPages, currentPage: page });
}

function extractFirstImage(html: string): string | undefined {
    const match = html.match(/<img[^>]+src="([^">]+)"/);
    return match ? match[1] : undefined;
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { title, content, categoryId } = await req.json();
    if (!title || !content || !categoryId) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Extract previewImage from content
    const previewImage = extractFirstImage(content);

    await dbConnect();
    const post = new Post({
        title,
        content,
        previewImage,
        category: categoryId,
        authorId: session.user.id
    });
    await post.save();

    return NextResponse.json({ message: 'Post created successfully', post }, { status: 201 });
}

export async function PUT(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { id, title, content, categoryId } = await req.json();
    if (!id || !title || !content || !categoryId) {
        return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const previewImage = extractFirstImage(content);

    await dbConnect();
    const updatedPost = await Post.findByIdAndUpdate(
        id,
        {
            title,
            content,
            previewImage,
            category: categoryId
        },
        { new: true }
    );

    if (!updatedPost) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Post updated successfully', post: updatedPost });
}
