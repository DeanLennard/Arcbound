'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { formatTimestamp } from '@/lib/formatTimestamp';

interface Notification {
    _id: string;
    postId: { _id: string; title: string };
    type: string;
    isRead: boolean;
    createdAt: string;
}

export default function NotificationsPage() {
    const { data: session } = useSession();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (session) {
            fetch('/api/notifications')
                .then(res => res.json())
                .then(data => {
                    setNotifications(data.notifications);
                    setLoading(false);
                })
                .catch(err => {
                    console.error('Failed to fetch notifications:', err);
                    toast.error('Failed to load notifications');
                    setLoading(false);
                });
        }
    }, [session]);

    const handleNotificationClick = async (notification: Notification) => {
        try {
            await fetch(`/api/notifications/${notification._id}/mark-read`, {
                method: 'PATCH'
            });
            // Navigate to the post page
            window.location.href = `/forum/${notification.postId._id}`;
        } catch (err) {
            console.error('Failed to mark notification as read:', err);
            toast.error('Failed to mark notification as read');
        }
    };

    if (!session) {
        return (
            <div className="p-6">
                <p>Please log in to view notifications.</p>
            </div>
        );
    }

    return (
        <div className="max-w-full sm:max-w-3xl md:max-w-5xl lg:max-w-7xl mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Notifications</h1>
            {loading ? (
                <p>Loading notifications...</p>
            ) : notifications.length === 0 ? (
                <p>No notifications found.</p>
            ) : (
                <ul className="space-y-2">
                    {notifications.map(notification => (
                        <li
                            key={notification._id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`p-4 border rounded cursor-pointer hover:bg-gray-700 ${
                                !notification.isRead ? 'font-bold bg-gray-800' : ''
                            }`}
                        >
                            <p>
                                {notification.type === 'comment' &&
                                    `💬 New comment on "${notification.postId?.title || 'Post'}"`}
                                {notification.type === 'like' &&
                                    `👍 Someone liked "${notification.postId?.title || 'Post'}"`}
                            </p>
                            <p className="text-xs text-gray-400">
                                {formatTimestamp(notification.createdAt)}
                            </p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
