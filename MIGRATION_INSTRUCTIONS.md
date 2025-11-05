# Migration Instructions

This document contains instructions for running database migrations to add the speakers feature and extended profile fields.

## 1. Speakers Feature Migration

The speakers feature allows event organizers to add speaker information to their events.

### SQL Migration File Location
`supabase/migrations/create_speakers_table.sql`

### What it does:
- Creates a `speakers` table with fields: id, event_id, name, title, company, bio, photo_url, linkedin_url, twitter_url, website_url, order_index
- Adds indexes for better query performance
- Sets up Row Level Security (RLS) policies:
  - Anyone can read published event speakers
  - Only event creators can manage their event speakers

### How to run:
1. Open your Supabase Dashboard: https://app.supabase.com/
2. Navigate to your project
3. Go to "SQL Editor" in the left sidebar
4. Click "+ New query"
5. Copy and paste the entire content of `supabase/migrations/create_speakers_table.sql`
6. Click "Run" to execute the migration

## 2. Profile Fields Migration

This adds additional fields to the profiles table: phone, institution, position, city.

### SQL Migration File Location
`supabase/migrations/add_profile_fields.sql`

### What it does:
- Adds `phone` field (varchar, optional)
- Adds `institution` field (text, optional)
- Adds `position` field (text, optional)
- Adds `city` field (text, optional)

### How to run:
1. Open your Supabase Dashboard
2. Go to "SQL Editor"
3. Click "+ New query"
4. Copy and paste the entire content of `supabase/migrations/add_profile_fields.sql`
5. Click "Run" to execute the migration

## Features Added After Migration

### Speakers Feature
After running the migration, the following features will be available:

1. **Event Creation/Edit Pages**: 
   - Tab navigation with "Speakers" tab
   - Add multiple speakers with details (name, title, company, bio, photo, social links)
   - Drag and drop to reorder speakers
   - Delete speakers

2. **Event Display Pages**:
   - **Event Detail Page**: Full speakers section with photos, titles, companies, bios, and social links
   - **Homepage**: Speaker names and avatars displayed on event cards
   - **Events List Page**: Speaker avatars and names shown in event cards

3. **Speaker Information Includes**:
   - Name (required)
   - Title/Position (optional)
   - Company/Organization (optional)
   - Biography (optional)
   - Photo (optional)
   - LinkedIn URL (optional)
   - Twitter/X URL (optional)
   - Website URL (optional)

### Extended Profile Fields
After running the migration, users can edit their profiles with:
- Phone number
- Institution/Organization
- Position/Job Title
- City/Location

These fields are available in the "Edit Profile" page at `/profile/edit`.

## Verification

After running both migrations, verify they were successful:

1. In Supabase Dashboard, go to "Table Editor"
2. Check that the `speakers` table exists with all fields
3. Check that the `profiles` table has the new fields (phone, institution, position, city)
4. Go to "Authentication" > "Policies" and verify RLS policies are in place for the `speakers` table

## Troubleshooting

If you encounter any errors:

1. **Table already exists**: The migration has already been run. No action needed.
2. **Column already exists**: The profile fields have already been added. No action needed.
3. **Permission denied**: Make sure you're logged in as the project owner or have sufficient permissions.

## Notes

- These migrations are **safe to run multiple times** (they use `IF NOT EXISTS` clauses)
- No existing data will be affected
- The migrations only add new tables/columns, they don't modify existing ones
- All new fields are optional and won't break existing functionality
