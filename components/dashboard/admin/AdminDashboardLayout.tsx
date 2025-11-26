import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/lib/database.types';
import toast from 'react-hot-toast';
import AdminStats from './AdminStats';
import AdminUserList from './AdminUserList';
import AdminEventList from './AdminEventList';
import { Users, Calendar } from 'lucide-react';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Event = Database['public']['Tables']['events']['Row'] & {
    profiles?: { full_name: string | null } | null;
};

export default function AdminDashboardLayout() {
    const [activeTab, setActiveTab] = useState<'users' | 'events'>('users');
    const [users, setUsers] = useState<Profile[]>([]);
    const [events, setEvents] = useState<Event[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch users
            const { data: usersData, error: usersError } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (usersError) throw usersError;
            setUsers(usersData || []);

            // Fetch events with organizer details
            const { data: eventsData, error: eventsError } = await supabase
                .from('events')
                .select('*, profiles(full_name)')
                .order('created_at', { ascending: false });

            if (eventsError) throw eventsError;
            setEvents(eventsData as Event[] || []);

        } catch (error: any) {
            console.error('Error fetching admin data:', error);
            toast.error('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleUpdateRole = async (userId: string, newRole: 'participant' | 'organizer' | 'admin') => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', userId);

            if (error) throw error;

            setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
            toast.success('User role updated successfully');
        } catch (error: any) {
            toast.error('Failed to update role: ' + error.message);
        }
    };

    const handleDeleteUser = async (userId: string) => {
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;

        try {
            // Delete from auth.users via server-side function would be ideal, 
            // but for now we rely on cascade delete from profiles if RLS allows, 
            // or just delete the profile. 
            // Note: Deleting from public.profiles will NOT delete from auth.users automatically 
            // unless there is a trigger or we use the admin API.
            // Since we don't have the admin API client-side, we can only delete the profile data.
            // Ideally, we should call a server action or API route for this.

            // For this implementation, we will delete from public.profiles
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', userId);

            if (error) throw error;

            setUsers(users.filter(u => u.id !== userId));
            toast.success('User profile deleted');
        } catch (error: any) {
            toast.error('Failed to delete user: ' + error.message);
        }
    };

    const handleDeleteEvent = async (eventId: string) => {
        if (!confirm('Are you sure you want to delete this event?')) return;

        try {
            const { error } = await supabase
                .from('events')
                .delete()
                .eq('id', eventId);

            if (error) throw error;

            setEvents(events.filter(e => e.id !== eventId));
            toast.success('Event deleted successfully');
        } catch (error: any) {
            toast.error('Failed to delete event: ' + error.message);
        }
    };

    // Calculate stats
    const stats = {
        totalUsers: users.length,
        totalEvents: events.length,
        activeEvents: events.filter(e => e.status === 'published').length,
        pendingEvents: events.filter(e => e.status === 'draft').length,
    };

    if (loading) {
        return (
            <div className="animate-pulse space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                    ))}
                </div>
                <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Admin Dashboard</h1>
                <p className="text-gray-500 dark:text-gray-400">Manage users, events, and platform settings.</p>
            </div>

            <AdminStats {...stats} />

            <div>
                <div className="flex items-center gap-4 mb-6 border-b border-gray-200 dark:border-gray-700">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`pb-4 px-2 text-sm font-medium flex items-center gap-2 transition-colors relative
                            ${activeTab === 'users'
                                ? 'text-primary-600 dark:text-primary-400'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        <Users className="w-4 h-4" />
                        Users
                        {activeTab === 'users' && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600 dark:bg-primary-400 rounded-t-full" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('events')}
                        className={`pb-4 px-2 text-sm font-medium flex items-center gap-2 transition-colors relative
                            ${activeTab === 'events'
                                ? 'text-primary-600 dark:text-primary-400'
                                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                            }`}
                    >
                        <Calendar className="w-4 h-4" />
                        Events
                        {activeTab === 'events' && (
                            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-primary-600 dark:bg-primary-400 rounded-t-full" />
                        )}
                    </button>
                </div>

                {activeTab === 'users' ? (
                    <AdminUserList
                        users={users}
                        onUpdateRole={handleUpdateRole}
                        onDeleteUser={handleDeleteUser}
                    />
                ) : (
                    <AdminEventList
                        events={events}
                        onDeleteEvent={handleDeleteEvent}
                    />
                )}
            </div>
        </div>
    );
}
