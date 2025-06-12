'use client';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function ResetPasswordPage() {
    const searchParams = useSearchParams();
    const [token, setToken] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');

    // Extract token safely
    useEffect(() => {
        if (searchParams) {
            const t = searchParams.get('token');
            if (t) setToken(t);
        }
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch('/api/auth/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token, password }),
        });

        const data = await res.json();
        setMessage(data.message);
    };

    return (
        <div className="max-w-md mx-auto mt-8 p-4 border rounded">
            <h1 className="text-xl font-bold mb-4">Reset Password</h1>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <input
                    type="password"
                    placeholder="New password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="p-2 border rounded"
                    required
                />
                <button className="bg-green-600 text-white p-2 rounded">Reset Password</button>
            </form>
            {message && (
                <p className={`mt-2 text-sm ${message.includes('reset') ? 'text-green-500' : 'text-red-500'}`}>
                    {message}
                </p>
            )}
        </div>
    );
}
