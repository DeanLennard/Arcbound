// src/app/api/admin/posts/route.ts
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/authOptions';
import { dbConnect } from '@/lib/mongodb';
import Post from '@/models/Post';
import Comment from '@/models/Comment';
import Category, { CategoryDocument } from '@/models/Category';
import Character from '@/models/Character';

export async function GET(req: Request) {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });

    await dbConnect();
    const { searchParams } = new URL(req.url);
    const categoryId = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Determine what factions the user has access to
    const characters = await Character.find({
        user: session.user.id,
        status: 'Active'
    }).select('faction');

    const userFactions = characters.map(c => c.faction);

    // Build initial query
    const query: Record<string, unknown> = {};

    // If filtering by specific category
    if (categoryId && categoryId !== 'all') {
        query.category = categoryId;

        const category = await Category.findById(categoryId).lean<CategoryDocument>();
        if (!category) {
            return NextResponse.json({ error: 'Category not found' }, { status: 404 });
        }

        if (category.faction && !userFactions.includes(category.faction)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
    } else {
        // Filtering all posts: exclude restricted categories
        const allowedCategories = await Category.find({
            $or: [
                { faction: { $in: userFactions } },
                { faction: { $exists: false } },
                { faction: null },
                { faction: '' }
            ]
        }).select('_id');

        query.category = { $in: allowedCategories.map(cat => cat._id) };
    }


    const posts = await Post.find(query)
        .populate('category')
        .populate('authorId', 'characterName profileImage')
        .sort({ lastActivity: -1, createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

    const totalPosts = await Post.countDocuments(query);
    const totalPages = Math.ceil(totalPosts / limit);

    const transformedPosts = await Promise.all(posts.map(async post => {
        const { authorId, ...rest } = post;
        const comments = await Comment.find({ postId: post._id }).lean();
        const commentsCount = await Comment.countDocuments({ postId: post._id })
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
            })),
            views:         post.views ?? 0,
            likesCount:    Array.isArray(post.likes) ? post.likes.length : 0,
            commentsCount,
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
    if (!session || session.user.role === 'none') {
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