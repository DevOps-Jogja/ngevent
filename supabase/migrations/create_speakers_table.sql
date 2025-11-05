-- Create speakers table
CREATE TABLE IF NOT EXISTS speakers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    title VARCHAR(255),
    company VARCHAR(255),
    bio TEXT,
    photo_url TEXT,
    linkedin_url TEXT,
    twitter_url TEXT,
    website_url TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_speakers_event_id ON speakers(event_id);
CREATE INDEX IF NOT EXISTS idx_speakers_order ON speakers(order_index);

-- Enable RLS
ALTER TABLE speakers ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Public can view speakers" ON speakers
    FOR SELECT USING (true);

CREATE POLICY "Organizers can manage their event speakers" ON speakers
    FOR ALL USING (
        event_id IN (
            SELECT id FROM events WHERE organizer_id = auth.uid()
        )
    );
