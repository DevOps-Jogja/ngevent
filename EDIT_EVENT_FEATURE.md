# Edit Event Feature

## Overview
Halaman edit event memungkinkan organizer untuk mengupdate informasi event yang sudah dibuat.

## Features

### 1. **Edit Event Details**
- Update event title, description
- Change dates (start & end)
- Modify location, category, capacity
- Update registration fee
- Change event status (draft/published/cancelled/completed)
- Update event image

### 2. **Edit Registration Form**
- Add new custom fields
- Edit existing fields (name, type, required status)
- Delete fields (soft delete)
- Reorder fields (by order_index)

### 3. **Security**
- Only event organizer can edit their own events
- Automatic redirect if user is not the organizer
- Auth check before loading data

### 4. **Image Management**
- Preview existing image
- Upload new image (replaces old one)
- Remove image option
- Same upload flow as create event

## URL Structure
```
/dashboard/events/[event_id]/edit
```

## Access Control
1. User must be logged in
2. User must be the event organizer
3. Event must exist

## How to Use

### For Organizers:
1. Go to **Dashboard**
2. Find your event in "My Events" list
3. Click **"Edit"** button
4. Make your changes
5. Click **"Update Event"**

### Button Location:
Dashboard → My Events → Each event card has "Edit" and "View" buttons

## Technical Details

### Data Loading:
- Loads event data by ID
- Checks organizer ownership
- Formats dates for datetime-local input
- Loads existing form fields with order

### Form Fields Update:
- **Existing fields**: Updates via field.id
- **New fields**: Inserts without ID
- **Deleted fields**: Tracks in deletedFieldIds array, bulk delete on submit

### Image Update:
- If new file selected → Upload new image → Update image_url
- If no new file → Keep existing image_url
- If image removed → Set image_url to empty string

## Database Operations

### Update Event:
```typescript
await supabase
    .from('events')
    .update({ ...eventData, updated_at: new Date() })
    .eq('id', eventId);
```

### Update Form Fields:
```typescript
// For existing fields
await supabase
    .from('form_fields')
    .update({ field_name, field_type, is_required, order_index })
    .eq('id', fieldId);

// For new fields
await supabase
    .from('form_fields')
    .insert({ event_id, field_name, field_type, ... });

// For deleted fields
await supabase
    .from('form_fields')
    .delete()
    .in('id', deletedFieldIds);
```

## UI Features

- Dark mode support
- Loading states (data loading, image uploading, form submitting)
- Toast notifications for success/error
- Cancel button (returns to dashboard)
- Responsive design
- Form validation

## Status Options
- **Draft**: Event not visible to public
- **Published**: Event visible and can accept registrations
- **Cancelled**: Event is cancelled
- **Completed**: Event has ended

## Notes

- Changes are saved immediately on submit
- No undo feature (consider adding confirmation dialog)
- Image upload creates new file (old file remains in storage)
- Deleted form fields cannot be recovered
- Existing registrations are NOT affected by form field changes
