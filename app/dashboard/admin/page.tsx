'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/lib/auth-context';
import AdminDashboardLayout from '@/components/dashboard/admin/AdminDashboardLayout';
import DashboardSkeleton from '@/components/DashboardSkeleton';
import toast from 'react-hot-toast';

export default function AdminPage() {
    const router = useRouter();
    const { user, profile, loading } = useAuth();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/auth/login');
                return;
            }

            if (profile?.role !== 'admin') {
                toast.error('Unauthorized access');
                router.push('/dashboard');
                return;
            }

            setIsAuthorized(true);
        }
    }, [user, profile, loading, router]);

    if (loading || !isAuthorized) {
        return (
            <>
                <Navbar />
                <DashboardSkeleton />
            </>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-primary animate-fade-in pb-12">
            <Navbar />
            <div className="container mx-auto px-4 py-8 md:py-12 content-align-navbar">
                <AdminDashboardLayout />
            </div>
        </div>
    );
}
