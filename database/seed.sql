-- Seed credentials for the Laboratory Information System (LIS)

-- 1. Admin Account
-- Email: admin@gmail.com
-- Password: Admin@123
INSERT INTO users (name, email, password_hash, role, is_active)
VALUES (
  'Admin User',
  'admin@gmail.com',
  '$2b$12$irjfkihxQOi6GUzMbm2/PeMV.Ht6ZoQ0tljFYzT1teCHd6Y15rDM6',
  'ADMIN',
  TRUE
)
ON CONFLICT (email) DO NOTHING;

-- 2. Receptionist Account
-- Email: recep@gmail.com
-- Password: Recep@123
INSERT INTO users (name, email, password_hash, role, is_active)
VALUES (
  'Receptionist User',
  'recep@gmail.com',
  '$2b$12$Ot4CglNRB50ivwAqJbWHO.S/q1V6zfLbnKGMmumu2Yiy2kaXwRmDC',
  'RECEPTIONIST',
  TRUE
)
ON CONFLICT (email) DO NOTHING;

-- 3. Technician Account
-- Email: tech@gmail.com
-- Password: Tech@123
INSERT INTO users (name, email, password_hash, role, is_active)
VALUES (
  'Technician User',
  'tech@gmail.com',
  '$2b$12$6mXhFAKfiTJfpvZNB/7cTODpCbJRCD1NbBSnz7aw3bnj78nqmqe4G',
  'TECHNICIAN',
  TRUE
)
ON CONFLICT (email) DO NOTHING;

-- 4. Patient Account
-- Email: patient@gmail.com
-- Password: Patient@123
INSERT INTO users (name, email, password_hash, role, is_active)
VALUES (
  'Patient User',
  'patient@gmail.com',
  '$2b$12$hBIpdMUZCiQ7yaAFmfIdVOAMwA78h0glNtbUnMtlz47inYX13N.Wu',
  'PATIENT',
  TRUE
)
ON CONFLICT (email) DO NOTHING;
