-- Create an admin user for testing
-- Replace 'your-admin-email@example.com' with your actual email

INSERT INTO auth.users (
  id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role
) VALUES (
  gen_random_uuid(),
  'admin@hatch.com',
  crypt('admin123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{}',
  false,
  'authenticated'
);

-- Create corresponding user profile
INSERT INTO users (
  id,
  email,
  username,
  full_name,
  college,
  graduation_year,
  bio,
  skills,
  subscription_tier
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@hatch.com'),
  'admin@hatch.com',
  'admin',
  'Admin User',
  'Hatch Team',
  2024,
  'Platform administrator',
  ARRAY['Management', 'Operations'],
  'premium_149'
);