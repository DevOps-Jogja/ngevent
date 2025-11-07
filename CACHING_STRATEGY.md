# Caching Strategy Implementation

## Overview
Implementasi sistem caching untuk mengurangi request ke Supabase dengan menggunakan kombinasi:
- **LocalStorage** - Cache persistent untuk data yang jarang berubah
- **React Query** - In-memory caching dengan automatic revalidation
- **Automatic Cleanup** - Pembersihan cache otomatis untuk expired data

## Benefits
✅ **Mengurangi Request ke Supabase** - Data di-cache di browser  
✅ **Faster Page Load** - Data muncul instant dari cache  
✅ **Offline Support** - Data tetap tersedia saat reload  
✅ **Smart Invalidation** - Cache otomatis di-refresh saat data berubah  
✅ **Auto Cleanup** - Cache expired otomatis dibersihkan  

## Architecture

### 1. Cache Layers

#### Layer 1: LocalStorage (Persistent)
- Lifetime: Sampai expired atau manual clear
- Use case: Data yang jarang berubah
- Storage: Browser localStorage

#### Layer 2: React Query (In-Memory)
- Lifetime: Selama tab browser terbuka
- Use case: Data yang sering diakses
- Storage: JavaScript memory

### 2. Cache Duration

| Data Type | Duration | Reason |
|-----------|----------|--------|
| User Profile | 5 minutes | Jarang berubah |
| Event List | 2 minutes | Update moderate |
| Event Detail | 3 minutes | Update moderate |
| Registrations | 1 minute | Sering berubah |
| Notifications | 30 seconds | Real-time feel |
| Dashboard Stats | 5 minutes | Jarang berubah |

## Files Created

### 1. `/lib/cache-helpers.ts`
**Purpose**: Core caching utilities  
**Functions**:
```typescript
setCache<T>(key, data, duration)     // Save to localStorage
getCache<T>(key)                      // Get from localStorage
clearCache(key)                       // Clear specific key
clearCacheByPrefix(prefix)            // Clear by prefix
clearExpiredCache()                   // Clean all expired
invalidateRelatedCaches(type, id)     // Smart invalidation
getCacheStats()                       // Debug info
```

**Cache Keys**:
```typescript
CacheKeys.profile(userId)
CacheKeys.events(filter)
CacheKeys.eventDetail(eventId)
CacheKeys.userRegistrations(userId)
CacheKeys.eventRegistrations(eventId)
CacheKeys.notifications(userId)
CacheKeys.dashboardStats(userId)
CacheKeys.userEvents(userId)
```

### 2. `/hooks/useCachedQueries.ts`
**Purpose**: Custom React Query hooks dengan caching  
**Hooks**:

#### Query Hooks (Fetch Data)
```typescript
useProfile(userId)                    // User profile
useEvents(filter)                     // Event list
useEvent(eventId)                     // Single event
useUserEvents(userId)                 // User's created events
useUserRegistrations(userId)          // User's registrations
useEventRegistrations(eventId)        // Event's registrations
useNotifications(userId)              // User notifications
useDashboardStats(userId)             // Dashboard stats
```

#### Mutation Hooks (Modify Data)
```typescript
useCreateEvent()                      // Create new event
useUpdateEvent()                      // Update event
useDeleteEvent()                      // Delete event
useCreateRegistration()               // Register to event
useUpdateRegistration()               // Update registration
useUpdateProfile()                    // Update profile
```

### 3. `/lib/cache-cleanup.ts`
**Purpose**: Automatic cache cleanup  
**Functions**:
```typescript
initCacheCleanup()        // Auto cleanup every 5 minutes
manualCacheCleanup()      // Manual trigger
clearAllAppCaches()       // Clear all (debug)
```

### 4. `/components/CacheInitializer.tsx`
**Purpose**: Initialize cache cleanup on app mount  
**Usage**: Auto-imported in root layout

### 5. `/lib/auth-context.tsx` (Updated)
**Changes**: Added cache integration to profile loading

## Usage Examples

### Example 1: Fetch Events with Caching

**Before (Without Cache):**
```typescript
const [events, setEvents] = useState([]);

useEffect(() => {
    async function fetchEvents() {
        const { data } = await supabase
            .from('events')
            .select('*');
        setEvents(data);
    }
    fetchEvents();
}, []);
```
❌ Every page visit = new Supabase request  
❌ Slow loading  
❌ No caching  

