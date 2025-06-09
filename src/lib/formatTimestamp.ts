// src/lib/formatTimestamp.ts

export function formatTimestamp(createdAt?: string, updatedAt?: string): string {
    if (!createdAt) return 'Unknown';

    const created = new Date(createdAt);
    const updated = updatedAt ? new Date(updatedAt) : null;
    const now = new Date();
    const diffMs = now.getTime() - created.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    // Only show (edited) if updated is strictly after created
    const isEdited = updated && (updated.getTime() - created.getTime()) > 1000;

    if (diffHours < 24) {
        if (diffHours >= 1) {
            return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago` +
                (isEdited ? ' (edited)' : '');
        } else {
            return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago` +
                (isEdited ? ' (edited)' : '');
        }
    } else {
        const day = created.getDate();
        const month = created.toLocaleString('default', { month: 'short' });
        const year = created.getFullYear().toString().slice(-2);
        return `${day}${getDaySuffix(day)} ${month} ${year}` +
            (isEdited ? ' (edited)' : '');
    }
}

function getDaySuffix(day: number): string {
    if (day >= 11 && day <= 13) return 'th';
    switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
}
