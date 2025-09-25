// src/lib/authOptions.ts
import CredentialsProvider from 'next-auth/providers/credentials';
import type { NextAuthOptions, Session, User as NextAuthUser } from 'next-auth';
import type { JWT } from 'next-auth/jwt';
import { dbConnect } from '@/lib/mongodb';
import User from '@/models/User';
import type { UserDocument } from '@/models/User';
import bcrypt from 'bcrypt';

// Extend JWT locally for use inside callbacks
type AppJWT = JWT & {
    role?: 'admin' | 'moderator' | 'member' | 'none' | string;
    roleRefreshedAt?: number;
};

type RoleOnly = Pick<UserDocument, 'role'>;

const authOptions: NextAuthOptions = {
    providers: [
        CredentialsProvider({
            name: 'Credentials',
            credentials: {
                email: { label: 'Email', type: 'text' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                await dbConnect();
                const email = credentials?.email?.trim().toLowerCase();
                if (!email) throw new Error('Email is required');

                const user = await User.findOne({ email });
                if (!user) throw new Error('User not found');

                const ok = await bcrypt.compare(credentials?.password || '', user.password);
                if (!ok) throw new Error('Invalid password');

                const authUser = {
                    id: user._id.toString(),
                    email: user.email,
                    role: user.role,
                } satisfies NextAuthUser;

                return authUser;
            },
        }),
    ],

    callbacks: {
        async jwt(
            { token, user }: { token: JWT; user?: NextAuthUser | null }
        ): Promise<JWT> {
            const t = token as AppJWT;

            if (user) {
                t.role = user.role;
                t.roleRefreshedAt = Date.now();
                return t;
            }

            if (t.sub) {
                const now = Date.now();
                const last = t.roleRefreshedAt ?? 0;
                const WINDOW = 60_000;

                if (now - last > WINDOW) {
                    await dbConnect();

                    const dbUser = await User.findById(t.sub)
                        .select('role')
                        .lean<RoleOnly | null>();

                    t.role = dbUser?.role ?? 'none';
                    t.roleRefreshedAt = now;
                }
            }
            return t;
        },

        async session(
            { session, token }: { session: Session; token: JWT }
        ): Promise<Session> {
            const t = token as AppJWT;
            if (session.user) {
                session.user.id = t.sub ?? '';
                session.user.role = t.role ?? 'none';
            }
            return session;
        },
    },

    session: { strategy: 'jwt' },
};

export default authOptions;
