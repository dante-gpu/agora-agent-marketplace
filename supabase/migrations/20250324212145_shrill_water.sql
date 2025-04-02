/*
  # Add Wallet Fields to User Profiles

  1. Changes
    - Add wallet_address field to user_profiles table
    - Add wallet_connected_at timestamp field
    - Add index on wallet_address for faster lookups
  
  2. Security
    - Maintain existing RLS policies
*/

-- Add wallet fields to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS wallet_address text,
ADD COLUMN IF NOT EXISTS wallet_connected_at timestamptz;

-- Add unique constraint on wallet_address
ALTER TABLE user_profiles
ADD CONSTRAINT user_profiles_wallet_address_key UNIQUE (wallet_address);

-- Create index for wallet address lookups
CREATE INDEX IF NOT EXISTS user_profiles_wallet_address_idx ON user_profiles(wallet_address);

-- Update RLS policies to include wallet fields
DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;

CREATE POLICY "Users can update own profile"
ON user_profiles FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);