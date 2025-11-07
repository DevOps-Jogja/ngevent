# Notifications System

## Overview
Sistem notifikasi terintegrasi dengan Supabase yang secara otomatis membuat notifikasi untuk berbagai events seperti registrasi, update event, reminder, dan payment.

## Database Schema

### Table: `notifications`
```sql
- id: UUID (Primary Key)
- user_id: UUID (Foreign Key ke profiles)
- event_id: UUID (Foreign Key ke events, optional)
- type: ENUM ('registration', 'event_update', 'reminder', 'general', 'payment')
- title: TEXT
- message: TEXT
- read: BOOLEAN (default: false)
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

### Indexes
- `idx_notifications_user_id` - Fast lookup by user
- `idx_notifications_read` - Filter unread notifications
- `idx_notifications_created_at` - Sort by time
- `idx_notifications_user_read` - Combined filter

## Auto-Generated Notifications

### 1. Registration Notifications
**Trigger:** Ketika user register ke event

**For Organizer:**
```
Title: "New Registration"
Message: "Someone just registered for your event '{event_title}'"
Type: registration
```

**For Participant:**
```
Title: "Registration Confirmed"
Message: "You have successfully registered for '{event_title}'"
Type: registration
```

### 2. Event Update Notifications
**Trigger:** Ketika organizer update event details (title, date, location, status)

**For All Participants:**
```
Title: "Event Updated"
Message: "The event '{event_title}' has been updated by the organizer"
Type: event_update
```

### 3. Event Reminders
**Trigger:** Manual call via cron job (24 hours before event)

```sql
-- Run this query via cron job or scheduled function
SELECT create_event_reminders();
```

**For Organizer:**
```
Title: "Event Starting Soon"
Message: "Your event '{event_title}' will start in less than 24 hours"
Type: reminder
```

**For Participants:**
```
Title: "Event Reminder"
Message: "The event '{event_title}' will start soon!"
Type: reminder
```

## Manual Notifications

### Using Helper Functions

```typescript
import { 
  createNotification,
  createBulkNotifications,
  sendPaymentNotification,
  sendEventReminder 
} from '@/lib/notifications';

// 1. Create single notification
await createNotification({
  userId: 'user-uuid',
  type: 'general',
  title: 'Welcome!',
  message: 'Thanks for joining our platform',
  eventId: 'event-uuid' // optional
});

// 2. Create bulk notifications
await createBulkNotifications({
  userIds: ['user-1', 'user-2', 'user-3'],
  type: 'general',
  title: 'Announcement',
  message: 'We have exciting news!'
});

// 3. Send payment notification
await sendPaymentNotification(
  'user-uuid',
  'event-uuid',
  'Tech Conference 2025',
  'verified' // 'pending' | 'verified' | 'rejected'
);

// 4. Send event reminder to all participants
await sendEventReminder('event-uuid', 'Tech Conference 2025');
```

### Direct SQL Insert

```sql
-- Create notification via SQL
INSERT INTO notifications (user_id, type, title, message, event_id)
VALUES (
  'user-uuid',
  'general',
  'System Maintenance',
  'The platform will be under maintenance tomorrow',
  NULL
);
```

## Frontend Integration

### NotificationsCenter Component
Component sudah terintegrasi di dashboard dengan fitur:
- Real-time updates via Supabase Realtime
- Unread badge counter
- Mark as read functionality
- Clickable notifications (redirect to event page)
- Loading states
- Empty state

```tsx
// Already integrated in dashboard
<NotificationsCenter userId={userId} />
```

## Notification Types & Icons

| Type | Icon | Color | Use Case |
|------|------|-------|----------|
| `registration` | User Plus | Green | New registration or registration confirmed |
| `event_update` | Edit | Yellow | Event details changed |
| `reminder` | Clock | Blue | Event starting soon |
| `payment` | Dollar | Purple | Payment status updates |
| `general` | Info | Gray | General announcements |

## API Functions

### Client-Side (lib/notifications.ts)

```typescript
// Get unread count
const { count } = await getUnreadCount(userId);

// Mark as read
await markAsRead(notificationId);

