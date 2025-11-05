# Event Registrations Management Page

## Overview
Halaman untuk organizer melihat dan mengelola semua peserta yang sudah melakukan registrasi pada event mereka.

## URL Structure
```
/dashboard/events/[event_id]/registrations
```

## Features

### 1. **Statistics Dashboard**
4 kartu statistik dengan icon dan warna berbeda:
- 📊 **Total**: Jumlah total registrasi (biru)
- ✅ **Registered**: Status terdaftar (hijau)
- 🎯 **Attended**: Status hadir (ungu)
- ❌ **Cancelled**: Status dibatalkan (merah)

### 2. **Search & Filter**
- **Search Bar**: Cari berdasarkan nama peserta atau ID registrasi
- **Status Filter Buttons**:
  - All (semua status)
  - Registered
  - Attended
  - Cancelled

### 3. **Registrations Table**
Tabel responsif dengan kolom:
- **Participant**: Avatar + nama + ID registrasi
- **Registered At**: Tanggal dan waktu pendaftaran
- **Status**: Badge status dengan warna sesuai
- **Actions**: Dropdown untuk ubah status + tombol view details

### 4. **Status Management**
Organizer bisa mengubah status registrasi:
- **Registered**: Baru mendaftar (default)
- **Attended**: Sudah hadir di event
- **Cancelled**: Dibatalkan

### 5. **Export to CSV**
- Tombol export data ke CSV
- Include semua data registrasi yang terfilter
- Format: ID, Name, Status, Registered At, Registration Data

### 6. **View Registration Details**
- Tombol eye icon untuk lihat detail registrasi
- Menampilkan semua data form yang diisi peserta
- Format JSON di alert (bisa dikembangkan jadi modal)

### 7. **Security**
- Auth check: User harus login
- Ownership check: Hanya organizer event yang bisa akses
- Auto redirect jika unauthorized

## How to Access

### From Dashboard:
1. Login sebagai Organizer
2. Buka Dashboard
3. Klik tombol **"📋 Registrations"** pada event card

### Direct Link:
```
/dashboard/events/[your-event-id]/registrations
```

## UI Features

### Stats Cards
- Icon dengan background warna
- Angka besar dan prominent
- Auto-calculate dari data registrasi

### Search & Filter
- Real-time filtering
- Kombinasi search + status filter
- Clear visual feedback untuk filter aktif

### Table Design
- Responsive dengan horizontal scroll di mobile
- Hover effect pada rows
- Avatar dengan initial letter
- Status badges dengan warna sesuai
- Inline status dropdown untuk quick update

### Empty State
- Icon ilustrasi
- Pesan jelas sesuai kondisi (no data vs filtered)
- Suggest action

## Actions Available

### 1. Update Status
```typescript
updateRegistrationStatus(registrationId, 'attended')
```
- Dropdown select di kolom Actions
- Auto-save on change
- Toast notification success/error

### 2. View Details
```typescript
// Shows registration_data in alert
JSON.stringify(registration.registration_data, null, 2)
```
- Eye icon button
- Displays all form data
- Future: Can be modal dengan better formatting

### 3. Export CSV
```typescript
exportToCSV()
```
- Generates CSV from filtered data
- Auto-download with timestamp filename
- Format: registrations-[event-title]-[timestamp].csv

## Data Structure

### Registration with Profile:
```typescript
{
  id: string,
  event_id: string,
  user_id: string,
  status: 'registered' | 'attended' | 'cancelled',
  registered_at: string,
  registration_data: JSON,
  profiles: {
    full_name: string | null,
    avatar_url: string | null
  }
}
```

### CSV Export Columns:
1. Registration ID
2. Name
3. Status
4. Registered At
5. Registration Data (JSON string)

## Responsive Design

### Desktop (> 768px):
- Full table layout
- 4-column stats grid
- Horizontal filter buttons
- All columns visible

### Mobile (< 768px):
- Horizontal scroll table
- 1-column stats grid (stacked)
- Stacked search and filters
- Optimized touch targets

## Dark Mode Support
- ✅ Complete dark mode untuk semua elements
- ✅ Status badges dengan dark variants
- ✅ Table hover states
- ✅ Proper contrast dan readability

## Performance Considerations
- Data loaded once on mount
- Local state update untuk status changes
- Client-side filtering (fast)
- CSV generated on-demand

## Future Enhancements
1. Modal untuk view details (lebih baik dari alert)
2. Bulk actions (select multiple, change status semua)
3. Send email ke peserta
4. Print badges/certificates
5. Pagination untuk event dengan banyak peserta
6. Advanced filters (date range, registration data fields)
7. Charts/graphs untuk analytics

## Access Control
```typescript
// Check organizer ownership
if (eventData.organizer_id !== userId) {
  toast.error('Anda tidak memiliki akses ke halaman ini');
  router.push('/dashboard');
}
```

## Notes
- Real-time updates belum implemented (perlu polling atau websocket)
- Registration data ditampilkan as-is (JSON)
- Export CSV tanpa format khusus untuk registration_data
- Status change langsung save ke database
