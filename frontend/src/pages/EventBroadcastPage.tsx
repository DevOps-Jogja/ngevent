import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import {
    ArrowLeft,
    Mail,
    Send,
    Users,
    Clock,
    CheckCircle,
    AlertCircle,
    Loader2,
    FileText
} from 'lucide-react';

import apiClient from '../lib/axios';
import { useAuth } from '../contexts/AuthContext';
import { broadcastTemplates, applyTemplate } from '../lib/broadcastTemplates';
import { parseToWIB } from '../lib/date-wib';

type Event = {
    id: string;
    title: string;
    start_date: string;
    startDate?: string;
    location?: string;
    status?: string;
    organizer_id?: string;
    organizerId?: string;
};

type BroadcastHistory = {
    id: string;
    eventId: string;
    event_id?: string;
    subject: string;
    message: string;
    sentAt: string;
    sent_at?: string;
    recipientCount: number;
    recipient_count?: number;
    status: 'sent' | 'failed' | 'pending';
};

export default function EventBroadcastPage() {
    const { eventId } = useParams<{ eventId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        document.title = 'Broadcast Event - NgEvent'
    }, [])

    const [subject, setSubject] = useState('');
    const [message, setMessage] = useState('');
    const [showPreview, setShowPreview] = useState(false);
    const [showTemplates, setShowTemplates] = useState(false);

    // Fetch event details
    const { data: event, isLoading: eventLoading } = useQuery({
        queryKey: ['event', eventId],
        queryFn: async () => {
            const response = await apiClient.get(`/api/events/${eventId}`);
            return response.data as Event;
        },
        enabled: !!eventId,
    });

    // Fetch participants count
    const { data: participantsData } = useQuery({
        queryKey: ['event-participants', eventId],
        queryFn: async () => {
            const response = await apiClient.get(`/api/registrations/event/${eventId}`);
            return Array.isArray(response.data) ? response.data : [];
        },
        enabled: !!eventId,
    });

    // Fetch broadcast history
    const { data: broadcastHistory } = useQuery<BroadcastHistory[]>({
        queryKey: ['broadcast-history', eventId],
        queryFn: async () => {
            try {
                const response = await apiClient.get(`/api/broadcast/${eventId}/broadcast-history`);
                return response.data;
            } catch (error) {
                // If endpoint fails, return empty array
                return [];
            }
        },
        enabled: !!eventId,
    });

    // Send broadcast mutation
    const sendBroadcastMutation = useMutation({
        mutationFn: async (data: { subject: string; message: string }) => {
            const response = await apiClient.post(`/api/broadcast/${eventId}/broadcast`, {
                subject: data.subject,
                message: data.message,
            });
            return response.data;
        },
        onSuccess: () => {
            alert('Broadcast email berhasil dikirim!');
            setSubject('');
            setMessage('');
        },
        onError: (error: any) => {
            const errorMessage = error.response?.data?.error || 'Gagal mengirim broadcast email';
            alert(errorMessage);
        },
    });

    // Check if user is the organizer or admin
    useEffect(() => {
        if (event && user) {
            const eventOrganizerId = event.organizerId || event.organizer_id;
            const isOrganizer = eventOrganizerId === user.id;
            const isAdmin = user.role === 'admin';

            if (!isOrganizer && !isAdmin) {
                alert('Anda tidak memiliki akses ke halaman ini');
                navigate(`/event/${eventId}`);
            }
        }
    }, [event, user, eventId, navigate]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!subject.trim() || !message.trim()) {
            alert('Subject dan message tidak boleh kosong');
            return;
        }

        if (window.confirm(`Kirim broadcast email ke ${participantsData?.length || 0} participants?`)) {
            sendBroadcastMutation.mutate({ subject, message });
        }
    };

    const participantCount = participantsData?.length || 0;

    if (eventLoading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
            </div>
        );
    }

    if (!event) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
                <div className="text-center">
                    <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                    <p className="text-gray-600 dark:text-gray-400">Event tidak ditemukan</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <div className="max-w-5xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <button
                        onClick={() => navigate(`/dashboard/events/${eventId}/registrations`)}
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Kembali ke Registrations
                    </button>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                    Broadcast Email
                                </h1>
                                <p className="text-gray-600 dark:text-gray-400">
                                    {event.title}
                                </p>
                            </div>
                            <div className="flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg">
                                <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                <span className="text-blue-900 dark:text-blue-300 font-semibold">
                                    {participantCount} Participants
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Compose Email Form */}
                    <div className="lg:col-span-2">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                            <div className="flex items-center gap-2 mb-6">
                                <Mail className="w-6 h-6 text-primary-600" />
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                    Compose Email
                                </h2>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                {/* Template Selector */}
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                            Gunakan Template
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setShowTemplates(!showTemplates)}
                                            className="text-sm text-primary-600 dark:text-primary-400 hover:underline flex items-center gap-1"
                                        >
                                            <FileText className="w-4 h-4" />
                                            {showTemplates ? 'Sembunyikan' : 'Pilih Template'}
                                        </button>
                                    </div>

                                    {showTemplates && (
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                                            {broadcastTemplates.map((template) => (
                                                <button
                                                    key={template.id}
                                                    type="button"
                                                    onClick={() => {
                                                        if (event) {
                                                            const applied = applyTemplate(template, event);
                                                            setSubject(applied.subject);
                                                            setMessage(applied.message);
                                                            setShowTemplates(false);
                                                        }
                                                    }}
                                                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-primary-500 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all text-left group"
                                                >
                                                    <div className="flex items-start gap-3">
                                                        <span className="text-2xl">{template.icon}</span>
                                                        <div className="flex-1">
                                                            <h4 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">
                                                                {template.name}
                                                            </h4>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                {template.description}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Subject */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Subject <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={subject}
                                        onChange={(e) => setSubject(e.target.value)}
                                        placeholder={`Reminder: ${event.title} is coming up!`}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        required
                                    />
                                </div>

                                {/* Message */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Message <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="Tulis pesan Anda di sini..."
                                        rows={10}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                                        required
                                    />
                                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                                        Pesan akan dikirim ke {participantCount} participants yang terdaftar
                                    </p>
                                    <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                                        💡 Tip: Gunakan <code className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">{'placeholder'}</code> seperti {'{firstName}'} untuk personalisasi
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowPreview(!showPreview)}
                                        className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        {showPreview ? 'Hide' : 'Show'} Preview
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={sendBroadcastMutation.isPending || participantCount === 0}
                                        className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {sendBroadcastMutation.isPending ? (
                                            <>
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                Sending...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="w-5 h-5" />
                                                Send Email
                                            </>
                                        )}
                                    </button>
                                </div>

                                {participantCount === 0 && (
                                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                                        <div className="flex items-start gap-3">
                                            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-sm text-yellow-800 dark:text-yellow-200 font-medium">
                                                    Tidak ada participants
                                                </p>
                                                <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                                                    Event ini belum memiliki participants yang terdaftar.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </form>

                            {/* Preview */}
                            {showPreview && (subject || message) && (
                                <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                        Email Preview
                                    </h3>
                                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                                        <div className="mb-4">
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                                                Subject:
                                            </p>
                                            <p className="text-lg font-semibold text-gray-900 dark:text-white">
                                                {subject || `Reminder: ${event.title} is coming up!`}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                                                Message:
                                            </p>
                                            <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                                                {message || 'Tulis pesan Anda di sini...'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Tips */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
                            <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-300 mb-4">
                                Tips
                            </h3>
                            <ul className="space-y-3 text-sm text-blue-800 dark:text-blue-200">
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    <span>Gunakan template untuk memudahkan penulisan</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    <span>Gunakan subject yang menarik dan jelas</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    <span>Sertakan informasi penting tentang event</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    <span>Pastikan pesan singkat dan mudah dipahami</span>
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                    <span>Cek preview sebelum mengirim</span>
                                </li>
                            </ul>
                        </div>

                        {/* Broadcast History */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Clock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Broadcast History
                                </h3>
                            </div>

                            {broadcastHistory && broadcastHistory.length > 0 ? (
                                <div className="space-y-3">
                                    {broadcastHistory.slice(0, 5).map((item) => (
                                        <div
                                            key={item.id}
                                            className="border border-gray-200 dark:border-gray-700 rounded-lg p-3"
                                        >
                                            <p className="font-medium text-gray-900 dark:text-white text-sm mb-1">
                                                {item.subject}
                                            </p>
                                            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                                                <span>
                                                    {(() => {
                                                        const d = parseToWIB(item.sentAt || item.sent_at);
                                                        return d ? format(d, 'dd MMM yyyy, HH:mm', { locale: localeId }) : '-';
                                                    })()}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Users className="w-3 h-3" />
                                                    {item.recipientCount || item.recipient_count || 0}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                                    Belum ada broadcast yang dikirim
                                </p>
                            )}
                        </div>

                        {/* Event Info */}
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                Event Info
                            </h3>
                            <div className="space-y-3 text-sm">
                                <div>
                                    <p className="text-gray-500 dark:text-gray-400 mb-1">Tanggal</p>
                                    <p className="text-gray-900 dark:text-white font-medium">
                                        {(() => {
                                            const d = parseToWIB(event.start_date);
                                            return d ? format(d, 'dd MMMM yyyy, HH:mm', { locale: localeId }) : '-';
                                        })()}
                                    </p>
                                </div>
                                {event.location && (
                                    <div>
                                        <p className="text-gray-500 dark:text-gray-400 mb-1">Lokasi</p>
                                        <p className="text-gray-900 dark:text-white font-medium">
                                            {event.location}
                                        </p>
                                    </div>
                                )}
                                <div>
                                    <p className="text-gray-500 dark:text-gray-400 mb-1">Status</p>
                                    <p className="text-gray-900 dark:text-white font-medium capitalize">
                                        {event.status || 'Active'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
