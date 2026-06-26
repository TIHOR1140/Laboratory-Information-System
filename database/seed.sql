INSERT INTO users (name, email, password_hash, role, is_active, last_login)
VALUES (
  'Admin User',
  'admin@lis.local',
  '$2b$12$ycVcJP0SHkUW6PS6pGEoq.eE3xRBjQ77i45KeOhNfMU7EHzVqs7rG',
  'ADMIN',
  TRUE,
  NULL 
)
ON CONFLICT (email) DO NOTHING;

-- Credentials for the seeded admin account:
-- Email: admin@lis.local
-- Password: Admin@12345
