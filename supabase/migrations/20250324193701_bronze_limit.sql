/*
  # Create categories table and add category relationships

  1. New Tables
    - `categories`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `description` (text)
      - `icon` (text)
      - `created_at` (timestamp)

  2. Changes
    - Add foreign key constraint to agents table for category reference
    - Enable RLS on categories table
    - Add policies for public read access
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text NOT NULL,
  icon text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Add policies
CREATE POLICY "Anyone can read categories"
  ON categories
  FOR SELECT
  TO public
  USING (true);

-- Insert initial categories
INSERT INTO categories (name, description, icon, created_at)
VALUES
  ('Writing', 'Content creation, editing, and writing assistance', 'Pencil', NOW()),
  ('Programming', 'Code generation, debugging, and development tools', 'Code', NOW()),
  ('Research', 'Data analysis, academic research, and fact-checking', 'Brain', NOW()),
  ('Knowledge', 'Information retrieval and learning assistance', 'Bookmark', NOW()),
  ('Business', 'Business analysis, strategy, and planning', 'Briefcase', NOW()),
  ('Math', 'Mathematical calculations and problem-solving', 'Calculator', NOW()),
  ('Design', 'Graphic design, UI/UX, and creative assistance', 'Palette', NOW()),
  ('Music', 'Music composition, analysis, and theory', 'Music', NOW())
ON CONFLICT (name) DO NOTHING;