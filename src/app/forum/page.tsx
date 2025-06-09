// /src/app/forum/page.tsx
import React, { Suspense } from 'react';
import ForumPageClient from './ForumPageClient';

export default function ForumPage() {
    return (
        <Suspense fallback={<div>Loading forum...</div>}>
            <ForumPageClient />
        </Suspense>
    );
}
