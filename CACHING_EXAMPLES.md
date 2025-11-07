# Example: Migrating Dashboard to Use Caching

## Before (Without Caching)

### `/app/dashboard/page.tsx` (Old)
```typescript
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { supabase } from '@/lib/supabase';

export default function Dashboard() {
    const { user, profile } = useAuth();
    const [myEvents, setMyEvents] = useState([]);
    const [myRegistrations, setMyRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        async function fetchData() {
            setLoading(true);
            
            // Fetch user's events
            const { data: events } = await supabase
                .from('events')
                .select('*')
                .eq('organizer_id', user.id)
                .order('created_at', { ascending: false });
            
            setMyEvents(events || []);

            // Fetch user's registrations
            const { data: registrations } = await supabase
                .from('registrations')
                .select(`
                    *,
                    events (
                        id,
                        title,
                        date,
                        location
                    )
                `)
                .eq('user_id', user.id);
            
            setMyRegistrations(registrations || []);
            setLoading(false);
        }

        fetchData();
    }, [user]);

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <h1>My Events ({myEvents.length})</h1>
            <h1>My Registrations ({myRegistrations.length})</h1>
        </div>
    );
}
```

**Problems:**
- ❌ Fetches data on every page visit
- ❌ No caching
- ❌ Slow loading
- ❌ Multiple useState/useEffect
- ❌ Manual loading state management

## After (With Caching)

### `/app/dashboard/page.tsx` (New)
```typescript
'use client';

import { useAuth } from '@/lib/auth-context';
import { 
    useUserEvents, 
    useUserRegistrations 
} from '@/hooks/useCachedQueries';

export default function Dashboard() {
    const { user } = useAuth();
    
    // Fetch with automatic caching
    const { 
        data: myEvents, 
        isLoading: eventsLoading 
    } = useUserEvents(user?.id);
    
    const { 
        data: myRegistrations, 
        isLoading: regsLoading 
    } = useUserRegistrations(user?.id);

    const loading = eventsLoading || regsLoading;

    if (loading) return <div>Loading...</div>;

    return (
        <div>
            <h1>My Events ({myEvents?.length || 0})</h1>
            <h1>My Registrations ({myRegistrations?.length || 0})</h1>
        </div>
    );
}
```

**Benefits:**
- ✅ First visit: Fetch + cache (2 minutes)
- ✅ Revisit: Instant from cache
- ✅ Clean code (less boilerplate)
- ✅ Auto loading states
- ✅ Type-safe

## Performance Comparison

### Network Requests

**Without Caching:**
```
Visit 1: 2 requests (events + registrations)
Visit 2: 2 requests
Visit 3: 2 requests
Visit 4: 2 requests
Visit 5: 2 requests

Total: 10 requests
```

**With Caching:**
```
Visit 1: 2 requests → cached for 2 minutes
Visit 2: 0 requests (from cache) ⚡
Visit 3: 0 requests (from cache) ⚡
Visit 4: 0 requests (from cache) ⚡
Visit 5: 2 requests (cache expired, refetch)

Total: 4 requests (60% reduction)
```

### Loading Time

**Without Caching:**
- Every visit: 300-500ms (network request)

**With Caching:**
- First visit: 300-500ms (network request)
- Revisit: <10ms (from cache) **50x faster!**

## Example: Events Page with Filters

### Before
```typescript
'use client';

export default function EventsPage() {
    const [filter, setFilter] = useState('all');
    const [events, setEvents] = useState([]);

    useEffect(() => {
        async function fetchEvents() {
            let query = supabase.from('events').select('*');
            
            if (filter === 'upcoming') {
                query = query.gte('date', new Date().toISOString());
            }
            
            const { data } = await query;
            setEvents(data || []);
        }
        
        fetchEvents();
    }, [filter]);

    return (
        <div>
            <button onClick={() => setFilter('all')}>All</button>
            <button onClick={() => setFilter('upcoming')}>Upcoming</button>
            
            {events.map(event => <EventCard key={event.id} event={event} />)}
        </div>
    );
}
```

### After
```typescript
'use client';

import { useState } from 'react';
import { useEvents } from '@/hooks/useCachedQueries';

export default function EventsPage() {
    const [filter, setFilter] = useState<'all' | 'upcoming'>('all');
    
    // Automatically cached per filter
    const { data: events, isLoading } = useEvents(filter);

    if (isLoading) return <Spinner />;

    return (
        <div>
            <button onClick={() => setFilter('all')}>All</button>
            <button onClick={() => setFilter('upcoming')}>Upcoming</button>
            
            {events?.map(event => <EventCard key={event.id} event={event} />)}
        </div>
    );
}
```

**Magic:**
- Switching between "All" and "Upcoming" is instant if already cached
- Each filter has separate cache
- Auto-refetch when cache expires

## Example: Create Event with Auto Invalidation

