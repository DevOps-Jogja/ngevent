# Product Requirements Document (PRD)
# Ngevent - Platform Manajemen Event Online

## 1. Informasi Produk

### 1.1 Nama Produk
**Ngevent**

### 1.2 Deskripsi Produk
Ngevent adalah platform manajemen event berbasis web yang memungkinkan penyelenggara untuk mengelola event mereka secara online dan memudahkan peserta untuk mendaftar dan berpartisipasi dalam berbagai event.

### 1.3 Target Audiens
- **Penyelenggara Event**: Organisasi, perusahaan, komunitas, atau individu yang ingin menyelenggarakan event
- **Peserta Event**: Pengguna yang ingin mendaftar dan berpartisipasi dalam berbagai event

---

## 2. Tujuan Produk

### 2.1 Tujuan Bisnis
- Menyediakan solusi all-in-one untuk manajemen event online
- Meningkatkan efisiensi proses pendaftaran dan manajemen event
- Membangun ekosistem event yang terpusat dan mudah diakses

### 2.2 Tujuan Pengguna
- Memudahkan proses pendaftaran event untuk peserta
- Menyediakan tools yang lengkap untuk pengelola event
- Memberikan transparansi informasi event dan partisipasi

---

## 3. Fitur dan Spesifikasi

### 3.1 Fitur Utama

#### **F1: Pendaftaran Event**
**Deskripsi**: Pengguna dapat mendaftar untuk berbagai event yang tersedia di platform

**User Stories**:
- Sebagai peserta, saya ingin dapat melihat daftar event yang tersedia agar saya dapat memilih event yang menarik
- Sebagai peserta, saya ingin dapat mendaftar ke event dengan mudah agar saya dapat berpartisipasi
- Sebagai peserta, saya ingin menerima konfirmasi pendaftaran agar saya yakin pendaftaran saya berhasil

**Acceptance Criteria**:
- [x] Pengguna dapat melihat daftar semua event yang tersedia
- [x] Pengguna dapat melihat detail lengkap event (judul, deskripsi, tanggal, lokasi, kapasitas, dll)
- [x] Pengguna dapat melakukan pendaftaran ke event
- [x] Sistem menampilkan konfirmasi setelah pendaftaran berhasil
- [x] Sistem mencegah pendaftaran jika event sudah penuh
- [x] Pengguna dapat melihat riwayat pendaftaran mereka

**Priority**: P0 (Critical)

---

#### **F2: Manajemen Event**
**Deskripsi**: Penyelenggara event dapat membuat, mengedit, dan menghapus event mereka

**User Stories**:
- Sebagai penyelenggara, saya ingin dapat membuat event baru agar saya dapat mengelola event saya
- Sebagai penyelenggara, saya ingin dapat mengedit informasi event agar informasi selalu akurat
- Sebagai penyelenggara, saya ingin dapat menghapus event jika dibatalkan
- Sebagai penyelenggara, saya ingin dapat melihat daftar peserta yang terdaftar

**Acceptance Criteria**:
- [x] Penyelenggara dapat membuat event baru dengan informasi lengkap
- [x] Penyelenggara dapat mengedit informasi event yang sudah dibuat
- [x] Penyelenggara dapat menghapus event
- [x] Penyelenggara dapat melihat daftar peserta yang terdaftar
- [x] Penyelenggara dapat mengatur status event (draft, published, cancelled)
- [x] Penyelenggara dapat mengatur kapasitas maksimum peserta
- [x] Sistem melakukan validasi data event sebelum disimpan

**Priority**: P0 (Critical)

---

#### **F3: Form Pendaftaran Kustom**
**Deskripsi**: Formulir pendaftaran yang dapat disesuaikan untuk setiap event

**User Stories**:
- Sebagai penyelenggara, saya ingin dapat membuat form pendaftaran custom agar saya dapat mengumpulkan informasi spesifik yang diperlukan
- Sebagai peserta, saya ingin mengisi form pendaftaran yang relevan dengan event yang saya ikuti

**Acceptance Criteria**:
- [x] Penyelenggara dapat menambahkan field custom ke form pendaftaran
- [x] Tipe field yang didukung: text, email, number, textarea, select, checkbox, radio
- [x] Penyelenggara dapat menandai field sebagai required atau optional
- [x] Form pendaftaran ditampilkan sesuai konfigurasi penyelenggara
- [x] Sistem melakukan validasi input sesuai tipe field
- [x] Data form tersimpan dengan aman di database

**Priority**: P1 (High)

---

#### **F4: Notifikasi Email**
**Deskripsi**: Pengguna menerima notifikasi email untuk konfirmasi pendaftaran dan pengingat event

**User Stories**:
- Sebagai peserta, saya ingin menerima email konfirmasi setelah mendaftar agar saya memiliki bukti pendaftaran
- Sebagai peserta, saya ingin menerima reminder sebelum event dimulai agar saya tidak lupa
- Sebagai penyelenggara, saya ingin dapat mengirim announcement kepada peserta

