-- Laboratory Information System (LIS) - PostgreSQL Schema Database
-- Native PostgreSQL Local Setup

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Users Table (Role-Based Access Control)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'RECEPTIONIST', 'TECHNICIAN', 'LAB_TECHNICIAN', 'PATIENT')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login TIMESTAMPTZ,
  two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  two_factor_secret TEXT,
  two_factor_method VARCHAR(50) DEFAULT 'TOTP',
  email_otp_code VARCHAR(6) DEFAULT NULL,
  email_otp_expires_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users
ADD COLUMN IF NOT EXISTS two_factor_method VARCHAR(50);

-- 2. User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  phone VARCHAR(50),
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('Male', 'Female', 'Other', 'Prefer not to say')),
  emergency_contact TEXT,
  street_address TEXT,
  city TEXT,
  district TEXT,
  blood_group TEXT,
  allergies TEXT,
  medical_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Patients Table (Demographics, Contact Info & Notification Preferences for SMS/Email)
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50) NOT NULL,
  notification_preference VARCHAR(50) NOT NULL DEFAULT 'BOTH' CHECK (notification_preference IN ('SMS', 'EMAIL', 'BOTH', 'NONE')),
  sms_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  email_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  date_of_birth DATE,
  gender VARCHAR(20) CHECK (gender IN ('Male', 'Female', 'Other', 'Prefer not to say')),
  address TEXT,
  emergency_contact TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Appointments Table (Online Booking Details & Scheduling Status)
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
  appointment_date TIMESTAMPTZ NOT NULL,
  reason TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. Tests Catalog Table
CREATE TABLE IF NOT EXISTS tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  code VARCHAR(50) NOT NULL UNIQUE,
  category VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  reference_range TEXT DEFAULT '',
  unit VARCHAR(50) DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5b. Test Parameters Table (Multi-Parameter Test Support)
CREATE TABLE IF NOT EXISTS test_parameters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  unit VARCHAR(50) NOT NULL,
  reference_range VARCHAR(255) NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Appointment Tests Link Table
CREATE TABLE IF NOT EXISTS appointment_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (appointment_id, test_id)
);

-- 7. Samples Table (Barcode-Based Sample Tracking)
CREATE TABLE IF NOT EXISTS samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  sample_type VARCHAR(100) NOT NULL DEFAULT 'Blood',
  barcode VARCHAR(100) UNIQUE,
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COLLECTED', 'PROCESSING', 'COMPLETED', 'REJECTED')),
  collected_at TIMESTAMPTZ,
  collected_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Test Results Table (Structured Format for Manual Input from Semi-Automatic Equipment)
CREATE TABLE IF NOT EXISTS test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  sample_id UUID REFERENCES samples(id) ON DELETE CASCADE,
  test_id UUID NOT NULL REFERENCES tests(id) ON DELETE CASCADE,
  parameter_id UUID REFERENCES test_parameters(id) ON DELETE CASCADE,
  result_value VARCHAR(255) NOT NULL,
  unit VARCHAR(50),
  reference_range VARCHAR(255),
  equipment_name VARCHAR(100) DEFAULT 'Semi-Automatic Analyzer',
  is_normal BOOLEAN NOT NULL DEFAULT TRUE,
  remarks TEXT,
  entered_by UUID REFERENCES users(id) ON DELETE SET NULL,
  entered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (appointment_id, test_id, parameter_id)
);

-- 9. Reports Table (Tracking Status of Automated PDF Report Generation)
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES users(id) ON DELETE CASCADE,
  report_number VARCHAR(100) NOT NULL UNIQUE,
  pdf_path VARCHAR(512),
  status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'GENERATING', 'GENERATED', 'FAILED', 'DELIVERED')),
  sent_via_email BOOLEAN NOT NULL DEFAULT FALSE,
  sent_via_sms BOOLEAN NOT NULL DEFAULT FALSE,
  generated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Billing / Invoices Table (Integrated Billing Linked to Patient & Appointment)
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
  total_amount DECIMAL(10, 2) NOT NULL,
  discount DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  net_amount DECIMAL(10, 2) NOT NULL,
  payment_status VARCHAR(50) NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PAID', 'PARTIAL', 'CANCELLED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Payments Table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  amount_paid DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL CHECK (payment_method IN ('CASH', 'CARD', 'ONLINE', 'INSURANCE')),
  collected_by UUID REFERENCES users(id) ON DELETE SET NULL,
  collected_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. User Sessions Table
CREATE TABLE IF NOT EXISTS user_sessions (
  jti VARCHAR(255) PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  is_revoked BOOLEAN NOT NULL DEFAULT FALSE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure all new columns exist on pre-existing tables
ALTER TABLE samples ADD COLUMN IF NOT EXISTS sample_type VARCHAR(100) DEFAULT 'Blood';
ALTER TABLE test_results ADD COLUMN IF NOT EXISTS sample_id UUID REFERENCES samples(id) ON DELETE CASCADE;
ALTER TABLE test_results ADD COLUMN IF NOT EXISTS parameter_id UUID REFERENCES test_parameters(id) ON DELETE CASCADE;
ALTER TABLE test_results DROP CONSTRAINT IF EXISTS test_results_appointment_id_test_id_key;
ALTER TABLE test_results DROP CONSTRAINT IF EXISTS test_results_appointment_id_test_id_parameter_id_key;
ALTER TABLE test_results ADD CONSTRAINT test_results_appointment_id_test_id_parameter_id_key UNIQUE (appointment_id, test_id, parameter_id);
ALTER TABLE test_results ADD COLUMN IF NOT EXISTS equipment_name VARCHAR(100) DEFAULT 'Semi-Automatic Analyzer';
ALTER TABLE test_results ADD COLUMN IF NOT EXISTS unit VARCHAR(50);
ALTER TABLE test_results ADD COLUMN IF NOT EXISTS reference_range VARCHAR(255);
ALTER TABLE test_results ADD COLUMN IF NOT EXISTS remarks TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS notes TEXT;

-- Indices for Query Performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_phone ON patients(phone);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_samples_barcode ON samples(barcode);
CREATE INDEX IF NOT EXISTS idx_samples_appt ON samples(appointment_id);
CREATE INDEX IF NOT EXISTS idx_test_parameters_test_id ON test_parameters(test_id);
CREATE INDEX IF NOT EXISTS idx_test_results_appt ON test_results(appointment_id);
CREATE INDEX IF NOT EXISTS idx_reports_appt ON reports(appointment_id);
CREATE INDEX IF NOT EXISTS idx_invoices_appt ON invoices(appointment_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);

-- Trigger Function to Update Timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS set_users_updated_at ON users;
CREATE TRIGGER set_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_patients_updated_at ON patients;
CREATE TRIGGER set_patients_updated_at BEFORE UPDATE ON patients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_appointments_updated_at ON appointments;
CREATE TRIGGER set_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_tests_updated_at ON tests;
CREATE TRIGGER set_tests_updated_at BEFORE UPDATE ON tests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_samples_updated_at ON samples;
CREATE TRIGGER set_samples_updated_at BEFORE UPDATE ON samples FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_test_results_updated_at ON test_results;
CREATE TRIGGER set_test_results_updated_at BEFORE UPDATE ON test_results FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_reports_updated_at ON reports;
CREATE TRIGGER set_reports_updated_at BEFORE UPDATE ON reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_invoices_updated_at ON invoices;
CREATE TRIGGER set_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Two-Factor Authentication fields for users
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS two_factor_secret TEXT;