### Before
```typescript
'use client';

export default function CreateEventPage() {
    const router = useRouter();
    
    const handleSubmit = async (data) => {
        const { error } = await supabase
            .from('events')
            .insert(data);
        
        if (error) {
            toast.error('Failed to create event');
            return;
        }
        
        // Need to manually clear/refetch caches
        toast.success('Event created!');
        router.push('/dashboard');
    };
    
    return <EventForm onSubmit={handleSubmit} />;
}
```

**Problem**: Dashboard still shows old data (no auto-refresh)

### After
```typescript
'use client';

import { useCreateEvent } from '@/hooks/useCachedQueries';

export default function CreateEventPage() {
    const router = useRouter();
    const createEvent = useCreateEvent();
    
    const handleSubmit = async (data) => {
        try {
            await createEvent.mutateAsync(data);
            
            // ✅ All event caches automatically invalidated
            // ✅ Dashboard will show new event instantly
            toast.success('Event created!');
            router.push('/dashboard');
        } catch (error) {
            toast.error('Failed to create event');
        }
    };
    
    return <EventForm onSubmit={handleSubmit} />;
}
```

**Benefits:**
- ✅ Cache auto-invalidated on success
- ✅ Dashboard auto-refreshes with new event
- ✅ Event list auto-refreshes
- ✅ No manual refetch needed

## Example: Optimistic UI Update

```typescript
'use client';

import { useUpdateRegistration } from '@/hooks/useCachedQueries';

export default function RegistrationCard({ registration }) {
    const updateRegistration = useUpdateRegistration();
    
    const handleApprove = async () => {
        try {
            await updateRegistration.mutateAsync({
                registrationId: registration.id,
                updates: { status: 'approved' }
            });
            
            // ✅ UI instantly updates
            // ✅ Cache invalidated
            // ✅ List auto-refreshes
            toast.success('Registration approved!');
        } catch (error) {
            toast.error('Failed to approve');
        }
    };
    
    return (
        <div>
            <p>Status: {registration.status}</p>
            <button 
                onClick={handleApprove}
                disabled={updateRegistration.isPending}
            >
                {updateRegistration.isPending ? 'Approving...' : 'Approve'}
            </button>
        </div>
    );
}
```

## Migration Checklist

### For Each Component:

- [ ] **Step 1**: Identify data fetching
  - Find `useEffect` with Supabase queries
  - Find `useState` for data/loading

- [ ] **Step 2**: Replace with cached hook
  - Import from `@/hooks/useCachedQueries`
  - Replace `useState` + `useEffect` with hook

- [ ] **Step 3**: Replace mutations
  - Import mutation hooks
  - Replace direct Supabase calls
  - Remove manual refetch logic

- [ ] **Step 4**: Update loading states
  - Use `isLoading` from hook
  - Remove manual loading state

- [ ] **Step 5**: Test
  - Verify data loads correctly
  - Check cache in localStorage
  - Verify auto-refresh after mutations

## Common Patterns

### Pattern 1: Conditional Fetch
```typescript
// Only fetch if user is logged in
const { data, isLoading } = useProfile(user?.id);
// Hook automatically skips if userId is undefined
```

### Pattern 2: Dependent Queries
```typescript
// Fetch event first, then registrations
const { data: event } = useEvent(eventId);
const { data: registrations } = useEventRegistrations(
    event ? event.id : undefined
);
```

### Pattern 3: Parallel Queries
```typescript
// Fetch multiple data sources simultaneously
const events = useUserEvents(user?.id);
const registrations = useUserRegistrations(user?.id);
const notifications = useNotifications(user?.id);

const loading = events.isLoading || 
                registrations.isLoading || 
                notifications.isLoading;
```

### Pattern 4: Manual Refetch
```typescript
const { data, refetch } = useEvents();

// Force refresh on button click
<button onClick={() => refetch()}>
    Refresh
</button>
```

### Pattern 5: Error Handling
```typescript
const { data, error, isLoading } = useEvents();

if (isLoading) return <Spinner />;
if (error) return <ErrorAlert message={error.message} />;
if (!data) return <EmptyState />;

return <EventList events={data} />;
```

## Testing Cache

### Test 1: Verify Cache Storage
```javascript
// After visiting dashboard
localStorage.getItem('user-events:your-user-id')
// Should show cached events array
```

### Test 2: Test Cache Expiration
```javascript
// Set short duration for testing
CACHE_DURATION.EVENTS = 10 * 1000; // 10 seconds

// Visit page → check cache
// Wait 15 seconds → cache should be gone
```

### Test 3: Test Invalidation
```javascript
// Create new event
// Check localStorage before: old event list
// Create event
// Check localStorage after: should be cleared
// Dashboard automatically refetches
```

## Next Steps
1. Migrate dashboard page
2. Migrate events page
3. Migrate event detail page
4. Migrate registration pages
5. Test thoroughly
6. Monitor cache performance
