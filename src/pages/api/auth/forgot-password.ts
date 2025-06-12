// src/pages/api/auth/forgot-password.ts
import { NextApiRequest, NextApiResponse } from 'next';
import crypto from 'crypto';
import User from '@/models/User';
import {dbConnect} from '@/lib/mongodb';
import sendEmail from '@/lib/sendEmail';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await dbConnect();
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });

    const token = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    const resetLink = `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password?token=${token}`;

    const greeting = user.playerName
        ? `Hi ${user.playerName}${user.characterName ? ` (${user.characterName})` : ''},`
        : `Hi there,<br><br><em>Please update your player name in the profile section so I can address you properly in future.</em>`;

    const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <title>Password Reset</title>
  </head>
  <body style="font-family: Arial, sans-serif; background-color: #f4f4f4; margin: 0; padding: 0;">
    <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td align="center" style="padding: 40px 0;">
          <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
            <tr>
              <td style="padding: 20px; background-color: #222; color: #fff; text-align: center;">
                <h1 style="margin: 0; font-size: 24px;">Arcbound</h1>
              </td>
            </tr>
            <tr>
              <td style="padding: 30px;">
                <p style="font-size: 16px; color: #333;">${greeting}</p>
                <p style="font-size: 16px; color: #333;">We received a request to reset your password. Click the button below to reset it:</p>
                <p style="text-align: center; margin: 30px 0;">
                  <a href="${resetLink}" style="display: inline-block; background-color: #3b82f6; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: bold;">
                    Reset Your Password
                  </a>
                </p>
                <p style="font-size: 14px; color: #666;">If you didn’t request a password reset, you can safely ignore this email.</p>
                <p style="font-size: 14px; color: #666;">This link will expire in 1 hour.</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 20px; background-color: #f0f0f0; text-align: center; font-size: 12px; color: #888;">
                &copy; ${new Date().getFullYear()} Arcbound. All rights reserved.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
`;

    try {
        await sendEmail(email, 'Arcbound: Reset your password', html);
    } catch (err) {
        console.error('Email sending failed:', err);
        return res.status(500).json({ message: 'Failed to send reset email.' });
    }

    return res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });
}
