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

    const query: Record<string, unknown> = {};
    if (categoryId && categoryId !== 'all') {
        query.category = categoryId;
    }

    // 1) fetch your basic page of posts
    const posts = await Post.find(query)
        .populate('category')
        .populate('authorId', 'characterName profileImage')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()

    const totalPosts  = await Post.countDocuments(query)
    const totalPages  = Math.ceil(totalPosts / limit)

    // 2) transform + commentsCount + likesCount + views
    const transformed = await Promise.all(posts.map(async post => {
        const { authorId, createdAt, ...rest } = post
        const comments    = await Comment.find({ postId: post._id }).lean()
        const commentsCount = comments.length

        const newest = await Comment.findOne({ postId: post._id })
            .sort({ createdAt: -1 })
            .select('createdAt')
            .lean<{ createdAt: Date }>();
        const lastActivity = newest?.createdAt ?? new Date(createdAt);

        return {
            ...rest,
            author: authorId
                ? {
                    characterName: authorId.characterName  || 'Unknown',
                    profileImage:  authorId.profileImage   || null
                }
                : { characterName: 'Unknown', profileImage: null },
            views:       post.views      ?? 0,
            likesCount:  Array.isArray(post.likes) ? post.likes.length : 0,
            commentsCount,
            createdAt,
            lastActivity,
        }
    }))

    // 4) sort by that lastActivity descending
    transformed.sort((a, b) =>
        b.lastActivity.getTime() - a.lastActivity.getTime()
    );

    return NextResponse.json({
        posts: transformed,
        totalPages,
        currentPage: page
    })
}

function extractFirstImage(html: string): string | undefined {
    const match = html.match(/<img[^>]+src="([^">]+)"/);
    return match ? match[1] : undefined;
}

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role === 'none') {
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
            category: categoryId,
            editedAt: new Date(),
        },
        { new: true }
    );

    if (!updatedPost) {
        return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Post updated successfully', post: updatedPost });
}