**Acceptance Criteria**:
- [x] Email konfirmasi dikirim otomatis setelah pendaftaran berhasil
- [x] Email reminder dikirim 1 hari sebelum event
- [x] Email berisi informasi lengkap event (judul, tanggal, waktu, lokasi, dll)
- [x] Email memiliki desain yang profesional dan responsive
- [x] Penyelenggara dapat mengirim email custom ke semua peserta
- [x] Sistem menangani error pengiriman email dengan baik

**Priority**: P1 (High)

---

#### **F5: Kalender Event**
**Deskripsi**: Tampilan kalender untuk melihat event yang akan datang

**User Stories**:
- Sebagai pengguna, saya ingin melihat event dalam tampilan kalender agar saya dapat merencanakan jadwal
- Sebagai pengguna, saya ingin dapat filter event berdasarkan kategori atau tanggal

**Acceptance Criteria**:
- [x] Tampilan kalender menampilkan event dengan jelas
- [x] Pengguna dapat navigasi antar bulan
- [x] Klik pada event di kalender menampilkan detail event
- [x] Kalender menunjukkan status event (upcoming, ongoing, completed)
- [x] Kalender responsive untuk berbagai ukuran layar
- [x] Pengguna dapat filter event berdasarkan kategori

**Priority**: P1 (High)

---

#### **F6: Statistik Event**
**Deskripsi**: Laporan dan analisis tentang partisipasi dan pendapatan dari event

**User Stories**:
- Sebagai penyelenggara, saya ingin melihat statistik event saya agar saya dapat menganalisis performa
- Sebagai penyelenggara, saya ingin melihat trend pendaftaran agar saya dapat membuat keputusan yang lebih baik

**Acceptance Criteria**:
- [x] Dashboard menampilkan total pendaftaran per event
- [x] Grafik menampilkan trend pendaftaran dari waktu ke waktu
- [x] Statistik menampilkan tingkat attendance (jika tersedia check-in)
- [x] Data dapat diexport ke format CSV/Excel
- [x] Dashboard menampilkan overview semua event penyelenggara
- [x] Metrik: total peserta, tingkat konversi, revenue (jika event berbayar)

**Priority**: P2 (Medium)

---

#### **F7: Integrasi Media Sosial**
**Deskripsi**: Memudahkan berbagi event di platform media sosial

**User Stories**:
- Sebagai penyelenggara, saya ingin dapat membagikan event saya ke media sosial agar jangkauan lebih luas
- Sebagai peserta, saya ingin dapat membagikan event yang saya ikuti ke teman-teman saya

**Acceptance Criteria**:
- [x] Tombol share untuk Facebook, Twitter, LinkedIn, WhatsApp
- [x] Open Graph tags untuk preview yang menarik di media sosial
- [x] URL sharing yang clean dan user-friendly
- [x] Preview event yang menarik saat di-share
- [x] Deep linking untuk redirect ke halaman event

**Priority**: P2 (Medium)

---

### 3.2 Fitur Autentikasi

**Deskripsi**: Sistem autentikasi menggunakan Supabase Auth dengan Google OAuth

**Acceptance Criteria**:
- [x] Pengguna dapat login menggunakan Google Account
- [x] Session management yang aman
- [x] Role-based access control (Peserta vs Penyelenggara)
- [x] Logout functionality
- [x] Protected routes untuk halaman yang memerlukan autentikasi

**Priority**: P0 (Critical)

---

## 4. Spesifikasi Teknis

### 4.1 Tech Stack

