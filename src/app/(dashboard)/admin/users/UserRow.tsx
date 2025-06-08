'use client';

import React, { useState } from 'react';
import toast from 'react-hot-toast';

interface UserRowProps {
    user: {
        _id: string;
        email: string;
        role: string;
    };
}

export default function UserRow({ user }: UserRowProps) {
    const [role, setRole] = useState(user.role);
    const [loading, setLoading] = useState(false);

    const handleRoleChange = async (newRole: string) => {
        if (newRole === role) return; // skip if same role
        setLoading(true);
        const toastId = toast.loading('Updating role...');
        try {
            const res = await fetch(`/api/admin/users/${user._id}/role`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ newRole })
            });
            if (!res.ok) {
                const data = await res.json();
                toast.error(`Error: ${data.error || 'Failed to update role'}`, { id: toastId });
            } else {
                setRole(newRole);
                toast.success(`Role updated to ${newRole}`, { id: toastId });
            }
        } catch {
            toast.error('Something went wrong', { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <tr className="border">
            <td className="border p-2">{user.email}</td>
            <td className="border p-2 capitalize">{role}</td>
            <td className="border p-2 flex flex-wrap gap-2">
                <button
                    disabled={loading || role === 'admin'}
                    onClick={() => handleRoleChange('admin')}
                    className={`px-2 py-1 rounded text-white ${
                        role === 'admin' ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                >
                    Set role to Admin
                </button>
                <button
                    disabled={loading || role === 'moderator'}
                    onClick={() => handleRoleChange('moderator')}
                    className={`px-2 py-1 rounded text-white ${
                        role === 'moderator' ? 'bg-gray-400' : 'bg-green-600 hover:bg-green-700'
                    }`}
                >
                    Set role to Moderator
                </button>
                <button
                    disabled={loading || role === 'member'}
                    onClick={() => handleRoleChange('member')}
                    className={`px-2 py-1 rounded text-white ${
                        role === 'member' ? 'bg-gray-400' : 'bg-yellow-600 hover:bg-yellow-700'
                    }`}
                >
                    Set role to Member
                </button>
            </td>
        </tr>
    );
}
