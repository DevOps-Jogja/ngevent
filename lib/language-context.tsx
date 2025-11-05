'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'id' | 'en';

interface LanguageContextType {
    language: Language;
    setLanguage: (lang: Language) => void;
    t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
    const [language, setLanguageState] = useState<Language>('id');

    useEffect(() => {
        // Load language from localStorage
        const savedLanguage = localStorage.getItem('language') as Language;
        if (savedLanguage) {
            setLanguageState(savedLanguage);
        }
    }, []);

    const setLanguage = (lang: Language) => {
        setLanguageState(lang);
        localStorage.setItem('language', lang);
    };

    const t = (key: string): string => {
        return translations[language][key] || key;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}

// Translations
const translations: Record<Language, Record<string, string>> = {
    id: {
        // Navigation
        'nav.home': 'Beranda',
        'nav.events': 'Event',
        'nav.calendar': 'Kalender',
        'nav.discover': 'Jelajahi',
        'nav.dashboard': 'Dashboard',
        'nav.login': 'Masuk',
        'nav.editProfile': 'Edit Profil',
        'nav.createEvent': 'Buat Event',
        'nav.signOut': 'Keluar',

        // Home
        'home.title': 'Event Terbaru',
        'home.subtitle': 'Jelajahi event-event menarik yang tersedia',
        'home.upcoming': 'Yang Akan Datang',
        'home.past': 'Masa Lampau',
        'home.loading': 'Memuat event...',
        'home.noUpcoming': 'Belum ada event yang akan datang',
        'home.noUpcomingDesc': 'Event baru akan segera hadir',
        'home.noPast': 'Belum ada event sebelumnya',
        'home.noPastDesc': 'Belum ada event yang telah berlalu',
        'home.viewAll': 'Lihat Semua Event',
        'home.free': 'GRATIS',
        'home.viewDetails': 'Lihat Detail →',

        // Event Detail
        'event.featured': '🌟 Unggulan',
        'event.in': 'di',
        'event.location': 'Lokasi',
        'event.aboutEvent': 'Tentang Event',
        'event.speakers': 'Pembicara',
        'event.registration': 'Pendaftaran',
        'event.registrationFee': 'Biaya Pendaftaran',
        'event.freeEvent': 'EVENT GRATIS',
        'event.completeProfile': 'Lengkapi Profil Anda',
        'event.completeProfileDesc': 'Anda harus melengkapi profil terlebih dahulu sebelum dapat mendaftar event. Pastikan Nama Lengkap dan Nomor Telepon sudah terisi.',
        'event.completeProfileNow': 'Lengkapi Profil Sekarang',
        'event.selectOption': 'Pilih...',
        'event.fileUploadSuccess': 'File berhasil diunggah',
        'event.uploading': 'Mengunggah...',
        'event.clickToUpload': 'Klik untuk unggah',
        'event.orDragDrop': 'atau seret dan lepas',
        'event.fileFormat': 'PNG, JPG, PDF (MAKS. 5MB)',
        'event.requestToJoin': 'Daftar Sekarang',
        'event.completeProfileFirst': 'Lengkapi Profil Dulu',
        'event.loginToRegister': 'Silakan masuk untuk mendaftar event ini',
        'event.alreadyRegistered': 'Sudah Terdaftar!',
        'event.registrationSuccess': 'Anda telah berhasil mendaftar untuk event ini. Kami akan mengirimkan email konfirmasi.',
        'event.registrationSuccessToast': 'Pendaftaran berhasil!',
        'event.registrationError': 'Gagal mendaftar event',
        'event.notFound': 'Event tidak ditemukan',
        'event.backToEvents': 'Kembali ke daftar event',

        // Discover
        'discover.title': 'Jelajahi Event',
        'discover.subtitle': 'Temukan event populer di sekitar Anda, jelajahi berdasarkan kategori, atau lihat kalender komunitas.',
        'discover.browseByCategory': 'Jelajahi Berdasarkan Kategori',
        'discover.events': 'event',

        // Events List
        'events.title': 'Temukan Event Menarik',
        'events.subtitle': 'Jelajahi berbagai event menarik dan daftar sekarang juga',
        'events.filterBy': 'Filtering by:',
        'events.search': 'Cari event...',
        'events.allCategories': 'Semua Kategori',
        'events.noEvents': 'Tidak ada event',
        'events.noEventsDesc': 'Belum ada event yang tersedia saat ini.',

        // Common
        'common.loading': 'Memuat...',
        'common.error': 'Terjadi kesalahan',
        'common.success': 'Berhasil',
        'common.cancel': 'Batal',
        'common.save': 'Simpan',
        'common.delete': 'Hapus',
        'common.edit': 'Edit',
        'common.back': 'Kembali',
        'common.viewDetails': 'Lihat Detail',
        'common.register': 'Daftar',
        'common.submit': 'Kirim',
        'common.close': 'Tutup',

        // Dashboard
        'dashboard.title': 'Dashboard',
        'dashboard.myEvents': 'Event Saya',
        'dashboard.createEvent': 'Buat Event Baru',
        'dashboard.editEvent': 'Edit Event',
        'dashboard.deleteEvent': 'Hapus Event',
        'dashboard.registrations': 'Pendaftaran',
        'dashboard.noEvents': 'Anda belum membuat event',
        'dashboard.createFirst': 'Buat event pertama Anda sekarang',
        'dashboard.published': 'Published',
        'dashboard.draft': 'Draft',
        'dashboard.viewRegistrations': 'Lihat Pendaftaran',
        'dashboard.registeredUsers': 'peserta terdaftar',

        // Calendar
        'calendar.title': 'Kalender Event',
        'calendar.subtitle': 'Lihat semua event dalam tampilan kalender',
        'calendar.today': 'Hari Ini',
        'calendar.month': 'Bulan',
        'calendar.week': 'Minggu',
        'calendar.day': 'Hari',
        'calendar.noEventsThisDay': 'Tidak ada event pada hari ini',

        // Profile
        'profile.title': 'Edit Profile',
        'profile.subtitle': 'Kelola informasi profil Anda',
        'profile.fullName': 'Nama Lengkap',
        'profile.email': 'Email',
        'profile.phone': 'Nomor Telepon',
        'profile.bio': 'Bio',
        'profile.photo': 'Foto Profil',
        'profile.uploadPhoto': 'Upload Foto',
        'profile.changePhoto': 'Ganti Foto',
        'profile.saving': 'Menyimpan...',
        'profile.saveChanges': 'Simpan Perubahan',
        'profile.saved': 'Profil berhasil disimpan!',

        // Auth
        'auth.login': 'Masuk',
        'auth.loginTitle': 'Masuk ke Akun Anda',
        'auth.loginSubtitle': 'Selamat datang kembali!',
        'auth.loginWithGoogle': 'Masuk dengan Google',
        'auth.loggingIn': 'Masuk...',
        'auth.loginError': 'Gagal masuk. Silakan coba lagi.',

        // Create/Edit Event
        'eventForm.createTitle': 'Buat Event Baru',
        'eventForm.editTitle': 'Edit Event',
        'eventForm.basicInfo': 'Informasi Dasar',
        'eventForm.eventTitle': 'Judul Event',
        'eventForm.description': 'Deskripsi',
        'eventForm.category': 'Kategori',
        'eventForm.selectCategory': 'Pilih Kategori',
        'eventForm.dateTime': 'Tanggal & Waktu',
        'eventForm.startDate': 'Tanggal Mulai',
        'eventForm.endDate': 'Tanggal Selesai',
        'eventForm.locationInfo': 'Informasi Lokasi',
        'eventForm.location': 'Lokasi',
        'eventForm.registrationInfo': 'Informasi Pendaftaran',
        'eventForm.registrationFee': 'Biaya Pendaftaran',
        'eventForm.maxParticipants': 'Maksimal Peserta',
        'eventForm.unlimited': 'Unlimited',
        'eventForm.imageUpload': 'Upload Gambar',
        'eventForm.uploadImage': 'Upload Gambar Event',
        'eventForm.changeImage': 'Ganti Gambar',
        'eventForm.speakers': 'Speakers',
        'eventForm.addSpeaker': 'Tambah Speaker',
        'eventForm.speakerName': 'Nama Speaker',
        'eventForm.speakerTitle': 'Jabatan',
        'eventForm.speakerBio': 'Bio Speaker',
        'eventForm.speakerPhoto': 'Foto Speaker',
        'eventForm.removeSpeaker': 'Hapus Speaker',
        'eventForm.customFields': 'Form Pendaftaran Kustom',
        'eventForm.addField': 'Tambah Field',
        'eventForm.fieldLabel': 'Label Field',
        'eventForm.fieldType': 'Tipe Field',
        'eventForm.required': 'Wajib Diisi',
        'eventForm.status': 'Status',
        'eventForm.draft': 'Draft',
        'eventForm.published': 'Published',
        'eventForm.creating': 'Membuat Event...',
        'eventForm.updating': 'Mengupdate Event...',
        'eventForm.create': 'Buat Event',
        'eventForm.update': 'Update Event',
        'eventForm.created': 'Event berhasil dibuat!',
        'eventForm.updated': 'Event berhasil diupdate!',

        // Registrations
        'registrations.title': 'Pendaftaran Event',
        'registrations.subtitle': 'Kelola peserta yang terdaftar',
        'registrations.total': 'Total Pendaftaran',
        'registrations.export': 'Export Data',
        'registrations.name': 'Nama',
        'registrations.email': 'Email',
        'registrations.phone': 'Telepon',
        'registrations.registeredAt': 'Tanggal Daftar',
        'registrations.status': 'Status',
        'registrations.approved': 'Disetujui',
        'registrations.pending': 'Pending',
        'registrations.rejected': 'Ditolak',
        'registrations.noRegistrations': 'Belum ada pendaftaran',
    },
    en: {
        // Navigation
        'nav.home': 'Home',
        'nav.events': 'Events',
        'nav.calendar': 'Calendar',
        'nav.discover': 'Discover',
        'nav.dashboard': 'Dashboard',
        'nav.login': 'Login',
        'nav.editProfile': 'Edit Profile',
        'nav.createEvent': 'Create Event',
        'nav.signOut': 'Sign Out',

        // Home
        'home.title': 'Latest Events',
        'home.subtitle': 'Explore interesting events available',
        'home.upcoming': 'Upcoming',
        'home.past': 'Past',
        'home.loading': 'Loading events...',
        'home.noUpcoming': 'No upcoming events',
        'home.noUpcomingDesc': 'New events coming soon',
        'home.noPast': 'No past events',
        'home.noPastDesc': 'No past events yet',
        'home.viewAll': 'View All Events',
        'home.free': 'FREE',
        'home.viewDetails': 'View Details →',

        // Event Detail
        'event.featured': '🌟 Featured',
        'event.in': 'in',
        'event.location': 'Location',
        'event.aboutEvent': 'About the Event',
        'event.speakers': 'Speakers',
        'event.registration': 'Registration',
        'event.registrationFee': 'Registration Fee',
        'event.freeEvent': 'FREE EVENT',
        'event.completeProfile': 'Complete Your Profile',
        'event.completeProfileDesc': 'You must complete your profile before registering for events. Make sure your Full Name and Phone Number are filled in.',
        'event.completeProfileNow': 'Complete Profile Now',
        'event.selectOption': 'Select...',
        'event.fileUploadSuccess': 'File uploaded successfully',
        'event.uploading': 'Uploading...',
        'event.clickToUpload': 'Click to upload',
        'event.orDragDrop': 'or drag and drop',
        'event.fileFormat': 'PNG, JPG, PDF (MAX. 5MB)',
        'event.requestToJoin': 'Request to Join',
        'event.completeProfileFirst': 'Complete Profile First',
        'event.loginToRegister': 'Please login to register for this event',
        'event.alreadyRegistered': 'Already Registered!',
        'event.registrationSuccess': 'You have successfully registered for this event. We\'ll send you a confirmation email.',
        'event.registrationSuccessToast': 'Registration successful!',
        'event.registrationError': 'Failed to register for event',
        'event.notFound': 'Event not found',
        'event.backToEvents': 'Back to event list',

        // Discover
        'discover.title': 'Discover Events',
        'discover.subtitle': 'Explore popular events near you, browse by category, or check out some of the great community calendars.',
        'discover.browseByCategory': 'Browse by Category',
        'discover.events': 'Events',

        // Events List
        'events.title': 'Find Interesting Events',
        'events.subtitle': 'Explore various interesting events and register now',
        'events.filterBy': 'Filtering by:',
        'events.search': 'Search events...',
        'events.allCategories': 'All Categories',
        'events.noEvents': 'No events',
        'events.noEventsDesc': 'No events available at this time.',

        // Common
        'common.loading': 'Loading...',
        'common.error': 'An error occurred',
        'common.success': 'Success',
        'common.cancel': 'Cancel',
        'common.save': 'Save',
        'common.delete': 'Delete',
        'common.edit': 'Edit',
        'common.back': 'Back',
        'common.viewDetails': 'View Details',
        'common.register': 'Register',
        'common.submit': 'Submit',
        'common.close': 'Close',

        // Dashboard
        'dashboard.title': 'Dashboard',
        'dashboard.myEvents': 'My Events',
        'dashboard.createEvent': 'Create New Event',
        'dashboard.editEvent': 'Edit Event',
        'dashboard.deleteEvent': 'Delete Event',
        'dashboard.registrations': 'Registrations',
        'dashboard.noEvents': 'You haven\'t created any events',
        'dashboard.createFirst': 'Create your first event now',
        'dashboard.published': 'Published',
        'dashboard.draft': 'Draft',
        'dashboard.viewRegistrations': 'View Registrations',
        'dashboard.registeredUsers': 'registered participants',

        // Calendar
        'calendar.title': 'Event Calendar',
        'calendar.subtitle': 'View all events in calendar view',
        'calendar.today': 'Today',
        'calendar.month': 'Month',
        'calendar.week': 'Week',
        'calendar.day': 'Day',
        'calendar.noEventsThisDay': 'No events on this day',

        // Profile
        'profile.title': 'Edit Profile',
        'profile.subtitle': 'Manage your profile information',
        'profile.fullName': 'Full Name',
        'profile.email': 'Email',
        'profile.phone': 'Phone Number',
        'profile.bio': 'Bio',
        'profile.photo': 'Profile Photo',
        'profile.uploadPhoto': 'Upload Photo',
        'profile.changePhoto': 'Change Photo',
        'profile.saving': 'Saving...',
        'profile.saveChanges': 'Save Changes',
        'profile.saved': 'Profile saved successfully!',

        // Auth
        'auth.login': 'Login',
        'auth.loginTitle': 'Login to Your Account',
        'auth.loginSubtitle': 'Welcome back!',
        'auth.loginWithGoogle': 'Login with Google',
        'auth.loggingIn': 'Logging in...',
        'auth.loginError': 'Login failed. Please try again.',

        // Create/Edit Event
        'eventForm.createTitle': 'Create New Event',
        'eventForm.editTitle': 'Edit Event',
        'eventForm.basicInfo': 'Basic Information',
        'eventForm.eventTitle': 'Event Title',
        'eventForm.description': 'Description',
        'eventForm.category': 'Category',
        'eventForm.selectCategory': 'Select Category',
        'eventForm.dateTime': 'Date & Time',
        'eventForm.startDate': 'Start Date',
        'eventForm.endDate': 'End Date',
        'eventForm.locationInfo': 'Location Information',
        'eventForm.location': 'Location',
        'eventForm.registrationInfo': 'Registration Information',
        'eventForm.registrationFee': 'Registration Fee',
        'eventForm.maxParticipants': 'Max Participants',
        'eventForm.unlimited': 'Unlimited',
        'eventForm.imageUpload': 'Upload Image',
        'eventForm.uploadImage': 'Upload Event Image',
        'eventForm.changeImage': 'Change Image',
        'eventForm.speakers': 'Speakers',
        'eventForm.addSpeaker': 'Add Speaker',
        'eventForm.speakerName': 'Speaker Name',
        'eventForm.speakerTitle': 'Title',
        'eventForm.speakerBio': 'Speaker Bio',
        'eventForm.speakerPhoto': 'Speaker Photo',
        'eventForm.removeSpeaker': 'Remove Speaker',
        'eventForm.customFields': 'Custom Registration Form',
        'eventForm.addField': 'Add Field',
        'eventForm.fieldLabel': 'Field Label',
        'eventForm.fieldType': 'Field Type',
        'eventForm.required': 'Required',
        'eventForm.status': 'Status',
        'eventForm.draft': 'Draft',
        'eventForm.published': 'Published',
        'eventForm.creating': 'Creating Event...',
        'eventForm.updating': 'Updating Event...',
        'eventForm.create': 'Create Event',
        'eventForm.update': 'Update Event',
        'eventForm.created': 'Event created successfully!',
        'eventForm.updated': 'Event updated successfully!',

        // Registrations
        'registrations.title': 'Event Registrations',
        'registrations.subtitle': 'Manage registered participants',
        'registrations.total': 'Total Registrations',
        'registrations.export': 'Export Data',
        'registrations.name': 'Name',
        'registrations.email': 'Email',
        'registrations.phone': 'Phone',
        'registrations.registeredAt': 'Registration Date',
        'registrations.status': 'Status',
        'registrations.approved': 'Approved',
        'registrations.pending': 'Pending',
        'registrations.rejected': 'Rejected',
        'registrations.noRegistrations': 'No registrations yet',
    },
};
