'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import EditProfileSkeleton from '@/components/EditProfileSkeleton';
import { supabase } from '@/lib/supabase';
import toast from 'react-hot-toast';
import AvatarUpload from '@/components/profile/AvatarUpload';
import ProfileForm, { ProfileFormData } from '@/components/profile/ProfileForm';
import SecurityForm, { SecurityFormData } from '@/components/profile/SecurityForm';

export default function EditProfilePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);
    const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [currentAvatarUrl, setCurrentAvatarUrl] = useState('');
    const [initialProfileData, setInitialProfileData] = useState<ProfileFormData>({
        full_name: '',
        phone: '',
        institution: '',
        position: '',
        city: '',
    });

    useEffect(() => {
        checkAuth();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const checkAuth = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                toast.error('Anda harus login terlebih dahulu');
                router.push('/auth/login');
                return;
            }

            // Load existing profile
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single();

            if (error) throw error;

            if (profile) {
                setInitialProfileData({
                    full_name: profile.full_name || '',
                    phone: profile.phone || '',
                    institution: profile.institution || '',
                    position: profile.position || '',
                    city: profile.city || '',
                });
                setCurrentAvatarUrl(profile.avatar_url || '');
            }

            setAuthChecked(true);
        } catch (error: any) {
            console.error('Error:', error);
            toast.error(error.message);
        }
    };

    const uploadAvatar = async () => {
        if (!avatarFile) return currentAvatarUrl;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not found');

            // Delete old avatar if exists
            if (currentAvatarUrl) {
                const oldPath = currentAvatarUrl.split('/storage/v1/object/public/events/')[1];
                if (oldPath) {
                    await fetch(`/api/upload?path=${encodeURIComponent(oldPath)}`, {
                        method: 'DELETE',
                    });
                }
            }

            // Use API endpoint to upload (bypasses RLS with service role)
            const uploadFormData = new FormData();
            uploadFormData.append('file', avatarFile);

            const response = await fetch('/api/upload?folder=avatars', {
                method: 'POST',
                body: uploadFormData,
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Upload failed');
            }

            const { url } = await response.json();
            return url;
        } catch (error: any) {
            console.error('Error uploading avatar:', error);
            toast.error('Gagal upload foto');
            throw error;
        }
    };

    const handleProfileSubmit = async (data: ProfileFormData) => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not found');

            // Upload avatar if changed
            let avatarUrl = currentAvatarUrl;
            if (avatarFile) {
                avatarUrl = await uploadAvatar();
            }

            // Update profile
            const { error } = await supabase
                .from('profiles')
                .update({
                    full_name: data.full_name,
                    phone: data.phone,
                    institution: data.institution,
                    position: data.position,
                    city: data.city,
                    avatar_url: avatarUrl,
                })
                .eq('id', user.id);

            if (error) throw error;

            toast.success('Profile berhasil diupdate!');
            router.push('/dashboard');
        } catch (error: any) {
            console.error('Error updating profile:', error);
            toast.error(error.message || 'Gagal update profile');
        } finally {
            setLoading(false);
        }
    };

    const handleSecuritySubmit = async (data: SecurityFormData) => {
        try {
            setLoading(true);
            const { data: { user }, error: userErr } = await supabase.auth.getUser();
            if (userErr) throw userErr;
            if (!user?.email) throw new Error('User tidak ditemukan');

            // Re-authenticate by verifying current password
            const { error: loginErr } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: data.currentPassword,
            });
            if (loginErr) throw new Error('Password saat ini salah');

            // Update password
            const { error: updErr } = await supabase.auth.updateUser({ password: data.newPassword });
            if (updErr) throw updErr;

            toast.success('Password berhasil diubah');
        } catch (err: any) {
            console.error(err);
            toast.error(err?.message || 'Gagal mengubah password');
        } finally {
            setLoading(false);
        }
    };

    if (!authChecked) {
        return (
            <>
                <Navbar />
                <EditProfileSkeleton />
            </>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-primary animate-fade-in">
            <Navbar />

            <div className="container mx-auto px-4 py-12 content-align-navbar">
                {/* Header */}
                <div className="mb-8">
                    <Link
                        href="/dashboard"
                        className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 mb-4 transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                        Kembali ke Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Profile</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">
                        Perbarui informasi profil dan keamanan akun Anda
                    </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-8 border-b border-gray-200 dark:border-gray-800">
                    <button
                        type="button"
                        onClick={() => setActiveTab('profile')}
                        className={`px-4 py-3 -mb-px border-b-2 font-medium transition-all ${activeTab === 'profile'
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                    >
                        Profil
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('security')}
                        className={`px-4 py-3 -mb-px border-b-2 font-medium transition-all ${activeTab === 'security'
                                ? 'border-primary-600 text-primary-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                    >
                        Keamanan
                    </button>
                </div>

                <div className="max-w-4xl">
                    {activeTab === 'profile' && (
                        <div className="space-y-8">
                            <AvatarUpload
                                currentAvatarUrl={currentAvatarUrl}
                                onFileSelect={setAvatarFile}
                                disabled={loading}
                            />
                            <ProfileForm
                                initialData={initialProfileData}
                                onSubmit={handleProfileSubmit}
                                isLoading={loading}
                            />
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <SecurityForm
                            onSubmit={handleSecuritySubmit}
                            isLoading={loading}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
