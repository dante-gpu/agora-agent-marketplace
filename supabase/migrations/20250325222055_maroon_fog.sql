/*
  # Configure Google OAuth Settings

  1. Changes
    - Create helper functions for OAuth configuration
    - Set up Google OAuth provider settings
    - Add necessary permissions and roles

  2. Security
    - Use proper schema and role management
    - Ensure secure provider configuration
*/

-- Create a secure schema for auth helpers
CREATE SCHEMA IF NOT EXISTS auth_helpers;

-- Create a function to safely store OAuth settings
CREATE OR REPLACE FUNCTION auth_helpers.set_oauth_settings(
  provider text,
  settings jsonb
)
RETURNS void AS $$
BEGIN
  -- Store settings in a secure way
  PERFORM set_config(
    'app.oauth.' || provider || '_settings',
    settings::text,
    false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth_helpers TO service_role;
GRANT EXECUTE ON FUNCTION auth_helpers.set_oauth_settings TO service_role;

-- Configure Google OAuth settings
SELECT auth_helpers.set_oauth_settings(
  'google',
  '{
    "enabled": true,
    "client_id": "YOUR_GOOGLE_CLIENT_ID",
    "client_secret": "YOUR_GOOGLE_CLIENT_SECRET",
    "redirect_uri": "http://localhost:5173/auth/callback",
    "additional_redirect_uris": [
      "http://localhost:5173",
      "http://localhost:5173/auth/callback",
      "http://localhost:5173/signin",
      "http://localhost:5173/signup"
    ],
    "allowed_domains": ["*"]
  }'::jsonb
);

-- Add comment explaining manual configuration requirement
COMMENT ON FUNCTION auth_helpers.set_oauth_settings IS 
  'Helper function for OAuth configuration. Note: Google OAuth must also be enabled and configured in the Supabase dashboard.';