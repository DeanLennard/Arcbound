// src/lib/authOptions.ts
import CredentialsProvider from 'next-auth/providers/credentials';
import { dbConnect } from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcrypt';
import type { JWT } from 'next-auth/jwt';
import type { Session, User as NextAuthUser } from 'next-auth';

const authOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'text' },
                password: { label: 'Password', type: 'password' }
            },
            async authorize(credentials) {
                await dbConnect();

                const users = await User.find({});
                await Promise.all(users.map(u => {
                    u.email = u.email.toLowerCase();
                    return u.save();
                }));

                const email = credentials?.email?.trim().toLowerCase();
                if (!email) throw new Error('Email is required');

                const user = await User.findOne({ email: email });
                if (!user) throw new Error('User not found');

                const isValid = await bcrypt.compare(credentials?.password || '', user.password);
                if (!isValid) throw new Error('Invalid password');

                return { id: user._id, email: user.email, role: user.role };
            }
        })
    ],
    callbacks: {
        async jwt({
                      token,
                      user
                  }: {
            token: JWT;
            user?: NextAuthUser;
        }) {
            if (user) token.role = user.role;
            return token;
        },
        async session({
                          session,
                          token
                      }: {
            session: Session;
            token: JWT;
        }) {
            if (token && session.user) {
                session.user.id = token.sub ?? '';
                session.user.role = token.role as string;
            }
            return session;
        }
    },
    session: {
        strategy: 'jwt' as const
    }
};

export default authOptions;
