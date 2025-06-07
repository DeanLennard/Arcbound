'use client';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const res = await signIn('credentials', {
            redirect: false,
            email,
            password
        });
        if (res && !res.error) {
            router.push('/'); // or wherever you want to redirect
        } else {
            setError(res?.error || 'Login failed');
        }
    };

    return (
        <div className="max-w-md mx-auto mt-8 p-4 border rounded">
            <h1 className="text-2xl font-bold mb-4">Login</h1>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    className="p-2 border rounded"
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    className="p-2 border rounded"
                />
                {error && <p className="text-red-500">{error}</p>}
                <button type="submit" className="bg-green-600 text-white p-2 rounded">
                    Login
                </button>
            </form>
        </div>
    );
}
