# Perbaikan Performa Supabase - Dokumentasi Lengkap

## 🎯 Masalah yang Diidentifikasi

### 1. **N+1 Query Problem**
- Multiple sequential queries untuk load speakers per event
- Setiap event melakukan query terpisah untuk speakers-nya
- Contoh: 10 events = 11 queries (1 untuk events + 10 untuk speakers)

### 2. **Tidak Ada Error Handling & Retry**
- Query gagal tidak di-retry
- Tidak ada timeout handling
- Error tidak ter-handle dengan baik

### 3. **Penggunaan React Query Tidak Optimal**
- Mayoritas halaman masih menggunakan `useState` + `useEffect` manual
- Tidak ada automatic caching, retry, dan refetching
- Loading state management tidak optimal

### 4. **Client-Side Filtering**
- Fetch semua data dulu, baru filter di client
- Tidak efisien untuk dataset besar

### 5. **Empty Dependency Array**
- useEffect dengan dependency array kosong tidak re-fetch saat ada perubahan

## ✅ Solusi yang Diimplementasikan

### 1. **Optimized Supabase Queries dengan JOIN**

#### File: `lib/supabase-optimized.ts`

**Perbaikan:**
- ✅ Implementasi retry mechanism dengan exponential backoff
- ✅ Tambahkan timeout handling (15 detik)
- ✅ Error logging yang lebih baik
- ✅ JOIN query untuk menghindari N+1 problem

**Contoh Implementasi:**

```typescript
// BEFORE: N+1 Query Problem
const { data: events } = await supabase.from('events').select('*');
const eventsWithSpeakers = await Promise.all(
    events.map(async (event) => {
        const { data: speakers } = await supabase
            .from('speakers')
            .select('*')
            .eq('event_id', event.id); // Query per event!
        return { ...event, speakers };
    })
);

// AFTER: Single Query with JOIN
const { data: events } = await supabase
    .from('events')
    .select(`
        *,
        speakers (
            id,
            name,
            title,
            photo_url,
            order_index
        )
    `)
    .eq('status', 'published');
```

**Fungsi Baru:**
- `withRetry()` - Retry dengan exponential backoff
- `withTimeout()` - Timeout handling
- `getEventsWithSpeakers()` - Fetch events dengan speakers dalam 1 query
- `getCategoryCounts()` - Optimized category counting
- `getUpcomingEvents()` - Fetch upcoming events dengan JOIN
- `getUserRegistrations()` - User registrations dengan event details
- `getOrganizerEvents()` - Organizer events

### 2. **Enhanced React Query Configuration**

#### File: `components/ReactQueryProvider.tsx`

**Perbaikan:**
- ✅ Stale time: 2 menit (data dianggap fresh)
- ✅ Cache time: 10 menit (garbage collection)
- ✅ Retry: 3x dengan exponential backoff
- ✅ Refetch on reconnect: true
- ✅ Refetch on window focus: false (menghindari refetch tidak perlu)

```typescript
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 2 * 60 * 1000,
            gcTime: 10 * 60 * 1000,
            retry: 3,
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        },
    },
});
```

### 3. **New React Query Hooks**

#### File: `hooks/useSupabaseQuery.ts`

**Hooks Baru:**
- `useEventsWithSpeakers()` - Events dengan speakers (JOIN query)
- `useUpcomingEvents()` - Upcoming events dengan caching
- `useCategoryCounts()` - Category counts dengan caching
- `useMyRegistrations()` - User registrations dengan optimized query

**Contoh Penggunaan:**

```typescript
// BEFORE
const [events, setEvents] = useState([]);
const [loading, setLoading] = useState(true);

useEffect(() => {
    loadEvents();
}, []);

const loadEvents = async () => {
    try {
        const { data } = await supabase.from('events').select('*');
        // Multiple queries untuk speakers...
        setEvents(data);
    } catch (error) {
        console.error(error);
    } finally {
        setLoading(false);
    }
};

// AFTER
const { data: events = [], isLoading } = useEventsWithSpeakers();
// Automatic caching, retry, error handling!
```

### 4. **Refactored Pages**

#### ✅ **app/page.tsx** (Homepage)
- Menggunakan `useEventsWithSpeakers()` hook
- Menghilangkan manual state management
- Automatic retry dan caching

#### ✅ **app/events/page.tsx**
- Menggunakan `useEventsWithSpeakers()` dengan filtering
- Server-side filtering untuk category
- Client-side search untuk real-time feedback

#### ✅ **app/discover/page.tsx**
- Menggunakan `useCategoryCounts()` dan `useUpcomingEvents()`
- Parallel data fetching dengan React Query
- Loading state per hook, lebih granular

#### ✅ **app/dashboard/page.tsx**
- Menggunakan `useMyEvents()` dan `useMyRegistrations()`
- Query invalidation setelah delete/update
- Automatic refetch dengan React Query

## 📊 Hasil Perbaikan

### **Before:**
- ❌ 10+ queries untuk load 10 events dengan speakers
- ❌ Tidak ada retry jika gagal
- ❌ Harus manual refresh berkali-kali
- ❌ Loading lambat karena sequential queries
- ❌ Tidak ada caching

