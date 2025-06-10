// src/app/(dashboard)/admin/categories/page.tsx
import { getServerSession } from "next-auth/next";
import authOptions from "@/lib/authOptions";
import { redirect } from "next/navigation";
import CategoriesPageClient from "./CategoriesPageClient";  // client component

export default async function CategoriesPage() {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
        redirect('/');
    }

    return <CategoriesPageClient />;
}