**After (With Cache):**
```typescript
import { useEvents } from '@/hooks/useCachedQueries';

function MyComponent() {
    const { data: events, isLoading, error } = useEvents('upcoming');
    
    if (isLoading) return <div>Loading...</div>;
    if (error) return <div>Error loading events</div>;
    
    return (
        <div>
            {events?.map(event => (
                <EventCard key={event.id} event={event} />
            ))}
        </div>
    );
}
```
✅ First visit: Fetch from Supabase + cache  
✅ Revisit: Instant from cache  
✅ Auto refresh after 2 minutes  

### Example 2: Create Event with Auto Cache Invalidation

**Before:**
```typescript
const handleCreate = async (data) => {
    await supabase.from('events').insert(data);
    // Manual refetch needed
    fetchEvents();
};
```

**After:**
```typescript
import { useCreateEvent } from '@/hooks/useCachedQueries';

function CreateEventForm() {
    const createEvent = useCreateEvent();
    
    const handleSubmit = async (data) => {
        try {
            await createEvent.mutateAsync(data);
            // ✅ Cache automatically invalidated
            // ✅ Event list auto-refreshed
            toast.success('Event created!');
        } catch (error) {
            toast.error('Failed to create event');
        }
    };
    
    return <form onSubmit={handleSubmit}>...</form>;
}
```

### Example 3: Dashboard with Cached Stats

```typescript
import { useDashboardStats } from '@/hooks/useCachedQueries';

function Dashboard() {
    const { user } = useAuth();
    const { data: stats, isLoading } = useDashboardStats(user?.id);
    
    if (isLoading) return <Skeleton />;
    
    return (
        <div>
            <StatCard 
                title="My Events" 
                value={stats?.totalEvents || 0} 
            />
            <StatCard 
                title="Registrations" 
                value={stats?.totalRegistrations || 0} 
            />
        </div>
    );
}
```

## Cache Flow

### Read Flow (Fetch Data)
```
1. Component calls useEvents()
2. React Query checks in-memory cache
   - If found + fresh → Return from memory ⚡
   - If stale → Return stale + fetch new
3. Hook checks localStorage
   - If found + not expired → Return from localStorage 📦
4. Fetch from Supabase 🌐
5. Save to localStorage + React Query cache
6. Return data to component
```

### Write Flow (Modify Data)
```
1. Component calls mutation (e.g., createEvent)
2. Execute mutation to Supabase
3. On success:
   - Invalidate React Query cache
   - Clear related localStorage cache
   - Auto-refetch affected queries
4. UI updates with fresh data
```

### Cleanup Flow
```
1. App loads → initCacheCleanup() runs
2. Clear expired cache immediately
3. Setup interval (every 5 minutes):
   - Scan all localStorage items
   - Remove expired cache
   - Log stats (dev mode)
4. Before page unload:
   - Final cleanup
```

## Cache Invalidation Strategy

### When Event Created/Updated/Deleted:
```typescript
invalidateRelatedCaches('event', eventId);
```
**Clears**:
- All event lists (events:*)
- User events (user-events:*)
- Specific event detail

### When Registration Created/Updated:
```typescript
invalidateRelatedCaches('registration', eventId);
```
**Clears**:
- User registrations
- Event registrations
- Dashboard stats
- Event detail

### When Profile Updated:
```typescript
invalidateRelatedCaches('profile', userId);
```
**Clears**:
- User profile
- Dashboard stats

### On Logout:
```typescript
signOut() // in AuthContext
```
**Clears**:
- Profile cache
- User events
- User registrations
- Notifications
- Dashboard stats

## Performance Comparison

### Before Caching
```
Page Load:
1. Dashboard → 5 Supabase requests
2. Events Page → 1 request
3. Event Detail → 2 requests
4. Registrations → 1 request

Total: 9 requests per session
Response time: 200-500ms per request
```

### After Caching
```
First Visit:
1. Dashboard → 5 requests (cached for 5 min)
2. Events Page → 1 request (cached for 2 min)
3. Event Detail → 2 requests (cached for 3 min)

Revisit (within cache duration):
1. Dashboard → 0 requests ⚡ (from cache)
2. Events Page → 0 requests ⚡
3. Event Detail → 0 requests ⚡

Total: 9 requests (first) → 0 requests (cached)
Response time: <10ms (from cache)
```

## Monitoring & Debugging

### Check Cache Stats
Open browser console and run:
```javascript
// In development
import { manualCacheCleanup } from '@/lib/cache-cleanup';

manualCacheCleanup();
// Output: { total: 10, valid: 8, expired: 2, invalid: 0 }
```

