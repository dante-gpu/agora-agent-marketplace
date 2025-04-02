/*
  # Fix Categories Table

  1. Changes
    - Create categories table if it doesn't exist
    - Insert initial category data
    - Add proper RLS policies
    - Add indexes for performance

  2. Security
    - Enable RLS
    - Add policy for public read access
*/

-- Drop existing table if it exists to ensure clean state
DROP TABLE IF EXISTS categories CASCADE;

-- Create categories table
CREATE TABLE categories (
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
  ON categories FOR SELECT
  TO public
  USING (true);

-- Create index for better performance
CREATE INDEX categories_name_idx ON categories(name);

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
ON CONFLICT (name) DO UPDATE
SET 
  description = EXCLUDED.description,
  icon = EXCLUDED.icon;