// Mark all as read
await markAllAsRead(userId);

// Delete notification
await deleteNotification(notificationId);

// Delete all read notifications
await deleteReadNotifications(userId);
```

### Server-Side Functions

```sql
-- Create event reminders (run via cron)
SELECT create_event_reminders();

-- Cleanup old notifications (run weekly)
SELECT cleanup_old_notifications();
```

## Setup Instructions

### 1. Run Migration
```bash
# Apply the notifications table migration
psql -h your-db-host -U postgres -d your-db-name -f supabase/migrations/create_notifications_table.sql
```

Or via Supabase Dashboard:
1. Go to SQL Editor
2. Copy contents of `create_notifications_table.sql`
3. Run the SQL

### 2. Enable Realtime (Optional but Recommended)
```sql
-- Enable realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
```

### 3. Setup Cron Job for Reminders
Use Supabase Edge Functions or external cron:

```typescript
// Edge Function: send-reminders.ts
import { createClient } from '@supabase/supabase-js';

Deno.serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  // Call the SQL function
  const { error } = await supabase.rpc('create_event_reminders');

  return new Response(
    JSON.stringify({ success: !error }),
    { headers: { 'Content-Type': 'application/json' } }
  );
});
```

Schedule it to run daily via cron:
```bash
# Run at 9:00 AM daily
0 9 * * * curl https://your-project.supabase.co/functions/v1/send-reminders
```

## Row Level Security (RLS)

Sudah dikonfigurasi:
- ✅ Users can view their own notifications
- ✅ Users can update their own notifications (mark as read)
- ✅ Authenticated users can create notifications
- ✅ Users can delete their own notifications

## Maintenance

### Cleanup Old Notifications
Notifications older than 30 days (and already read) will be deleted.

```sql
-- Manual cleanup
SELECT cleanup_old_notifications();

-- Or via scheduled job (weekly)
```

### Monitor Notification Count
```sql
-- Check total notifications
SELECT COUNT(*) FROM notifications;

-- Check unread by user
SELECT user_id, COUNT(*) as unread_count
FROM notifications
WHERE read = false
GROUP BY user_id
ORDER BY unread_count DESC;

-- Check by type
SELECT type, COUNT(*) as count
FROM notifications
GROUP BY type;
```

## Testing

### Create Test Notifications
```typescript
// In browser console or test file
import { createNotification } from '@/lib/notifications';

// Test registration notification
await createNotification({
  userId: 'your-user-id',
  type: 'registration',
  title: 'Test Registration',
  message: 'This is a test notification',
  eventId: 'some-event-id'
});

// Check if it appears in NotificationsCenter
```

### Test Auto-Triggers
```sql
-- Test registration trigger
INSERT INTO registrations (event_id, user_id, status)
VALUES ('event-uuid', 'user-uuid', 'registered');

-- Check if notifications were created
SELECT * FROM notifications 
WHERE event_id = 'event-uuid'
ORDER BY created_at DESC;
```

## Troubleshooting

### Notifications not appearing?
1. Check RLS policies: `SELECT * FROM notifications WHERE user_id = 'your-id'` (as service role)
2. Check realtime subscription in browser console
3. Verify userId is correct in NotificationsCenter component

### Triggers not firing?
1. Check if triggers exist: `SELECT * FROM pg_trigger WHERE tgname LIKE '%notification%'`
2. Check function definitions: `\df create_*_notification`
3. Test manually: `SELECT create_registration_notification()`

### Performance issues?
1. Check indexes: `\di notifications`
2. Monitor query speed: `EXPLAIN ANALYZE SELECT * FROM notifications WHERE user_id = 'xxx'`
3. Run cleanup: `SELECT cleanup_old_notifications()`

## Future Enhancements

- [ ] Email notifications (via Supabase Edge Functions + SendGrid/Resend)
- [ ] Push notifications (via OneSignal/Firebase)
- [ ] SMS notifications for urgent reminders
- [ ] Notification preferences (user can choose which types to receive)
- [ ] Notification sounds/vibration
- [ ] Rich notifications with images/actions
- [ ] Notification history/archive page
- [ ] Digest emails (daily/weekly summary)
