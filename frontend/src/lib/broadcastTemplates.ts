export type BroadcastTemplate = {
    id: string;
    name: string;
    description: string;
    icon: string;
    subject: string;
    message: string;
};

import { parseToWIB } from './date-wib';

export const broadcastTemplates: BroadcastTemplate[] = [
    {
        id: 'reminder',
        name: 'Event Reminder',
        description: 'Pengingat event akan segera dimulai',
        icon: '⏰',
        subject: 'Reminder: {eventTitle} Besok!',
        message: `Halo {fullName},

Ini adalah pengingat bahwa event {eventTitle} akan berlangsung besok!

📅 Tanggal: {eventDate}
⏰ Waktu: {eventTime}
📍 Lokasi: {eventLocation}

Jangan lupa untuk:
✓ Datang 15 menit lebih awal
✓ Membawa alat tulis (jika diperlukan)

Kami sangat menantikan kehadiran Anda!

Sampai jumpa besok!

Salam,
Tim {eventTitle}`,
    },
    {
        id: 'starting-soon',
        name: 'Event Dimulai Segera',
        description: 'Notifikasi event akan dimulai dalam waktu dekat',
        icon: '🚀',
        subject: '{eventTitle} Dimulai 1 Jam Lagi!',
        message: `Halo {fullName},

Event {eventTitle} akan segera dimulai dalam 1 jam!

📍 Lokasi: {eventLocation}
⏰ Waktu Mulai: {eventTime}

Pastikan Anda sudah siap dan dalam perjalanan menuju lokasi.

Untuk informasi lebih lanjut, silakan hubungi panitia.

Sampai bertemu sebentar lagi!

Salam,
Tim {eventTitle}`,
    },
    {
        id: 'thank-you',
        name: 'Terima Kasih',
        description: 'Ucapan terima kasih setelah event selesai',
        icon: '🙏',
        subject: 'Terima Kasih Telah Menghadiri {eventTitle}',
        message: `Halo {fullName},

Terima kasih sudah hadir dan berpartisipasi dalam {eventTitle}!

Kami sangat senang Anda bisa bergabung dengan kami. Semoga event ini memberikan manfaat dan pengalaman berharga untuk Anda.

📸 Dokumentasi event: [link]
📄 Materi/Slides: [link]
📜 Sertifikat: [link]

Kami akan sangat menghargai feedback Anda:
📝 Survey Kepuasan: [link]

Jangan lupa untuk tetap terhubung dengan kami dan nantikan event-event menarik berikutnya!

Terima kasih & sampai jumpa lagi!

Salam,
Tim {eventTitle}`,
    },
    {
        id: 'venue-change',
        name: 'Perubahan Lokasi',
        description: 'Pemberitahuan perubahan lokasi event',
        icon: '📍',
        subject: 'PENTING: Perubahan Lokasi {eventTitle}',
        message: `Halo {fullName},

Kami ingin menginformasikan bahwa terdapat PERUBAHAN LOKASI untuk event {eventTitle}.

LOKASI BARU:
📍 [Nama Venue Baru]
📍 [Alamat Lengkap]
🗺️ [Link Google Maps]

📅 Tanggal: {eventDate}
⏰ Waktu: {eventTime}

Detail lainnya tetap sama seperti yang telah diinformasikan sebelumnya.

Mohon maaf atas ketidaknyamanan ini. Jika ada pertanyaan, silakan hubungi kami.

Terima kasih atas pengertiannya!

Salam,
Tim {eventTitle}`,
    },
    {
        id: 'cancellation',
        name: 'Pembatalan Event',
        description: 'Pemberitahuan pembatalan event',
        icon: '❌',
        subject: 'Pembatalan Event: {eventTitle}',
        message: `Halo {fullName},

Dengan berat hati kami informasikan bahwa event {eventTitle} yang dijadwalkan pada:

📅 Tanggal: {eventDate}
⏰ Waktu: {eventTime}
📍 Lokasi: {eventLocation}

DIBATALKAN karena [alasan pembatalan].

Untuk peserta yang telah melakukan pembayaran, dana akan dikembalikan dalam waktu 3-5 hari kerja ke rekening yang sama.

Kami mohon maaf atas ketidaknyamanan ini dan berharap dapat bertemu Anda di event kami berikutnya.

Jika ada pertanyaan, silakan hubungi kami di [kontak].

Terima kasih atas pengertiannya.

Salam,
Tim {eventTitle}`,
    },
    {
        id: 'update',
        name: 'Update Informasi',
        description: 'Update informasi penting terkait event',
        icon: '📢',
        subject: 'Update Penting: {eventTitle}',
        message: `Halo {fullName},

Kami ingin memberikan update penting terkait {eventTitle}:

[Tulis update informasi di sini]

Detail Event:
📅 Tanggal: {eventDate}
⏰ Waktu: {eventTime}
📍 Lokasi: {eventLocation}

Jika ada pertanyaan, jangan ragu untuk menghubungi kami.

Terima kasih!

Salam,
Tim {eventTitle}`,
    },
    {
        id: 'custom',
        name: 'Custom Template',
        description: 'Buat pesan custom Anda sendiri',
        icon: '✏️',
        subject: '',
        message: '',
    },
];

export function applyTemplate(
    template: BroadcastTemplate,
    event: {
        title: string;
        start_date?: string;
        startDate?: string;
        location?: string;
    }
): { subject: string; message: string } {
    const eventDate = event.start_date || event.startDate || '';
    const eventLocation = event.location || 'TBA';

    // Format date and time
    let eventDateFormatted = eventDate;
    let eventTimeFormatted = '';

    try {
        if (eventDate) {
            const date = parseToWIB(eventDate);
            if (date) {
                eventDateFormatted = date.toLocaleDateString('id-ID', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    timeZone: 'UTC',
                });
                eventTimeFormatted = date.toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'UTC',
                });
            }
        }
    } catch (e) {
        // Keep original if parsing fails
    }

    const replacements = {
        '{eventTitle}': event.title,
        '{eventDate}': eventDateFormatted,
        '{eventTime}': eventTimeFormatted,
        '{eventLocation}': eventLocation,
        // Note: {fullName} and {fullName} are NOT replaced here
        // They will be replaced by backend with actual participant names
    };

    let subject = template.subject;
    let message = template.message;

    // Replace all placeholders except fullName and fullName
    Object.entries(replacements).forEach(([placeholder, value]) => {
        subject = subject.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
        message = message.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
    });

    return { subject, message };
}