#### Frontend
- **Framework**: Next.js (React-based)
- **Styling**: Tailwind CSS
- **UI Components**: 
  - Landing Page: [TailGrids](https://tailgrids.com/)
  - Dashboard: [TailAdmin](https://tailadmin.com/)
- **State Management**: React Context API / Zustand
- **HTTP Client**: Fetch API / Axios

#### Backend & Database
- **Backend as a Service**: Supabase
- **Database**: PostgreSQL (via Supabase)
- **Realtime**: Supabase Realtime
- **Storage**: Supabase Storage (untuk gambar event)

#### Authentication
- **Provider**: Supabase Auth
- **Method**: Google OAuth 2.0

#### Hosting & Deployment
- **Hosting**: Cloudflare Pages
- **Domain**: TBD
- **SSL**: Auto SSL via Cloudflare

### 4.2 Database Schema (Konseptual)

```sql
-- Users (managed by Supabase Auth)
-- Extended user profile
profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  full_name TEXT,
  role TEXT CHECK (role IN ('participant', 'organizer')),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
)

-- Events
events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organizer_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  location TEXT,
  image_url TEXT,
  capacity INTEGER,
  status TEXT CHECK (status IN ('draft', 'published', 'cancelled', 'completed')),
  category TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
)

-- Event Registrations
registrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  registration_data JSONB,
  status TEXT CHECK (status IN ('registered', 'attended', 'cancelled')),
  registered_at TIMESTAMP DEFAULT NOW()
)

-- Custom Form Fields
form_fields (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_type TEXT NOT NULL,
  is_required BOOLEAN DEFAULT false,
  options JSONB,
  order_index INTEGER
)
```

### 4.3 API Endpoints (via Supabase)

Menggunakan Supabase Client SDK untuk operasi CRUD:
- Events: `supabase.from('events').select()`, `.insert()`, `.update()`, `.delete()`
- Registrations: `supabase.from('registrations').select()`, `.insert()`
- Real-time subscriptions untuk update data

### 4.4 Security Requirements

- [x] Row Level Security (RLS) di Supabase
- [x] HTTPS only
- [x] Input sanitization
- [x] Rate limiting
- [x] CORS configuration
- [x] Environment variables untuk secrets

---

## 5. User Flow

### 5.1 Flow Peserta
1. Landing page → Browse events
2. Login dengan Google (jika belum login)
3. Klik event → Lihat detail
4. Klik "Daftar" → Isi form pendaftaran
5. Submit → Terima konfirmasi email
6. View dashboard → Lihat event yang terdaftar
7. Terima reminder email sebelum event

### 5.2 Flow Penyelenggara
1. Login dengan Google
2. Dashboard → Klik "Buat Event Baru"
3. Isi informasi event
4. Kustomisasi form pendaftaran
5. Publish event
6. Monitor pendaftaran di dashboard
7. Lihat statistik dan analytics
8. Kirim announcement ke peserta (optional)

---

## 6. UI/UX Requirements

### 6.1 Design Principles
- **Simple & Clean**: Interface yang mudah dipahami
- **Responsive**: Mobile-first design
- **Fast**: Loading time < 3 detik
- **Accessible**: WCAG 2.1 compliance

### 6.2 Key Screens
1. **Landing Page**: Hero section, featured events, categories
2. **Event List Page**: Grid/list view dengan filter dan search
3. **Event Detail Page**: Informasi lengkap event dengan CTA pendaftaran
4. **Registration Form**: Form dinamis sesuai konfigurasi
5. **User Dashboard**: Daftar event yang diikuti
6. **Organizer Dashboard**: Manajemen event dan statistik
7. **Calendar View**: Kalender interaktif

---

## 7. Success Metrics

### 7.1 Key Performance Indicators (KPIs)
- **User Acquisition**: Jumlah user baru per bulan
- **Event Creation**: Jumlah event baru yang dibuat per bulan
- **Registration Rate**: Persentase visitor yang mendaftar event
- **User Retention**: Percentage of users yang kembali
- **Page Load Time**: Average < 3 detik
- **Error Rate**: < 1% dari semua requests

### 7.2 Success Criteria (3 Bulan Pertama)
- Minimal 100 registered users
- Minimal 20 events created
- Minimal 500 event registrations
- User satisfaction rating > 4/5

---

## 8. Implementation Phases

### Phase 1: MVP (4-6 minggu)
- [x] Setup project (Next.js + Supabase)
- [x] Authentication (Google OAuth)
- [x] Basic Event CRUD
- [x] Event listing & detail page
- [x] Basic registration form
- [x] User & Organizer dashboard

### Phase 2: Core Features (3-4 minggu)
- [x] Custom form builder
- [x] Email notifications
- [x] Calendar view
- [x] Event categories & search
- [x] Image upload for events

### Phase 3: Advanced Features (3-4 minggu)
- [x] Statistics & analytics
- [x] Social media integration
- [x] Advanced filtering
- [x] Export functionality
- [x] Performance optimization

### Phase 4: Polish & Launch (2 minggu)
- [x] Testing (unit, integration, e2e)
- [x] Bug fixes
- [x] Performance optimization
- [x] Documentation
- [x] Deployment to production

---

## 9. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Supabase downtime | High | Implement caching, monitoring alerts |
| Email delivery issues | Medium | Use reliable email service, implement retry logic |
| Scalability issues | Medium | Optimize queries, implement pagination |
| Security vulnerabilities | High | Regular security audits, follow best practices |
| Browser compatibility | Low | Test on major browsers, use polyfills |

---

## 10. Future Enhancements (Post-Launch)

- [ ] Payment integration untuk event berbayar
- [ ] QR code untuk check-in event
- [ ] Mobile app (React Native)
- [ ] Multiple language support
- [ ] Advanced analytics dengan AI insights
- [ ] Integration dengan Google Calendar
- [ ] Ticketing system
- [ ] Live streaming integration
- [ ] Gamification (badges, leaderboard)
- [ ] Waitlist management

---

## 11. Dependencies & Assumptions

### Dependencies
- Supabase availability dan reliability
- Cloudflare Pages uptime
- Google OAuth service availability
- Email service provider

### Assumptions
- Pengguna memiliki Google Account
- Pengguna memiliki akses internet yang stabil
- Event sebagian besar berbasis online atau hybrid

---

## 12. Stakeholders

- **Product Owner**: [Nama]
- **Tech Lead**: [Nama]
- **Developers**: [Team]
- **Designers**: [Nama]
- **QA**: [Nama]

---

## 13. Approval & Sign-off

| Name | Role | Signature | Date |
|------|------|-----------|------|
|      | Product Owner |  |  |
|      | Tech Lead |  |  |
|      | Stakeholder |  |  |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2025-11-05 | AI Assistant | Initial PRD creation |

---

**Catatan**: Dokumen ini bersifat living document dan akan diupdate seiring perkembangan produk dan feedback dari stakeholders.
