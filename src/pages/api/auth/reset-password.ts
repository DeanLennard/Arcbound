// src/pages/api/auth/reset-password.ts
import { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcrypt';
import User from '@/models/User';
import {dbConnect} from '@/lib/mongodb';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await dbConnect();
    const { token, password } = req.body;

    const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: 'Invalid or expired token.' });

    user.password = await bcrypt.hash(password, 12);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password has been reset.' });
}
