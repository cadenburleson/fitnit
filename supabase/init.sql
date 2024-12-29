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