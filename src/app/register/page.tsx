'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        if (res.ok) {
            router.push('/login');
        } else {
            const data = await res.json();
            setError(data.error || 'Something went wrong');
        }
    };

    return (
        <div className="max-w-md mx-auto mt-8 p-4 border rounded">
            <h1 className="text-2xl font-bold mb-4">Register</h1>
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
                <button type="submit" className="bg-blue-600 text-white p-2 rounded">
                    Register
                </button>
            </form>
        </div>
    );
}
