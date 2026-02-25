-- 对联 Gift Table
-- Run this in your Supabase SQL Editor

-- Create the gifts table
CREATE TABLE IF NOT EXISTS gifts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  template_id TEXT NOT NULL,
  render_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster slug lookups
CREATE INDEX IF NOT EXISTS idx_gifts_slug ON gifts(slug);

-- Enable Row Level Security (but allow all for MVP)
ALTER TABLE gifts ENABLE ROW LEVEL SECURITY;

-- Permissive policy for MVP - allows all operations
CREATE POLICY "Allow all operations on gifts" ON gifts
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Storage bucket setup instructions:
-- 1. Go to Storage in Supabase Dashboard
-- 2. Create a new bucket called "gifts"
-- 3. Make it PUBLIC (toggle public access)
-- 4. Or run this RPC if you have permissions:
-- INSERT INTO storage.buckets (id, name, public) VALUES ('gifts', 'gifts', true);
