// src/app/reset-password/page.tsx
import { Suspense } from 'react';
import ResetPasswordForm from './ResetPasswordForm';

export default function ResetPasswordPage() {
    return (
        <Suspense fallback={<div className="text-center mt-8">Loading...</div>}>
            <ResetPasswordForm />
        </Suspense>
    );
}
