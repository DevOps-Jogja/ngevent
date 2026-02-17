import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { format, isValid, parseISO } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { Download, Search, Users } from 'lucide-react';
import { Mail } from 'lucide-react';

import apiClient from '../lib/axios';
import { useAuth } from '../contexts/AuthContext';
import { parseToWIB } from '../lib/date-wib';

type Event = {
    id: string;
    title: string;
    start_date?: string;
    startDate?: string;
    location?: string;
    status?: string;
    capacity?: number;
};

type RegistrationStatus = 'registered' | 'attended' | 'cancelled';

type Registration = {
    id: string;
    event_id: string;
    user_id: string;
    status: RegistrationStatus;
    registered_at: string;
    registration_data?: any;
    full_name?: string;
    email?: string;
    phone?: string;
    institution?: string;
};

type FormFieldApi = {
    id?: string;
    eventId?: string;
    event_id?: string;
    fieldName?: string;
    field_name?: string;
    fieldType?: string;
    field_type?: string;
    isRequired?: boolean;
    is_required?: boolean;
    options?: any;
    orderIndex?: number;
    order_index?: number;
};

type NormalizedFormField = {
    field_name: string;
    field_type: string;
    is_required: boolean;
    options: any;
    order_index: number;
};

function normalizeFormField(field: FormFieldApi): NormalizedFormField {
    const fieldName = (field.field_name ?? field.fieldName ?? '').toString();
    const fieldType = (field.field_type ?? field.fieldType ?? 'text').toString();
    const isRequired = Boolean(field.is_required ?? field.isRequired);
    const orderIndexRaw = field.order_index ?? field.orderIndex;
    const orderIndex = typeof orderIndexRaw === 'number' ? orderIndexRaw : Number(orderIndexRaw ?? 0);

    return {
        field_name: fieldName,
        field_type: fieldType,
        is_required: isRequired,
        options: field.options,
        order_index: Number.isFinite(orderIndex) ? orderIndex : 0,
    };
}

function formatFieldValue(value: any, fieldType: string): React.ReactNode {
    if (value == null || value === '') return '—';

    // Most file fields store a URL string.
    if (typeof value === 'string' && /^https?:\/\//i.test(value)) {
        return (
            <a
                href={value}
                target="_blank"
                rel="noreferrer"
                className="text-primary-600 dark:text-primary-400 hover:underline"
            >
                {fieldType === 'file' ? 'Lihat file' : 'Buka link'}
            </a>
        );
    }

    if (Array.isArray(value)) {
        return value.filter(Boolean).join(', ') || '—';
    }

    if (typeof value === 'object') {
        try {
            return JSON.stringify(value);
        } catch {
            return String(value);
        }
    }

    return String(value);
}

function safeFormatDateTime(value?: string) {
    if (!value) return '-';
    const date = parseToWIB(value);
    if (!date) return '-';
    return format(date, 'dd MMM yyyy, HH:mm', { locale: localeId });
}

