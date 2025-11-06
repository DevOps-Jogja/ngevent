# Optimasi Koneksi Supabase

## 🚀 Masalah yang Diselesaikan
- Koneksi Supabase yang lemot
- Fetch data berulang-ulang yang tidak perlu
- Tidak ada caching
- Tidak ada connection pooling

## ✅ Solusi yang Diimplementasikan

### 1. **React Query Integration**
- Automatic caching dengan stale time 5 menit
- Background refetching
- Deduplicate requests
- Optimistic updates

### 2. **Custom Caching Layer** (`lib/supabase-optimized.ts`)
- In-memory cache untuk mengurangi network requests
- Configurable cache duration per resource
- Cache invalidation strategies

### 3. **Optimized Queries**
- Select specific fields saja (tidak select *)
- Batch fetching dengan Promise.all
- Pagination untuk list

### 4. **Connection Optimization**
- Auto refresh token
- Persistent session
- Request timeout handling
- Realtime events throttling

## 📖 Cara Penggunaan

### Menggunakan Custom Hooks (Recommended)

#### 1. Fetch Single Event
```typescript
import { useEvent } from '@/hooks/useSupabaseQuery';

function EventDetail({ eventId }: { eventId: string }) {
    const { data: event, isLoading, error } = useEvent(eventId);

    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;
    
    return <div>{event.title}</div>;
}
```

#### 2. Fetch Event dengan Relasi (Form Fields, Speakers, Organizer)
```typescript
import { useEventWithRelations } from '@/hooks/useSupabaseQuery';

function EventPage({ eventId }: { eventId: string }) {
    const { data, isLoading } = useEventWithRelations(eventId);

    if (isLoading) return <div>Loading...</div>;
    
    const { event, formFields, speakers, organizer } = data!;
    
    return (
        <div>
            <h1>{event.title}</h1>
            <p>By: {organizer.full_name}</p>
            {/* speakers, formFields available */}
        </div>
    );
}
```

#### 3. Fetch Events List dengan Pagination
```typescript
import { useEvents } from '@/hooks/useSupabaseQuery';

function EventsList() {
    const [page, setPage] = useState(0);
    const { data, isLoading } = useEvents(page, 10);

    if (isLoading) return <div>Loading...</div>;
    
    const { data: events, count } = data!;
    
    return (
        <div>
            {events.map(event => (
                <EventCard key={event.id} event={event} />
            ))}
            <button onClick={() => setPage(p => p + 1)}>Next</button>
        </div>
    );
}
```

#### 4. My Events (Dashboard)
```typescript
import { useMyEvents } from '@/hooks/useSupabaseQuery';

function Dashboard({ userId }: { userId: string }) {
    const { data: events, isLoading } = useMyEvents(userId);

    if (isLoading) return <div>Loading...</div>;
    
    return (
        <div>
            {events?.map(event => (
                <EventCard key={event.id} event={event} />
            ))}
        </div>
    );
}
```

#### 5. Create Event dengan Optimistic Update
```typescript
import { useCreateEvent } from '@/hooks/useSupabaseQuery';

function CreateEventForm() {
    const createEvent = useCreateEvent();

    const handleSubmit = async (formData: any) => {
        try {
            await createEvent.mutateAsync(formData);
            toast.success('Event created!');
            router.push('/dashboard');
        } catch (error) {
            toast.error('Failed to create event');
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            {/* form fields */}
            <button disabled={createEvent.isPending}>
                {createEvent.isPending ? 'Creating...' : 'Create Event'}
            </button>
        </form>
    );
}
```

#### 6. Update Event
```typescript
import { useUpdateEvent } from '@/hooks/useSupabaseQuery';

function EditEventPage({ eventId }: { eventId: string }) {
    const updateEvent = useUpdateEvent(eventId);

    const handleUpdate = async (updates: any) => {
        try {
            await updateEvent.mutateAsync(updates);
            toast.success('Event updated!');
        } catch (error) {
            toast.error('Failed to update');
        }
    };

    return (
        <form>
            {/* form */}
            <button onClick={() => handleUpdate(formData)}>
                Save Changes
            </button>
        </form>
    );
}
```

