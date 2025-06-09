// src/pages/api/admin/categories/[id].ts
import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import path from 'path';
import { dbConnect } from '@/lib/mongodb';
import Category from '@/models/Category';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/authOptions';

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
        const form = formidable({
            multiples: false,
            maxFileSize: 10 * 1024 * 1024, // 10MB
            uploadDir: path.join(process.cwd(), '/public/uploads'),
            keepExtensions: true,
            filename: (name, ext, part) => {
                return `${Date.now()}-${part.originalFilename}`;
            },
        });

        try {
            const { fields, files } = await parseForm(req, form);
            const name = Array.isArray(fields.name) ? fields.name[0] : fields.name ?? '';
            const file = Array.isArray(files.image) ? files.image[0] : files.image;

            const updateData: { name: string; image?: string } = { name };

            if (file && file.size > 0) {
                updateData.image = `/uploads/${path.basename(file.filepath)}`;
            }

            const updatedCategory = await Category.findByIdAndUpdate(id, updateData, {
                new: true,
                runValidators: true,
            });

            if (!updatedCategory) {
                return res.status(404).json({ error: 'Category not found' });
            }

            return res.status(200).json({ message: 'Category updated', category: updatedCategory });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: 'Failed to update category' });
        }
    } else if (req.method === 'DELETE') {
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