### View Cached Data
```javascript
// In browser console
localStorage.getItem('events:upcoming')
localStorage.getItem('profile:user-id-123')
```

### Clear All Caches
```javascript
import { clearAllAppCaches } from '@/lib/cache-cleanup';

clearAllAppCaches();
// Output: 🧹 Cleared 15 cache items
```

### React Query DevTools
Already installed! Open page and press:
- **Ctrl/Cmd + Shift + K** - Toggle devtools
- View all queries, their status, and cached data

## Best Practices

### ✅ DO

1. **Use cached hooks for reads:**
   ```typescript
   const { data } = useEvents(); // ✅
   ```

2. **Use mutations for writes:**
   ```typescript
   const createEvent = useCreateEvent();
   await createEvent.mutateAsync(data); // ✅
   ```

3. **Let cache invalidate automatically:**
   ```typescript
   // After mutation, cache auto-invalidates ✅
   ```

4. **Check loading/error states:**
   ```typescript
   if (isLoading) return <Spinner />;
   if (error) return <Error />;
   ```

### ❌ DON'T

1. **Don't mix cached and non-cached queries:**
   ```typescript
   const { data } = useEvents(); // ✅ Cached
   const { data } = await supabase.from('events').select(); // ❌ Not cached
   ```

2. **Don't manually refetch after mutations:**
   ```typescript
   await createEvent.mutateAsync(data);
   refetch(); // ❌ Not needed, auto-invalidates
   ```

3. **Don't cache user-specific sensitive data:**
   ```typescript
   // Password, tokens, etc → Never cache ❌
   ```

## Troubleshooting

### Cache Not Working?

**Check 1**: Verify cache helpers imported
```typescript
import { useEvents } from '@/hooks/useCachedQueries';
```

**Check 2**: Check browser console for cache logs
```
📦 Events loaded from cache
```

**Check 3**: Verify localStorage enabled
```javascript
typeof localStorage !== 'undefined'
```

### Data Not Updating?

**Issue**: Cache showing stale data

**Solution 1**: Wait for cache expiration
- Profile: 5 minutes
- Events: 2 minutes

**Solution 2**: Force refetch
```typescript
const { refetch } = useEvents();
await refetch();
```

**Solution 3**: Clear cache manually
```typescript
import { clearCache, CacheKeys } from '@/lib/cache-helpers';

clearCache(CacheKeys.events('all'));
```

### Cache Size Too Large?

**Check**: Monitor localStorage usage
```javascript
const size = new Blob(Object.values(localStorage)).size;
console.log('Cache size:', size / 1024, 'KB');
```

**Solution**: Reduce cache duration in `/lib/cache-helpers.ts`
```typescript
export const CACHE_DURATION = {
    EVENTS: 1 * 60 * 1000, // 2 min → 1 min
}
```

## Migration Guide

### Migrating Existing Components

**Step 1**: Import cached hook
```typescript
import { useEvents } from '@/hooks/useCachedQueries';
```

**Step 2**: Replace useState + useEffect
```typescript
// Before
const [events, setEvents] = useState([]);
useEffect(() => {
    fetchEvents();
}, []);

// After
const { data: events, isLoading } = useEvents();
```

**Step 3**: Replace mutations
```typescript
// Before
const handleCreate = async (data) => {
    await supabase.from('events').insert(data);
    fetchEvents(); // Manual refetch
};

// After
const createEvent = useCreateEvent();
const handleCreate = async (data) => {
    await createEvent.mutateAsync(data);
    // Auto-invalidates and refetches
};
```

## Future Enhancements

### Planned Features
- [ ] Service Worker for offline support
- [ ] IndexedDB for larger cache storage
- [ ] Background sync for pending mutations
- [ ] Cache preloading on route prefetch
- [ ] Optimistic updates for instant UI
- [ ] Cache compression for large datasets

### Advanced Optimizations
- [ ] Differential updates (only sync changes)
- [ ] Cache warming on app load
- [ ] Smart prefetching based on user behavior
- [ ] Cache sharing via Broadcast Channel
- [ ] Server-side cache (Redis/Vercel KV)

## Resources
- [React Query Docs](https://tanstack.com/query/latest)
- [LocalStorage API](https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage)
- [Cache Patterns](https://web.dev/cache-api-quick-guide/)

## Support
If you encounter issues:
1. Check browser console for error messages
2. Clear all caches: `clearAllAppCaches()`
3. Hard refresh: Ctrl/Cmd + Shift + R
4. Check network tab for duplicate requests
