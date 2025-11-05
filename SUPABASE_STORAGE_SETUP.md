# Supabase Storage Setup untuk Event Images

## Langkah Setup Storage Bucket

### 1. Buka Supabase Dashboard
- Login ke https://supabase.com
- Pilih project Anda

### 2. Buat Storage Bucket
1. Klik menu **Storage** di sidebar
2. Klik tombol **New Bucket**
3. Isi form:
   - **Name**: `events`
   - **Public bucket**: ✅ **CENTANG** (untuk public access)
   - **File size limit**: 5242880 (5MB)
   - **Allowed MIME types**: `image/jpeg,image/jpg,image/png,image/webp`
4. Klik **Create bucket**

### 3. Set Storage Policies (Optional - untuk kontrol lebih ketat)

Jika Anda ingin user hanya bisa upload/delete gambar mereka sendiri:

```sql
-- Policy: Allow authenticated users to upload
CREATE POLICY "Allow authenticated uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'events');

-- Policy: Allow public to view
CREATE POLICY "Allow public viewing"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'events');

-- Policy: Allow users to delete their own uploads
CREATE POLICY "Allow users to delete own uploads"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'events' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 4. Struktur Folder
Gambar akan diupload dengan struktur:
```
events/
  └── event-images/
      ├── [userId]-[timestamp].jpg
      ├── [userId]-[timestamp].png
      └── ...
```

### 5. Verifikasi Setup
Setelah setup, coba:
1. Buat event baru di aplikasi
2. Upload gambar
3. Cek di Storage bucket apakah file terupload
4. Cek di event apakah URL gambar tersimpan

## Format URL Gambar
URL publik format:
```
https://[project-id].supabase.co/storage/v1/object/public/events/event-images/[filename]
```

## Troubleshooting

### Error: "Bucket not found"
- Pastikan bucket sudah dibuat dengan nama `events`
- Refresh dashboard dan cek lagi

### Error: "Permission denied"
- Pastikan bucket sudah di-set sebagai **Public**
- Atau tambahkan policies yang sesuai

### Gambar tidak muncul
- Cek URL di browser
- Pastikan MIME type file didukung
- Cek file size tidak lebih dari 5MB
