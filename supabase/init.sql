-- Create exercise history table
CREATE TABLE exercise_history (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    exercise_type TEXT NOT NULL,
    reps INTEGER NOT NULL,
    duration INTEGER NOT NULL,
    form_score FLOAT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Set up row level security
ALTER TABLE exercise_history ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert their own exercise data" ON exercise_history
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own exercise data" ON exercise_history
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- Add update and delete policies for exercise_history
CREATE POLICY "Users can update their own exercise data" ON exercise_history
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own exercise data" ON exercise_history
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- ... existing exercise_history table and policies ...

-- Create workouts table
CREATE TABLE workouts (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users NOT NULL,
    exercise_type TEXT NOT NULL,
    reps INTEGER NOT NULL,
    form_feedback TEXT,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create profiles table
CREATE TABLE profiles (
    id UUID PRIMARY KEY REFERENCES auth.users,
    display_name TEXT,
    avatar_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE
);

-- Create user_settings table
CREATE TABLE user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users,
    exercise_info_docked BOOLEAN DEFAULT false,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Enable RLS on all tables
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Policies for workouts
CREATE POLICY "Users can insert their own workouts" ON workouts
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own workouts" ON workouts
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone" ON profiles
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policies for user_settings
CREATE POLICY "Users can view their own settings" ON user_settings
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings" ON user_settings
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings" ON user_settings
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Add update and delete policies for workouts
CREATE POLICY "Users can update their own workouts" ON workouts
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own workouts" ON workouts
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- Add insert policy for profiles
CREATE POLICY "Users can insert their own profile" ON profiles
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = id);

-- Create updated_at timestamp trigger function
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER set_timestamp_profiles
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

CREATE TRIGGER set_timestamp_user_settings
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION handle_updated_at();

-- Create function to handle new user profile creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, display_name, avatar_url, updated_at)
    VALUES (new.id, new.raw_user_meta_data->>'display_name', null, NOW());
    
    INSERT INTO public.user_settings (user_id)
    VALUES (new.id);
    
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user(); 