// src/pages/api/admin/upload.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { getServerSession } from 'next-auth/next';
import authOptions from '@/lib/authOptions';
import crypto from 'crypto';

export const config = {
    api: { bodyParser: false }
};

// 🔥 Ensure this runs in NodeJS
export const runtime = 'nodejs';

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

    if (req.method === 'POST') {
        const uploadDir = path.join(process.cwd(), '/public/uploads');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const form = formidable({
            multiples: false,
            maxFileSize: 10 * 1024 * 1024, // 10MB
            uploadDir,
            keepExtensions: true,
            filename: (name, ext, part) => {
                const hash = crypto.createHash('sha256').update(part.originalFilename || '').digest('hex');
                const timestamp = Date.now();
                const fileExt = path.extname(part.originalFilename || '');
                return `${timestamp}_${hash}${fileExt}`;
            },
        });

        try {
            const { files } = await parseForm(req, form);
            const file = Array.isArray(files.file) ? files.file[0] : files.file;

            if (!file) {
                return res.status(400).json({ error: 'File upload failed' });
            }

            // safer fallback for older formidable versions
            const filePath = `/uploads/${path.basename(file.filepath)}`;
            return res.status(200).json({ url: filePath });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ error: 'Upload failed' });
        }
    } else {
        res.setHeader('Allow', ['POST']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
