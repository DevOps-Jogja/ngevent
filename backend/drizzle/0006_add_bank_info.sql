-- Add bank account information fields to events table
ALTER TABLE events ADD COLUMN bank_account_name TEXT;
ALTER TABLE events ADD COLUMN bank_account_number TEXT;
ALTER TABLE events ADD COLUMN bank_name TEXT;
