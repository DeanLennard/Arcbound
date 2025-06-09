// src/types/next-auth.d.ts
// Import the module to ensure augmentation happens
import 'next-auth';

declare module 'next-auth' {
    interface Session {
        user: {
            id: string;
            email: string;
            role: string;
        };
    }

    interface User {
        id: string;
        email: string;
        role: string;
    }
}