### **After:**
- ✅ 1 query untuk load events dengan speakers (JOIN)
- ✅ Automatic retry 3x dengan exponential backoff
- ✅ Timeout handling (15 detik)
- ✅ Smart caching (2 menit stale time)
- ✅ Parallel queries untuk multiple resources
- ✅ Automatic background refetch
- ✅ Loading state per resource

## 🔧 Konfigurasi

### **Retry Configuration:**
```typescript
MAX_RETRIES = 3
RETRY_DELAY = 1000ms (exponential backoff)
REQUEST_TIMEOUT = 15000ms (15 detik)
```

### **Cache Configuration:**
```typescript
CACHE_DURATION = 5 * 60 * 1000 (5 menit)
STALE_TIME = 2 * 60 * 1000 (2 menit)
GC_TIME = 10 * 60 * 1000 (10 menit)
```

## 🚀 Best Practices yang Diterapkan

1. **Use JOIN queries** untuk relasi one-to-many
2. **Implement retry logic** untuk network resilience
3. **Add timeout** untuk menghindari hanging requests
4. **Use React Query** untuk data fetching, caching, dan state management
5. **Cache data** untuk mengurangi network requests
6. **Parallel fetching** untuk multiple independent resources
7. **Error logging** untuk debugging
8. **Optimistic updates** untuk better UX

## 📝 Cara Menggunakan

### **1. Fetch Events dengan Speakers:**
```typescript
import { useEventsWithSpeakers } from '@/hooks/useSupabaseQuery';

function MyComponent() {
    const { data: events, isLoading, error } = useEventsWithSpeakers();
    
    if (isLoading) return <Loading />;
    if (error) return <Error message={error.message} />;
    
    return <EventList events={events} />;
}
```

### **2. Fetch dengan Filtering:**
```typescript
const { data: events } = useEventsWithSpeakers('Technology', 'React');
// Filters: category="Technology", search="React"
```

### **3. Cache Invalidation:**
```typescript
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

// After mutation
queryClient.invalidateQueries({ queryKey: ['events'] });
```

## 🔍 Monitoring

### **Check Performance:**
- Browser DevTools → Network tab
- Lihat jumlah queries ke Supabase
- Check response time
- Monitor error rate

### **Cache Status:**
- React Query DevTools (dapat diinstall)
- Monitor cache hits/misses
- Check stale/fresh status

## ⚠️ Catatan Penting

1. **Supabase RLS** - Pastikan Row Level Security sudah dikonfigurasi dengan benar
2. **API Limits** - Perhatikan rate limiting dari Supabase
3. **Cache Management** - Clear cache jika data tidak update: `clearCache(key)`
4. **Error Handling** - Selalu handle error dari query untuk UX yang baik
5. **Loading States** - Tampilkan loading indicator yang jelas

## 🔄 Migration Guide

### **Untuk Page Baru:**
```typescript
// 1. Import hook
import { useEventsWithSpeakers } from '@/hooks/useSupabaseQuery';

// 2. Use hook di component
const { data, isLoading, error } = useEventsWithSpeakers();

// 3. Handle states
if (isLoading) return <Loading />;
if (error) return <Error />;
return <YourComponent data={data} />;
```

### **Untuk Page Existing:**
1. Remove manual `useState` dan `setLoading`
2. Remove `useEffect` untuk data fetching
3. Replace dengan React Query hook
4. Handle `isLoading` dan `error` dari hook

## 📚 Referensi

- [React Query Documentation](https://tanstack.com/query/latest)
- [Supabase JOIN Queries](https://supabase.com/docs/guides/database/joins-and-nesting)
- [Exponential Backoff](https://en.wikipedia.org/wiki/Exponential_backoff)
- [N+1 Query Problem](https://restfulapi.net/rest-api-n-1-problem/)

## 📈 Future Improvements

- [ ] Implement React Query DevTools di development
- [ ] Add request deduplication
- [ ] Implement optimistic updates untuk mutations
- [ ] Add Suspense boundaries untuk better code splitting
- [ ] Implement infinite scroll dengan `useInfiniteQuery`
- [ ] Add background refresh strategies
- [ ] Implement prefetching untuk better UX

## 🐛 Known Issues & Fixes

### Issue: JOIN Query Error for Registrations
**Problem:** Supabase JOIN query untuk `getUserRegistrations` gagal dengan error kosong `{}`

**Root Cause:** Foreign key relationship mungkin tidak terdeteksi otomatis oleh Supabase PostgREST

**Solution:** Menggunakan separate queries instead of JOIN
- Query 1: Fetch registrations
- Query 2: Fetch events by IDs
- Combine data di client side
- Masih ter-cache dengan baik (1 menit cache)
- Lebih reliable dan compatible

**Code:**
```typescript
// Fetch registrations
const { data: registrations } = await supabase
    .from('registrations')
    .select('id, status, registered_at, payment_status, event_id')
    .eq('user_id', userId);

// Fetch events separately
const eventIds = registrations.map(r => r.event_id);
const { data: events } = await supabase
    .from('events')
    .select('id, title, description, ...')
    .in('id', eventIds);

// Combine using Map for O(n) performance
const eventsMap = new Map(events.map(e => [e.id, e]));
return registrations.map(reg => ({
    ...reg,
    events: eventsMap.get(reg.event_id)
}));
```

---

**Last Updated:** November 7, 2025
**Status:** ✅ Implemented & Fixed
**Impact:** 🚀 Significant performance improvement
