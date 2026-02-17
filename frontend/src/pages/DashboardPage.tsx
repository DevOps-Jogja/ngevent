import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '../lib/axios';
import { Calendar, CheckCircle, TrendingUp, Plus, Edit, Trash2, Users, MapPin, Eye, UserPlus, Copy, Megaphone, Shield } from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';
import { id } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import { parseToWIB } from '../lib/date-wib';

type Event = {
  id: string;
  title: string;
  description: string;
  start_date: string;
  startDate?: string;
  end_date: string;
  endDate?: string;
  location: string;
  status: string;
  category: string;
  price?: number;
  registration_fee?: number;
  registrationFee?: number;
  registrationCount?: number;
  registration_count?: number;
  max_participants?: number;
  capacity?: number;
  image_url?: string;
  imageUrl?: string;
  organizer_id?: string;
  organizerId?: string;
};

type Registration = {
  id: string;
  event_id: string;
  user_id?: string;
  status?: string;
  registered_at?: string;
  registration_data?: any;
  title?: string;
  start_date?: string;
  end_date?: string;
  location?: string;
  image_url?: string;
  event_status?: string;
};

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [effectiveRole, setEffectiveRole] = useState<'participant' | 'organizer'>('participant');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [registrationToCancel, setRegistrationToCancel] = useState<{ id: string; eventTitle: string } | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    document.title = 'Dashboard - NgEvent'
  }, [])

  // Handle tab state from navigation
  useEffect(() => {
    const state = location.state as { tab?: string } | null;
    if (state?.tab === 'organizer') {
      setEffectiveRole('organizer');
      // Clear the state to prevent re-triggering on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location])

  const safeFormatDateTime = (value?: string) => {
    if (!value) return '-';
    const date = parseToWIB(value);
    if (!date) return '-';
    return format(date, 'dd MMM yyyy, HH:mm', { locale: id });
  };

  // Fetch user's events (as organizer)
  const { data: myEvents = [], isLoading: loadingEvents } = useQuery<Event[]>({
    queryKey: ['my-events', user?.id],
    queryFn: async () => {
      const response = await apiClient.get('/api/events/mine');
      return response.data.events || response.data || [];
    },
    enabled: effectiveRole === 'organizer' && !!user,
  });

  // Fetch user's registrations (as participant)
  const { data: myRegistrations = [], isLoading: loadingRegistrations } = useQuery<Registration[]>({
    queryKey: ['my-registrations', user?.id],
    queryFn: async () => {
      const response = await apiClient.get('/api/registrations/my-events');
      return Array.isArray(response.data) ? response.data : [];
    },
    enabled: effectiveRole === 'participant' && !!user,
  });

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  // useEffect(() => {
  //   if (user?.role === 'admin' || user?.role === 'organizer') {
  //     console.log('Setting effectiveRole to organizer, user role:', user?.role);
  //     setEffectiveRole('organizer');
  //   } else {
  //     console.log('Setting effectiveRole to participant, user role:', user?.role);
  //     setEffectiveRole('participant');
  //   }
  // }, [user?.role]);

  // Log query state
  // useEffect(() => {
  //   console.log('Query state:', {
  //     effectiveRole,
  //     user: user?.id,
  //     enabled: effectiveRole === 'organizer' && !!user,
  //     myEventsLength: myEvents.length,
  //   });
  // }, [effectiveRole, user, myEvents]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-primary flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if no user (will redirect)
  if (!user) {
    return null;
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Selamat Pagi';
    if (hour < 18) return 'Selamat Siang';
    return 'Selamat Malam';
  };

  const displayName = user?.full_name || user?.email?.split('@')[0] || 'User';

  const loading = loadingEvents || loadingRegistrations;
  const eventsList = Array.isArray(myEvents) ? myEvents : [];
  const registrationsList = Array.isArray(myRegistrations) ? myRegistrations : [];

  // Calculate stats
  const totalEvents = effectiveRole === 'organizer' ? eventsList.length : registrationsList.length;
  const activeEvents = effectiveRole === 'organizer'
    ? eventsList.filter(e => e.status === 'published').length
    : registrationsList.filter(r => r.status === 'registered').length;
  const thisMonthEvents = totalEvents; // Simplified

  const stats = [
    {
      label: effectiveRole === 'organizer' ? 'Total Event' : 'Event Diikuti',
      value: totalEvents,
      subtext: effectiveRole === 'organizer' ? 'Event yang dibuat' : 'Sepanjang waktu',
      icon: <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />,
      gradient: 'from-blue-500 to-blue-600'
    },
    {
      label: 'Aktif',
      value: activeEvents,
      subtext: effectiveRole === 'organizer' ? 'Event terpublikasi' : 'Event mendatang',
      icon: <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-white" />,
      gradient: 'from-green-500 to-green-600'
    },
    {
      label: 'Bulan Ini',
      value: thisMonthEvents,
      subtext: 'Aktivitas baru',
      icon: <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-white" />,
      gradient: 'from-purple-500 to-purple-600'
    }
  ];

  const handleDeleteClick = (eventId: string, eventTitle: string) => {
    setEventToDelete({ id: eventId, title: eventTitle });
    setDeleteModalOpen(true);
  };

  const confirmDeleteEvent = async () => {
    if (!eventToDelete) return;
    try {
      setIsDeleting(true);
      await apiClient.delete(`/api/events/${eventToDelete.id}`);

      await queryClient.invalidateQueries({ queryKey: ['my-events', user?.id] });
      await queryClient.invalidateQueries({ queryKey: ['events'] });

      setDeleteModalOpen(false);
      setEventToDelete(null);
      alert('Event berhasil dihapus');
    } catch (error: any) {
      alert(error?.response?.data?.message || error?.message || 'Gagal menghapus event');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelRegistration = (registrationId: string, eventTitle: string) => {
    setRegistrationToCancel({ id: registrationId, eventTitle });
    setCancelModalOpen(true);
  };

  const confirmCancelRegistration = async () => {
    if (!registrationToCancel) return;
    try {
      setIsCancelling(true);
      await apiClient.delete(`/api/registrations/${registrationToCancel.id}`);

      await queryClient.invalidateQueries({ queryKey: ['my-registrations', user?.id] });
      await queryClient.invalidateQueries({ queryKey: ['events'] });

      setCancelModalOpen(false);
      setRegistrationToCancel(null);
      alert('Pendaftaran berhasil dibatalkan');
    } catch (error: any) {
      alert(error?.response?.data?.message || error?.message || 'Gagal membatalkan pendaftaran');
    } finally {
      setIsCancelling(false);
    }
  };

  const copyLink = (eventId: string) => {
    const url = `${window.location.origin}/event/${eventId}`;
    navigator.clipboard.writeText(url);
    // In real app, show toast notification
  };

  const idr = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

  const toNumberSafe = (value: unknown, fallback = 0) => {
    const n = typeof value === 'number' ? value : Number(value);
    return Number.isFinite(n) ? n : fallback;
  };

  const registrationEventTitle = (r: Registration) => (r as any).title || (r as any).event_title || 'Event';
  const registrationStart = (r: Registration) => (r as any).start_date || (r as any).startDate;
  const registrationLocation = (r: Registration) => (r as any).location || 'Online';
  const registrationImage = (r: Registration) => (r as any).image_url || (r as any).imageUrl;
  const registrationStatus = (r: Registration) => String((r as any).status || 'registered');

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-primary pb-12 pt-0">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 md:py-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {getGreeting()}, <span className="text-primary-600 dark:text-primary-400">{displayName}</span>
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              Kelola event dan aktivitas kamu
            </p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {user.role === 'admin' && (
              <Link
                to="/admin"
                className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:from-purple-700 hover:to-purple-800 transition-all text-sm font-medium shadow-sm hover:shadow-md"
              >
                <Shield className="w-4 h-4" />
                <span>Administrator</span>
              </Link>
            )}
            {(user.role === 'organizer' || user.role === 'admin') && (
              <Link
                to="/dashboard/registrations"
                className="group flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all text-sm font-medium shadow-sm hover:shadow-md"
              >
                <UserPlus className="w-4 h-4" />
                <span>Pendaftaran</span>
              </Link>
            )}
            {effectiveRole === 'organizer' && (
              <Link
                to="/events/create"
                className="group flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all text-sm font-medium shadow-sm hover:shadow-md"
              >
                <Plus className="w-4 h-4" />
                <span>Buat Event</span>
              </Link>
            )}

          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-8">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="relative overflow-hidden bg-white dark:bg-dark-card rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-800"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mt-2">{stat.value}</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{stat.subtext}</p>
                </div>
                <div className={`p-2 sm:p-3 rounded-xl ${stat.gradient} bg-gradient-to-br shadow-lg`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Role Switcher */}
        {(user?.role === 'admin' || user?.role === 'organizer') && (
          <div className="bg-white dark:bg-dark-card rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-100 dark:border-gray-800 mb-8">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Tampilan Dashboard</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pilih mode tampilan dashboard kamu</p>
              </div>

              <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-full sm:w-auto">
                <button
                  onClick={() => setEffectiveRole('participant')}
                  className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 ${effectiveRole === 'participant'
                    ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-black/5 dark:ring-white/5'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
                    }`}
                >
                  Sebagai Peserta
                </button>
                <button
                  onClick={() => setEffectiveRole('organizer')}
                  className={`flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-all duration-200 ${effectiveRole === 'organizer'
                    ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm ring-1 ring-black/5 dark:ring-white/5'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-200/50 dark:hover:bg-gray-700/50'
                    }`}
                >
                  Sebagai Organizer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Events List - Organizer View */}
        {effectiveRole === 'organizer' && (
          <div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Event Saya</h2>
            </div>

            {loading ? (
              <div className="space-y-6">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-dark-card rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 dark:border-gray-800 animate-pulse">
                    <div className="flex gap-4 sm:gap-6">
                      <div className="w-48 h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                      <div className="flex-1">
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : eventsList.length === 0 ? (
              <div className="bg-white dark:bg-dark-card rounded-xl sm:rounded-2xl shadow-sm p-8 sm:p-12 text-center border border-gray-100 dark:border-gray-800">
                <div className="w-14 h-14 sm:w-16 sm:h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Plus className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  Belum ada event
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                  Mulai buat event pertama dan mulai kelola peserta kamu
                </p>
                <Link
                  to="/events/create"
                  className="inline-flex items-center justify-center px-6 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors font-medium"
                >
                  Buat Event
                </Link>
              </div>
            ) : (
              <div className="grid gap-6">
                {eventsList.map((event) => (
                  <div
                    key={event.id}
                    className="group bg-white dark:bg-dark-card rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-800"
                  >
                    <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
                      {/* Image */}
                      <div className="w-full md:w-48 h-40 sm:h-48 md:h-auto flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 relative">
                        {(event.imageUrl || event.image_url) ? (
                          <img
                            src={event.imageUrl || event.image_url}
                            alt={event.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20">
                            <Calendar className="w-12 h-12 text-primary-300 dark:text-primary-700" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <span
                            className={`px-2.5 py-1 text-xs font-semibold rounded-lg backdrop-blur-md ${event.status === 'published'
                              ? 'bg-green-500/90 text-white'
                              : event.status === 'draft'
                                ? 'bg-yellow-500/90 text-white'
                                : 'bg-gray-500/90 text-white'
                              }`}
                          >
                            {event.status}
                          </span>
                        </div>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 flex flex-col">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div>
                            {event.category && (
                              <span className="text-xs font-medium text-primary-600 dark:text-primary-400 mb-1 block">
                                {event.category}
                              </span>
                            )}
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                              {event.title}
                            </h3>
                          </div>
                          <button
                            onClick={() => copyLink(event.id)}
                            className="p-2 text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
                            title="Copy Link"
                          >
                            <Copy className="w-5 h-5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            <span>{safeFormatDateTime(event.startDate || event.start_date)}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span>{event.location || 'Online'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <span>{event.registrationFee || event.registration_fee || event.price ? idr((event.registrationFee || event.registration_fee || event.price) as any) : 'Gratis'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Users className="w-4 h-4 flex-shrink-0" />
                            <span>
                              {toNumberSafe((event as any).registrationCount ?? (event as any).registration_count, 0)} / {event.capacity || event.max_participants || 100} peserta
                            </span>
                          </div>
                        </div>

                        <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/event/${event.id}`}
                              title="Lihat Detail"
                              className="p-2 text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-all shadow-sm hover:shadow-md"
                            >
                              <Eye className="w-5 h-5" />
                            </Link>
                            <Link
                              to={`/event/${event.id}/edit`}
                              title="Edit"
                              className="p-2 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-lg transition-all shadow-sm hover:shadow-md"
                            >
                              <Edit className="w-5 h-5" />
                            </Link>
                            <Link
                              to={`/dashboard/events/${event.id}/registrations`}
                              title="Pendaftar"
                              className="p-2 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/40 rounded-lg transition-all shadow-sm hover:shadow-md"
                            >
                              <UserPlus className="w-5 h-5" />
                            </Link>
                            <Link
                              to={`/dashboard/events/${event.id}/broadcast`}
                              title="Broadcast Email"
                              className="p-2 text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded-lg transition-all shadow-sm hover:shadow-md"
                            >
                              <Megaphone className="w-5 h-5" />
                            </Link>
                          </div>
                          <button
                            onClick={() => handleDeleteClick(event.id, event.title)}
                            title="Hapus"
                            className="p-2 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition-all shadow-sm hover:shadow-md"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Participant View */}
        {effectiveRole === 'participant' && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Event Yang Saya Ikuti</h2>
            {loadingRegistrations ? (
              <div className="space-y-6">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="bg-white dark:bg-dark-card rounded-xl sm:rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-100 dark:border-gray-800 animate-pulse">
                    <div className="flex gap-4 sm:gap-6">
                      <div className="w-48 h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                      <div className="flex-1">
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : registrationsList.length === 0 ? (
              <div className="bg-white dark:bg-dark-card rounded-xl sm:rounded-2xl shadow-sm p-8 sm:p-12 text-center border border-gray-100 dark:border-gray-800">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                  Belum ada Event yang diikuti
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                  Jelajahi event DevOps menarik dan daftar sekarang
                </p>
                <Link
                  to="/events"
                  className="inline-flex items-center justify-center px-6 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl transition-all font-medium shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                >
                  Jelajahi Event
                </Link>
              </div>
            ) : (
              <div className="grid gap-6">
                {registrationsList.map((r) => (
                  <div
                    key={r.id}
                    className="group bg-white dark:bg-dark-card rounded-xl sm:rounded-2xl p-3 sm:p-5 shadow-sm hover:shadow-md transition-all border border-gray-100 dark:border-gray-800"
                  >
                    <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
                      <div className="w-full md:w-48 h-40 sm:h-48 md:h-auto flex-shrink-0 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 relative">
                        {registrationImage(r) ? (
                          <img
                            src={registrationImage(r)}
                            alt={registrationEventTitle(r)}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20">
                            <Calendar className="w-12 h-12 text-primary-300 dark:text-primary-700" />
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-lg backdrop-blur-md bg-green-500/90 text-white">
                            {registrationStatus(r)}
                          </span>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0 flex flex-col">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight mb-2">
                          {registrationEventTitle(r)}
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Calendar className="w-4 h-4 flex-shrink-0" />
                            <span>{safeFormatDateTime(registrationStart(r))}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <MapPin className="w-4 h-4 flex-shrink-0" />
                            <span>{registrationLocation(r)}</span>
                          </div>
                        </div>

                        <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2">
                          <Link
                            to={`/event/${r.event_id}`}
                            className="inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors text-sm font-medium"
                          >
                            Lihat Detail Event
                          </Link>
                          {registrationStatus(r) === 'registered' && (
                            <button
                              onClick={() => handleCancelRegistration(r.id, registrationEventTitle(r))}
                              className="inline-flex items-center justify-center px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors text-sm font-medium"
                            >
                              Batalkan
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-card rounded-xl sm:rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Hapus Event</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Apakah kamu yakin ingin menghapus event <span className="font-semibold">{eventToDelete?.title}</span>? Aksi ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteModalOpen(false)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                Batal
              </button>
              <button
                onClick={confirmDeleteEvent}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Registration Modal */}
      {cancelModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-dark-card rounded-xl sm:rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-xl">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Batalkan Pendaftaran</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Apakah kamu yakin ingin membatalkan pendaftaran untuk event <span className="font-semibold">{registrationToCancel?.eventTitle}</span>? Kamu mungkin perlu mendaftar ulang jika ingin mengikuti event ini.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setCancelModalOpen(false)}
                disabled={isCancelling}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium"
              >
                Tidak
              </button>
              <button
                onClick={confirmCancelRegistration}
                disabled={isCancelling}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isCancelling ? 'Membatalkan...' : 'Ya, Batalkan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
