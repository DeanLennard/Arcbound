// src/pages/api/admin/categories.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { dbConnect } from '@/lib/mongodb';
import Category from '@/models/Category';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export const config = {
    api: {
        bodyParser: false
    }
};

async function parseForm(req: NextApiRequest, form: formidable.Formidable) {
    return new Promise<{ fields: formidable.Fields; files: formidable.Files }>((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
            if (err) reject(err);
            else resolve({ fields, files });
        });
    });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const session = await getServerSession(req, res, authOptions);
    if (!session || !['admin', 'member'].includes(session.user.role)) {
        return res.status(403).json({ error: 'Not authorized' });
    }

    if (req.method === 'POST') {
        const uploadDir = path.join(process.cwd(), '/public/uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const form = formidable({
            multiples: false,
            maxFileSize: 10 * 1024 * 1024, // 10MB
            uploadDir: path.join(process.cwd(), '/public/uploads'),
            keepExtensions: true,
            filename: (name, ext, part, form) => {
                return `${Date.now()}-${part.originalFilename}`;
            },
        });

        try {
            const { fields, files } = await parseForm(req, form);

            const name = Array.isArray(fields.name) ? fields.name[0] : fields.name;
            const file = Array.isArray(files.image) ? files.image[0] : files.image;
            if (!name || !file) {
                return res.status(400).json({ error: 'Name and image are required' });
            }

            const imageUrl = `/uploads/${path.basename(file.filepath)}`;

            await dbConnect();
            const existing = await Category.findOne({ name });
            if (existing) {
                return res.status(400).json({ error: 'Category already exists' });
            }

            const category = new Category({ name, image: imageUrl });
            await category.save();

            return res.status(201).json({ message: 'Category created', category });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: 'Upload failed' });
        }
    } else if (req.method === 'GET') {
        try {
            await dbConnect();
            const categories = await Category.find({});
            return res.status(200).json({ categories });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to fetch categories' });
        }
    } else {
        res.setHeader('Allow', ['GET', 'POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
