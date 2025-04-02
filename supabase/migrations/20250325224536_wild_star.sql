/*
  # Set Up Admin Role and Capabilities

  1. Changes
    - Add admin functions and views
    - Set up admin role for virjilakrum user
    - Add admin-only functions
    - Update RLS policies

  2. Security
    - Ensure proper access control
    - Add secure admin functions
    - Protect sensitive operations
*/

-- Create admin functions if they don't exist
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = $1
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_moderator(user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = $1
    AND role IN ('admin', 'moderator')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create admin views
CREATE OR REPLACE VIEW admin_user_stats AS
SELECT 
  COUNT(DISTINCT u.id) as total_users,
  COUNT(DISTINCT CASE WHEN u.created_at > NOW() - INTERVAL '24 hours' THEN u.id END) as new_users_24h,
  COUNT(DISTINCT CASE WHEN u.last_sign_in_at > NOW() - INTERVAL '7 days' THEN u.id END) as active_users_7d
FROM auth.users u;

CREATE OR REPLACE VIEW admin_content_stats AS
SELECT 
  COUNT(DISTINCT a.id) as total_agents,
  COUNT(DISTINCT d.id) as total_discussions,
  COUNT(DISTINCT cr.id) as pending_reports
FROM agents a
CROSS JOIN discussions d
CROSS JOIN content_reports cr
WHERE cr.status = 'pending';

-- Add virjilakrum as admin
DO $$
DECLARE
  admin_user_id uuid;
BEGIN
  -- Try to get user ID for virjilakrum
  SELECT user_id INTO admin_user_id
  FROM user_profiles
  WHERE username = 'virjilakrum';

  -- Only proceed if we found the user
  IF admin_user_id IS NOT NULL THEN
    -- Insert admin role if not exists
    INSERT INTO user_roles (user_id, role, created_by)
    VALUES (admin_user_id, 'admin', admin_user_id)
    ON CONFLICT (user_id, role) DO NOTHING;

    -- Grant necessary permissions
    INSERT INTO user_activity (user_id, action, metadata)
    VALUES (
      admin_user_id,
      'granted_admin_role',
      jsonb_build_object(
        'timestamp', NOW(),
        'granted_by', 'system'
      )
    );
  END IF;
END $$;

-- Update RLS policies for admin access
ALTER POLICY "Admins can view all activity" ON user_activity
USING (is_admin(auth.uid()));

ALTER POLICY "Admins can view analytics" ON bot_analytics
USING (is_admin(auth.uid()));

ALTER POLICY "Admins can manage roles" ON user_roles
USING (is_admin(auth.uid()));

-- Create admin-only functions
CREATE OR REPLACE FUNCTION admin_ban_user(
  target_user_id uuid,
  reason text,
  duration interval DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  INSERT INTO user_bans (user_id, reason, expires_at, created_by)
  VALUES (
    target_user_id,
    reason,
    CASE WHEN duration IS NOT NULL THEN NOW() + duration ELSE NULL END,
    auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION admin_delete_content(
  content_type text,
  content_id uuid,
  reason text
)
RETURNS void AS $$
BEGIN
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  CASE content_type
    WHEN 'discussion' THEN
      DELETE FROM discussions WHERE id = content_id;
    WHEN 'reply' THEN
      DELETE FROM discussion_replies WHERE id = content_id;
    WHEN 'agent' THEN
      DELETE FROM agents WHERE id = content_id;
    ELSE
      RAISE EXCEPTION 'Invalid content type';
  END CASE;

  INSERT INTO moderation_actions (
    moderator_id,
    action_type,
    target_type,
    target_id,
    reason
  ) VALUES (
    auth.uid(),
    'delete',
    content_type,
    content_id,
    reason
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;