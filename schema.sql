-- Create lotto_numbers table
CREATE TABLE IF NOT EXISTS lotto_numbers (
    id SERIAL PRIMARY KEY,
    numbers INTEGER[] NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_winner BOOLEAN DEFAULT FALSE,
    draw_round INTEGER,
    matching_count INTEGER DEFAULT 0
); 