# Payment Proof Upload Setup

## Jalankan Migration SQL

Jalankan SQL berikut di Supabase SQL Editor untuk menambahkan kolom registration_fee:

```sql
-- Add registration_fee column to events table
ALTER TABLE events
ADD COLUMN registration_fee DECIMAL(10, 2) DEFAULT 0;

COMMENT ON COLUMN events.registration_fee IS 'Registration fee in IDR. 0 means free event.';
```

## Setup Storage untuk Payment Proofs

### 1. Buat Folder di Storage Bucket
Bucket `events` sudah ada, tinggal tambahkan folder untuk payment proofs:
- Buka Supabase Dashboard → Storage → events bucket
- Upload akan otomatis masuk ke folder `payment-proofs/`

### 2. Storage Policy sudah ada
Karena menggunakan bucket `events` yang sama, policy RLS sudah ada:
- Public access untuk read
- Authenticated users dapat upload

## Fitur yang Ditambahkan

### 1. **Form Create Event**
- Field "Registration Fee (IDR)" untuk set harga pendaftaran
- Jika 0 = event gratis
- Jika > 0 = event berbayar
- Hint untuk menambahkan field upload bukti pembayaran

### 2. **Custom Form Fields dengan Tipe File Upload**
- Tipe field baru: "File Upload" 
- Bisa digunakan untuk upload bukti pembayaran, CV, portfolio, dll
- Support: Images (PNG, JPG) dan PDF
- Max size: 5MB
- Auto upload ke Supabase Storage
- Preview untuk gambar
- Loading state saat upload

### 3. **Event Detail Page**
- Menampilkan harga registrasi (atau badge "FREE EVENT")
- Form registration dengan field upload file
- Drag & drop support
- Real-time upload progress
- Success indicator setelah upload

### 4. **Event List Page**
- Badge harga di setiap event card
- Hijau "FREE" untuk event gratis
- Orange dengan harga untuk event berbayar

## Cara Penggunaan

### Untuk Organizer:
1. Buka Dashboard → Create Event
2. Isi detail event
3. Set "Registration Fee" (contoh: 50000 untuk Rp 50.000)
4. Scroll ke "Registration Form"
5. Klik "Add Field"
6. Field Name: "Bukti Pembayaran"
7. Field Type: "File Upload"
8. Centang "Required"
9. Save event

### Untuk Participant:
1. Buka Event Detail
2. Lihat harga registrasi
3. Isi form registrasi
4. Upload bukti pembayaran (klik atau drag & drop)
5. Tunggu upload selesai (ada indicator)
6. Submit registration

## File Upload Flow

1. User pilih file → Preview muncul (untuk gambar)
2. File langsung auto-upload ke Supabase Storage
3. URL public disimpan di form data
4. Saat submit, URL disimpan di `registration_data` JSON
5. Organizer bisa lihat bukti pembayaran dari dashboard

## Storage Path Structure

```
events/
├── event-images/          (gambar event)
│   └── [userId]-[timestamp].ext
└── payment-proofs/        (bukti pembayaran)
    └── [userId]-[timestamp].ext
```

## Notes

- Upload file support: images (PNG, JPG, WEBP) dan PDF
- Max file size: 5MB (bisa diubah di code)
- File otomatis dapat public URL setelah upload
- Preview hanya untuk file gambar
- PDF akan menampilkan icon upload saja
