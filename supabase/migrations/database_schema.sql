-- ============================================
-- NGEVENT DATABASE SCHEMA
-- Platform Manajemen Event Online
-- ============================================

-- ============================================
-- 1. PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  phone VARCHAR(20),
  institution VARCHAR(255),
  position VARCHAR(255),
  city VARCHAR(255),
  role TEXT CHECK (role IN ('participant', 'organizer')) DEFAULT 'participant',
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organizer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  image_url TEXT,
  capacity INTEGER,
  registration_fee NUMERIC(10, 2) DEFAULT 0,
  status TEXT CHECK (status IN ('draft', 'published', 'cancelled', 'completed')) DEFAULT 'draft',
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 3. SPEAKERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.speakers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
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

-- ============================================
-- 4. REGISTRATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  registration_data JSONB,
  status TEXT CHECK (status IN ('registered', 'attended', 'cancelled')) DEFAULT 'registered',
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, user_id)
);

-- ============================================
-- 5. FORM_FIELDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.form_fields (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE NOT NULL,
  field_name TEXT NOT NULL,
  field_type TEXT NOT NULL,
  is_required BOOLEAN DEFAULT false,
  options JSONB,
  order_index INTEGER NOT NULL
);

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Events indexes
CREATE INDEX IF NOT EXISTS idx_events_organizer ON public.events(organizer_id);
CREATE INDEX IF NOT EXISTS idx_events_status ON public.events(status);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON public.events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(category);

-- Speakers indexes
CREATE INDEX IF NOT EXISTS idx_speakers_event_id ON public.speakers(event_id);
CREATE INDEX IF NOT EXISTS idx_speakers_order ON public.speakers(order_index);

-- Registrations indexes
CREATE INDEX IF NOT EXISTS idx_registrations_event ON public.registrations(event_id);
CREATE INDEX IF NOT EXISTS idx_registrations_user ON public.registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_registrations_status ON public.registrations(status);

-- Form fields indexes
CREATE INDEX IF NOT EXISTS idx_form_fields_event ON public.form_fields(event_id);
CREATE INDEX IF NOT EXISTS idx_form_fields_order ON public.form_fields(order_index);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.speakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_fields ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES POLICIES
-- ============================================

CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================
-- EVENTS POLICIES
-- ============================================

CREATE POLICY "Published events are viewable by everyone"
  ON public.events FOR SELECT
  USING (status = 'published' OR organizer_id = auth.uid());

CREATE POLICY "Organizers can create events"
  ON public.events FOR INSERT
  WITH CHECK (auth.uid() = organizer_id);

CREATE POLICY "Organizers can update their own events"
  ON public.events FOR UPDATE
  USING (auth.uid() = organizer_id);

CREATE POLICY "Organizers can delete their own events"
  ON public.events FOR DELETE
  USING (auth.uid() = organizer_id);

-- ============================================
-- SPEAKERS POLICIES
-- ============================================

CREATE POLICY "Public can view speakers"
  ON public.speakers FOR SELECT
  USING (true);

CREATE POLICY "Organizers can manage their event speakers"
  ON public.speakers FOR ALL
  USING (
    event_id IN (
      SELECT id FROM public.events WHERE organizer_id = auth.uid()
    )
  );

-- ============================================
-- REGISTRATIONS POLICIES
-- ============================================

CREATE POLICY "Users can view their own registrations"
  ON public.registrations FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IN (
    SELECT organizer_id FROM public.events WHERE id = event_id
  ));

CREATE POLICY "Users can register for events"
  ON public.registrations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own registrations"
  ON public.registrations FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Organizers can update registrations for their events"
  ON public.registrations FOR UPDATE
  USING (auth.uid() IN (
    SELECT organizer_id FROM public.events WHERE id = event_id
  ));

-- ============================================
-- FORM_FIELDS POLICIES
-- ============================================

CREATE POLICY "Form fields are viewable by everyone"
  ON public.form_fields FOR SELECT
  USING (true);

CREATE POLICY "Organizers can create form fields for their events"
  ON public.form_fields FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT organizer_id FROM public.events WHERE id = event_id
  ));

CREATE POLICY "Organizers can update form fields for their events"
  ON public.form_fields FOR UPDATE
  USING (auth.uid() IN (
    SELECT organizer_id FROM public.events WHERE id = event_id
  ));

CREATE POLICY "Organizers can delete form fields for their events"
  ON public.form_fields FOR DELETE
  USING (auth.uid() IN (
    SELECT organizer_id FROM public.events WHERE id = event_id
  ));

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Function to automatically create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update updated_at on events
DROP TRIGGER IF EXISTS update_events_updated_at ON public.events;
CREATE TRIGGER update_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to update updated_at on speakers
DROP TRIGGER IF EXISTS update_speakers_updated_at ON public.speakers;
CREATE TRIGGER update_speakers_updated_at
  BEFORE UPDATE ON public.speakers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- SAMPLE DATA (OPTIONAL)
-- ============================================

-- Insert sample categories (you can customize these)
COMMENT ON COLUMN public.events.category IS 
'Event categories: Technology, Business, Education, Health, Arts, Sports, Music, Food, Other';

-- Insert sample roles
COMMENT ON COLUMN public.profiles.role IS 
'User roles: participant (default) or organizer';

-- ============================================
-- DOCUMENTATION
-- ============================================

COMMENT ON TABLE public.profiles IS 
'User profiles with additional information beyond auth.users';

COMMENT ON TABLE public.events IS 
'Events created by organizers with all event details';

COMMENT ON TABLE public.speakers IS 
'Speakers associated with events';

COMMENT ON TABLE public.registrations IS 
'User registrations for events with custom form data';

COMMENT ON TABLE public.form_fields IS 
'Custom registration form fields defined by event organizers';

-- ============================================
-- END OF SCHEMA
-- ============================================
