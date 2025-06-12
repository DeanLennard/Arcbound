// src/app/forgot-password/page.tsx
'use client';
import { useState } from 'react';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const res = await fetch('/api/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
        });

        const data = await res.json();
        setMessage(data.message || 'Check your email if an account exists.');
    };

    return (
        <div className="max-w-md mx-auto mt-8 p-4 border rounded">
            <h1 className="text-xl font-bold mb-4">Forgot Password</h1>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Your email"
                    className="p-2 border rounded"
                    required
                />
                <button className="bg-blue-600 text-white p-2 rounded">Send Reset Link</button>
            </form>
            {message && (
                <p className={`mt-2 text-sm ${message.includes('reset') ? 'text-green-500' : 'text-red-500'}`}>
                    {message}
                </p>
            )}
        </div>
    );
}
