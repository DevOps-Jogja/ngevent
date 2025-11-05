# Ngevent - Platform Manajemen Event Online

Platform manajemen event berbasis web yang memungkinkan penyelenggara untuk mengelola event mereka secara online dan memudahkan peserta untuk mendaftar dan berpartisipasi dalam berbagai event.

## 🚀 Fitur Utama

- ✅ **Pendaftaran Event**: Pengguna dapat mendaftar untuk berbagai event yang tersedia
- ✅ **Manajemen Event**: Penyelenggara dapat membuat, mengedit, dan menghapus event
- ✅ **Form Pendaftaran Kustom**: Formulir pendaftaran yang dapat disesuaikan untuk setiap event
- ✅ **Notifikasi Email**: Konfirmasi pendaftaran dan pengingat event otomatis
- ✅ **Kalender Event**: Tampilan kalender interaktif untuk melihat event
- ✅ **Statistik Event**: Laporan dan analisis tentang partisipasi event
- ✅ **Integrasi Media Sosial**: Mudah berbagi event di platform media sosial

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth (Google OAuth)
- **Hosting**: Cloudflare Pages
- **UI Components**: TailGrids & TailAdmin

## 📋 Prerequisites

- Node.js 18+ (recommended 20+)
- npm atau yarn
- Akun Supabase
- Google OAuth credentials (untuk authentication)

## 🔧 Installation

1. **Clone repository**

\`\`\`bash
git clone <repository-url>
cd ngevent
\`\`\`

2. **Install dependencies**

\`\`\`bash
npm install
\`\`\`

3. **Setup Environment Variables**

Buat file \`.env.local\` di root project:

\`\`\`env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
\`\`\`

4. **Setup Supabase Database**

Jalankan migration SQL yang ada di \`supabase/migrations/001_initial_schema.sql\` di Supabase SQL Editor:

- Buka Supabase Dashboard
- Pilih project Anda
- Buka SQL Editor
- Copy paste isi file migration
- Run query

5. **Setup Google OAuth di Supabase**

- Buka Supabase Dashboard → Authentication → Providers
- Enable Google provider
- Masukkan Google Client ID dan Client Secret
- Tambahkan redirect URL: \`https://your-project.supabase.co/auth/v1/callback\`

6. **Run Development Server**

\`\`\`bash
npm run dev
\`\`\`

Buka [http://localhost:3000](http://localhost:3000) di browser.

## 📁 Project Structure

\`\`\`
ngevent/
├── app/
│   ├── auth/
│   │   ├── login/          # Login page
│   │   └── callback/       # OAuth callback handler
│   ├── dashboard/          # Dashboard pages
│   │   └── events/
│   │       └── create/     # Create event page
│   ├── events/             # Public events pages
│   │   ├── page.tsx        # Events list
│   │   └── [id]/          # Event detail
│   ├── calendar/           # Calendar view
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Landing page
│   └── globals.css         # Global styles
├── lib/
│   ├── supabase.ts         # Supabase client
│   ├── database.types.ts   # Database type definitions
│   └── auth-context.tsx    # Auth context provider
├── supabase/
│   └── migrations/         # Database migrations
├── public/                 # Static assets
└── README.md
\`\`\`

## 🗄️ Database Schema

### Tables

- **profiles**: User profiles dengan role (participant/organizer)
- **events**: Event information dan details
- **registrations**: Event registrations dari users
- **form_fields**: Custom form fields untuk setiap event

### Row Level Security (RLS)

Semua tables dilengkapi dengan RLS policies untuk security:
- Users hanya bisa update profile mereka sendiri
- Organizers hanya bisa manage events mereka sendiri
- Published events visible untuk semua orang
- Registration data protected per user

## 🚢 Deployment

### Deploy ke Cloudflare Pages

1. **Build project**

\`\`\`bash
npm run build
\`\`\`

2. **Connect ke Cloudflare Pages**

- Login ke Cloudflare Dashboard
- Buat new project dari GitHub repository
- Set build command: \`npm run build\`
- Set build output directory: \`.next\`
- Add environment variables

3. **Configure Environment Variables**

Tambahkan di Cloudflare Pages settings:
- \`NEXT_PUBLIC_SUPABASE_URL\`
- \`NEXT_PUBLIC_SUPABASE_ANON_KEY\`
- \`NEXT_PUBLIC_SITE_URL\`

## 📝 Usage Guide

### Untuk Peserta (Participant)

1. Login dengan Google Account
2. Browse events di halaman Events atau Calendar
3. Klik event yang menarik untuk melihat detail
4. Isi form pendaftaran
5. Terima konfirmasi email
6. Lihat registered events di Dashboard

### Untuk Penyelenggara (Organizer)

1. Login dengan Google Account
2. Switch role ke "Organizer" di Dashboard
3. Klik "Create Event" untuk membuat event baru
4. Isi informasi event (judul, deskripsi, tanggal, lokasi, dll)
5. Tambahkan custom form fields untuk registration
6. Publish event
7. Monitor registrations di Dashboard
8. Lihat statistik event

## 🔐 Security Features

- ✅ Google OAuth authentication
- ✅ Row Level Security (RLS) di Supabase
- ✅ Protected routes untuk authenticated users
- ✅ Input validation dan sanitization
- ✅ HTTPS only in production
- ✅ Environment variables untuk sensitive data

## 🎨 UI Components

- **Landing Page**: TailGrids components
- **Dashboard**: TailAdmin components
- **Forms**: Custom Tailwind CSS components
- **Calendar**: Custom calendar component dengan date-fns

## 🔄 Development Workflow

1. Buat feature branch dari \`main\`
2. Develop feature dengan testing
3. Commit dengan conventional commits
4. Create Pull Request
5. Review & Merge
6. Auto deploy ke production

## 📚 API Documentation

### Supabase Client Usage

\`\`\`typescript
import { supabase } from '@/lib/supabase';

// Fetch events
const { data, error } = await supabase
  .from('events')
  .select('*')
  .eq('status', 'published');

// Create event
const { data, error } = await supabase
  .from('events')
  .insert({ title: 'My Event', ... });
\`\`\`

## 🐛 Troubleshooting

### Error: "Cannot find module '@supabase/supabase-js'"

Solution:
\`\`\`bash
npm install @supabase/supabase-js
\`\`\`

### Error: Authentication not working

Solutions:
1. Check Google OAuth credentials
2. Verify redirect URLs in Google Console
3. Check Supabase Auth settings
4. Clear browser cache & cookies

### Error: Database connection failed

Solutions:
1. Verify Supabase URL and Anon Key
2. Check if database migrations are applied
3. Verify RLS policies are set correctly

## 🤝 Contributing

1. Fork repository
2. Create feature branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit changes (\`git commit -m 'Add some AmazingFeature'\`)
4. Push to branch (\`git push origin feature/AmazingFeature\`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Team

- Product Owner: [Nama]
- Tech Lead: [Nama]
- Developers: [Team]

## 📞 Support

Untuk bantuan dan pertanyaan:
- Email: support@ngevent.com
- Documentation: [Link to docs]
- Issue Tracker: [GitHub Issues]

## 🗺️ Roadmap

### Phase 1: MVP ✅
- [x] Basic authentication
- [x] Event CRUD
- [x] Registration system
- [x] Dashboard

### Phase 2: Core Features (In Progress)
- [ ] Email notifications
- [ ] Advanced calendar features
- [ ] Statistics & analytics

### Phase 3: Advanced Features
- [ ] Payment integration
- [ ] QR code check-in
- [ ] Mobile app
- [ ] Multi-language support

---

**Made with ❤️ by Ngevent Team**