#### 7. Check Registration Status
```typescript
import { useRegistrationStatus } from '@/hooks/useSupabaseQuery';

function EventDetail({ eventId, userId }: { eventId: string; userId: string }) {
    const { data: isRegistered, isLoading } = useRegistrationStatus(eventId, userId);

    if (isLoading) return <div>Checking...</div>;
    
    return (
        <div>
            {isRegistered ? (
                <button disabled>Already Registered</button>
            ) : (
                <button>Register Now</button>
            )}
        </div>
    );
}
```

### Menggunakan Optimized Functions Langsung

```typescript
import { 
    getEventOptimized,
    getEventWithRelations,
    getEventsOptimized,
    clearCache
} from '@/lib/supabase-optimized';

// Fetch event
const event = await getEventOptimized(eventId);

// Fetch event dengan semua relasi
const { event, formFields, speakers, organizer } = await getEventWithRelations(eventId);

// Fetch events list dengan filter
const { data: events, count } = await getEventsOptimized(0, 10, 'Tech', 'workshop');

// Clear specific cache
clearCache('event_123');

// Clear all cache
clearCache();
```

### Debouncing untuk Auto-save

```typescript
import { debounce } from '@/lib/supabase-optimized';

const autoSave = debounce(async (data: any) => {
    await supabase
        .from('events')
        .update(data)
        .eq('id', eventId);
    toast.success('Auto-saved!');
}, 2000); // 2 seconds debounce

// Usage
<input onChange={(e) => {
    setFormData({...formData, title: e.target.value});
    autoSave({title: e.target.value}); // Will auto-save after 2s of no changes
}} />
```

## ⚡ Performance Improvements

### Before:
- ❌ Setiap page load = fetch baru
- ❌ Duplikasi request untuk data yang sama
- ❌ Tidak ada caching
- ❌ Fetch semua fields (SELECT *)
- ❌ Sequential fetching

### After:
- ✅ Data di-cache selama 5 menit
- ✅ Automatic request deduplication
- ✅ In-memory + React Query caching
- ✅ Select specific fields only
- ✅ Parallel fetching dengan Promise.all
- ✅ Background refetching
- ✅ Optimistic updates

## 📊 Expected Results

- **Initial Load**: 50-70% lebih cepat (cache hit)
- **Navigation**: 80-90% lebih cepat (data sudah di-cache)
- **Form Updates**: Instant dengan optimistic updates
- **Network Requests**: Berkurang hingga 60-70%

## 🔧 Configuration

Edit cache duration di `lib/supabase-optimized.ts`:

```typescript
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes default

// Atau per function
export async function getEventOptimized(eventId: string) {
    return getCached(`event_${eventId}`, async () => {
        // fetch logic
    }, 10 * 60 * 1000); // 10 minutes custom duration
}
```

Edit React Query stale time di `components/ReactQueryProvider.tsx`:

```typescript
staleTime: 5 * 60 * 1000, // 5 minutes
gcTime: 10 * 60 * 1000, // 10 minutes
```

## 🚨 Important Notes

1. **Cache Invalidation**: Otomatis di-handle oleh React Query mutations
2. **Realtime Updates**: Masih berfungsi, tapi throttled (2 events/second)
3. **Offline Support**: React Query support offline caching
4. **TypeScript**: Semua fully typed

## 🔄 Migration Guide

### Old Way:
```typescript
const [event, setEvent] = useState(null);

useEffect(() => {
    const fetchEvent = async () => {
        const { data } = await supabase
            .from('events')
            .select('*')
            .eq('id', eventId)
            .single();
        setEvent(data);
    };
    fetchEvent();
}, [eventId]);
```

### New Way:
```typescript
const { data: event, isLoading } = useEvent(eventId);
```

Lebih simple, lebih cepat, automatic caching! 🎉
