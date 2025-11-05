-- Add registration_fee column to events table
ALTER TABLE events
ADD COLUMN registration_fee DECIMAL(10, 2) DEFAULT 0;

COMMENT ON COLUMN events.registration_fee IS 'Registration fee in IDR. 0 means free event.';
