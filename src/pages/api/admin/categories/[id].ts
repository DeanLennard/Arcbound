// src/pages/api/admin/categories/[[id]].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import path from 'path';
import { dbConnect } from '@/lib/mongodb';
import Category from '@/models/Category';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/authOptions';
import crypto from 'crypto';
import fs from "fs";

export const config = {
    api: {
        bodyParser: false,
    },
};

async function parseForm(req: NextApiRequest, form: InstanceType<typeof formidable.Formidable>) {
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

    await dbConnect();

    const { id } = req.query;

    if (req.method === 'PUT') {
        const uploadDir = path.join(process.cwd(), '/public/uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const form = formidable({
            multiples: false,
            maxFileSize: 10 * 1024 * 1024,
            uploadDir,
            keepExtensions: true,
            filename: (name, ext, part) => {
                const hash = crypto
                    .createHash('sha256')
                    .update(part.originalFilename || '')
                    .digest('hex');
                const timestamp = Date.now();
                const fileExt = path.extname(part.originalFilename || '');
                return `${timestamp}_${hash}${fileExt}`;
            },
        });

        try {
            const { fields, files } = await parseForm(req, form);

            const name = Array.isArray(fields.name) ? fields.name[0] : fields.name ?? '';
            const faction = Array.isArray(fields.faction) ? fields.faction[0] : fields.faction ?? null;

            const file = Array.isArray(files.image) ? files.image[0] : files.image;

            // Fetch existing category so we know the old image
            const category = await Category.findById(id);
            if (!category) return res.status(404).json({ error: 'Category not found' });

            let imageUrl = category.image;

            // If a new file was uploaded, replace old image
            if (file && file.size > 0) {
                const newFilename = path.basename(file.filepath);
                imageUrl = `/uploads/${newFilename}`;

                // Delete old file if it exists and is in /uploads
                if (category.image?.startsWith('/uploads/')) {
                    const oldFilePath = path.join(process.cwd(), 'public', category.image);
                    if (fs.existsSync(oldFilePath)) {
                        fs.unlinkSync(oldFilePath);
                    }
                }
            }

            const updatedCategory = await Category.findByIdAndUpdate(
                id,
                { name, faction, image: imageUrl },
                { new: true, runValidators: true }
            );

            return res.status(200).json({
                message: 'Category updated',
                category: updatedCategory,
            });

        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to update category' });
        }
    }else if (req.method === 'DELETE') {
        try {
            const deletedCategory = await Category.findByIdAndDelete(id);
            if (!deletedCategory) {
                return res.status(404).json({ error: 'Category not found' });
            }
            return res.status(200).json({ message: 'Category deleted' });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to delete category' });
        }
    } else {
        res.setHeader('Allow', ['PUT', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
