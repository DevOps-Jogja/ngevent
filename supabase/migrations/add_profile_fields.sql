-- Add new profile fields
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS institution VARCHAR(255),
ADD COLUMN IF NOT EXISTS position VARCHAR(255),
ADD COLUMN IF NOT EXISTS city VARCHAR(255);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON profiles(phone);