function downloadCSV(filename: string, rows: Record<string, any>[]) {
    const headersSet = rows.reduce<Set<string>>((acc, row) => {
        Object.keys(row).forEach((k) => acc.add(k));
        return acc;
    }, new Set<string>());
    const headers = Array.from(headersSet);

    const escapeCsvValue = (val: any) => {
        const s = String(val ?? '');
        if (s.includes(',') || s.includes('"') || s.includes('\n')) {
            return `"${s.replace(/"/g, '""')}"`;
        }
        return s;
    };

    const lines: string[] = [headers.map(escapeCsvValue).join(',')];
    rows.forEach((row) => {
        const vals = headers.map((h) => escapeCsvValue(row[h]));
        lines.push(vals.join(','));
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + encodeURI(lines.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', csvContent);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

export default function DashboardEventRegistrationsPage() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { id: eventId } = useParams();

    const [filter, setFilter] = useState<'all' | RegistrationStatus>('all');
    const [search, setSearch] = useState('');

    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/login');
        }
    }, [authLoading, user, navigate]);

    useEffect(() => {
        if (!authLoading && user) {
            const allowed = user.role === 'admin' || user.role === 'organizer';
            if (!allowed) {
                navigate('/dashboard');
            }
        }
    }, [authLoading, user, navigate]);

    const { data: event, isLoading: eventLoading } = useQuery<Event | null>({
        queryKey: ['event', eventId],
        queryFn: async () => {
            if (!eventId) return null;
            const response = await apiClient.get(`/api/events/${eventId}`);
            return response.data.event || response.data;
        },
        enabled: !!eventId,
    });

    // Set document title based on event name
    useEffect(() => {
        if (event?.title) {
            document.title = `Pendaftaran ${event.title} - NgEvent`
        } else {
            document.title = 'Kelola Pendaftaran Event - NgEvent'
        }
    }, [event?.title])

    const { data: registrations = [], isLoading: regsLoading } = useQuery<Registration[]>({
        queryKey: ['event-registrations', eventId],
        queryFn: async () => {
            if (!eventId) return [];
            const response = await apiClient.get(`/api/registrations/event/${eventId}`);
            return Array.isArray(response.data) ? response.data : [];
        },
        enabled: !!eventId && !!user,
    });

    const { data: formFieldsRaw = [] } = useQuery<FormFieldApi[]>({
        queryKey: ['event-form-fields', eventId],
        queryFn: async () => {
            if (!eventId) return [];
            const res = await apiClient.get(`/api/form-fields/${eventId}`);
            return Array.isArray(res.data) ? res.data : [];
        },
        enabled: !!eventId && !!user,
        staleTime: 60_000,
    });

    const formFields = useMemo(() => {
        const normalized = (Array.isArray(formFieldsRaw) ? formFieldsRaw : [])
            .map(normalizeFormField)
            .filter((f) => Boolean(f.field_name));
        normalized.sort((a, b) => a.order_index - b.order_index);
        return normalized;
    }, [formFieldsRaw]);

    const updateStatusMutation = useMutation({
        mutationFn: async ({ registrationId, status }: { registrationId: string; status: RegistrationStatus }) => {
            const response = await apiClient.put(`/api/registrations/${registrationId}/status`, { status });
            return response.data as Registration;
        },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ['event-registrations', eventId] });
            await queryClient.invalidateQueries({ queryKey: ['registrations-count', eventId] });
        },
    });

    const parsedRegistrations = useMemo(() => {
        return registrations.map((r) => {
            let regData: any = r.registration_data;
            if (typeof regData === 'string') {
                try {
                    regData = JSON.parse(regData);
                } catch {
                    // ignore
                }
            }
            return { ...r, registration_data: regData };
        });
    }, [registrations]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return parsedRegistrations.filter((r) => {
            const statusOk = filter === 'all' ? true : r.status === filter;
            if (!statusOk) return false;
            if (!q) return true;

            const hay = [
                r.full_name,
                r.email,
                r.phone,
                r.institution,
                r.status,
                JSON.stringify(r.registration_data || {})
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();

            return hay.includes(q);
        });
    }, [parsedRegistrations, filter, search]);

    const counts = useMemo(() => {
        const total = parsedRegistrations.length;
        const registered = parsedRegistrations.filter((r) => r.status === 'registered').length;
        const attended = parsedRegistrations.filter((r) => r.status === 'attended').length;
        const cancelled = parsedRegistrations.filter((r) => r.status === 'cancelled').length;
        return { total, registered, attended, cancelled };
    }, [parsedRegistrations]);

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

    if (!user) return null;

    const loading = eventLoading || regsLoading;

    const exportCSV = () => {
        const rows = filtered.map((r) => {
            const data = (r.registration_data && typeof r.registration_data === 'object') ? r.registration_data : {};

            // Put custom fields first (ordered), then any remaining keys.
            const custom: Record<string, any> = {};
            for (const f of formFields) {
                custom[f.field_name] = data?.[f.field_name] ?? '';
            }

            const remaining: Record<string, any> = {};
            for (const [k, v] of Object.entries(data || {})) {
                if (!(k in custom)) remaining[k] = v;
            }

            return {
                'Registration ID': r.id,
                'Nama': r.full_name || '',
                'Email': r.email || '',
                'Telepon': r.phone || '',
                'Institusi': r.institution || '',
                'Status': r.status,
                'Registered At': safeFormatDateTime(r.registered_at),
                ...custom,
                ...remaining,
            };
        });

        const baseName = (event?.title || 'event').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        downloadCSV(`${baseName || 'event'}-registrations.csv`, rows);
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-dark-primary pb-12">
            <div className="mx-auto w-full max-w-6xl px-4 py-8 md:py-12">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pendaftaran Event</h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {event?.title ? event.title : 'Memuat event...'}
                            {event?.start_date || event?.startDate ? ` • ${safeFormatDateTime(event.startDate || event.start_date)}` : ''}
                            {event?.location ? ` • ${event.location}` : ''}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Link
                            to="/dashboard/registrations"
                            className="inline-flex items-center justify-center px-4 py-2 rounded-xl bg-white dark:bg-dark-card border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-dark-secondary transition"
                        >
                            Kembali
                        </Link>
                        <Link
                            to={`/dashboard/events/${eventId}/broadcast`}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white transition"
                        >
                            <Mail className="w-4 h-4" />
                            Broadcast
                        </Link>
                        <button
                            onClick={exportCSV}
                            disabled={loading || filtered.length === 0}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white transition disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            <Download className="w-4 h-4" />
                            Export CSV
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    <div className="bg-white dark:bg-dark-card rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{counts.total}</div>
                    </div>
                    <div className="bg-white dark:bg-dark-card rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Registered</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{counts.registered}</div>
                    </div>
                    <div className="bg-white dark:bg-dark-card rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Attended</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{counts.attended}</div>
                    </div>
                    <div className="bg-white dark:bg-dark-card rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                        <div className="text-xs text-gray-500 dark:text-gray-400">Cancelled</div>
                        <div className="text-2xl font-bold text-gray-900 dark:text-white">{counts.cancelled}</div>
                    </div>
                </div>

                <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 sm:p-5 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="md:col-span-2">
                            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Cari peserta</label>
                            <div className="relative">
                                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Nama / email / institusi"
                                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-secondary text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Status</label>
                            <select
                                value={filter}
                                onChange={(e) => setFilter(e.target.value as any)}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-secondary text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="all">Semua</option>
                                <option value="registered">Registered</option>
                                <option value="attended">Attended</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="bg-white dark:bg-dark-card rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 animate-pulse">
                                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-3"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="bg-white dark:bg-dark-card rounded-2xl shadow-sm p-10 text-center border border-gray-100 dark:border-gray-800">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Users className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Tidak ada pendaftaran</h3>
                        <p className="text-gray-500 dark:text-gray-400">Belum ada peserta yang mendaftar atau filter terlalu ketat.</p>
                    </div>
                ) : (
                    <div className="overflow-hidden bg-white dark:bg-dark-card rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead className="bg-gray-50 dark:bg-gray-800/60">
                                    <tr>
                                        <th className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 px-4 py-3">Peserta</th>
                                        <th className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 px-4 py-3">Custom Data</th>
                                        <th className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 px-4 py-3">Terdaftar</th>
                                        <th className="text-left text-xs font-semibold text-gray-600 dark:text-gray-300 px-4 py-3">Status</th>
                                        <th className="text-right text-xs font-semibold text-gray-600 dark:text-gray-300 px-4 py-3">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                    {filtered.map((r) => (
                                        <tr key={r.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                                            <td className="px-4 py-3">
                                                <div className="font-semibold text-gray-900 dark:text-white">{r.full_name || '—'}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{r.email || ''}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                    {[r.phone, r.institution].filter(Boolean).join(' • ') || '—'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {formFields.length === 0 ? (
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">—</div>
                                                ) : (
                                                    <div className="space-y-1">
                                                        {formFields.map((f) => (
                                                            <div key={f.field_name} className="text-sm text-gray-700 dark:text-gray-200">
                                                                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{f.field_name}:</span>{' '}
                                                                <span>{formatFieldValue(r.registration_data?.[f.field_name], f.field_type)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                                                {safeFormatDateTime(r.registered_at)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-lg ${r.status === 'registered'
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                    : r.status === 'attended'
                                                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                                                    }`}>
                                                    {r.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="inline-flex items-center gap-2">
                                                    <select
                                                        value={r.status}
                                                        onChange={(e) => updateStatusMutation.mutate({ registrationId: r.id, status: e.target.value as RegistrationStatus })}
                                                        disabled={updateStatusMutation.isPending}
                                                        className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-dark-secondary text-sm text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary-500"
                                                        aria-label="Update status"
                                                    >
                                                        <option value="registered">registered</option>
                                                        <option value="attended">attended</option>
                                                        <option value="cancelled">cancelled</option>
                                                    </select>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
