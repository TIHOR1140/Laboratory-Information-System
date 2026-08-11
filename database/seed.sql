-- Seed initial data for Laboratory Information System (LIS)

-- 1. Insert Initial System Users
-- Passwords are hashed with bcrypt (rounds = 12)
-- Admin: admin@gmail.com / Password: Admin@123
INSERT INTO users (id, name, email, password_hash, role, is_active)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Admin User',
  'admin@gmail.com',
  '$2b$12$irjfkihxQOi6GUzMbm2/PeMV.Ht6ZoQ0tljFYzT1teCHd6Y15rDM6',
  'ADMIN',
  TRUE
)
ON CONFLICT (email) DO NOTHING;

-- Receptionist: recep@gmail.com / Password: Recep@123
INSERT INTO users (id, name, email, password_hash, role, is_active)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'Receptionist User',
  'recep@gmail.com',
  '$2b$12$Ot4CglNRB50ivwAqJbWHO.S/q1V6zfLbnKGMmumu2Yiy2kaXwRmDC',
  'RECEPTIONIST',
  TRUE
)
ON CONFLICT (email) DO NOTHING;

-- Lab Technician: tech@gmail.com / Password: Tech@123
INSERT INTO users (id, name, email, password_hash, role, is_active)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  'Lab Technician User',
  'tech@gmail.com',
  '$2b$12$6mXhFAKfiTJfpvZNB/7cTODpCbJRCD1NbBSnz7aw3bnj78nqmqe4G',
  'TECHNICIAN',
  TRUE
)
ON CONFLICT (email) DO NOTHING;

-- Patient User 1: patient@gmail.com / Password: Patient@123
INSERT INTO users (id, name, email, password_hash, role, is_active)
VALUES (
  '44444444-4444-4444-4444-444444444444',
  'John Doe',
  'patient@gmail.com',
  '$2b$12$hBIpdMUZCiQ7yaAFmfIdVOAMwA78h0glNtbUnMtlz47inYX13N.Wu',
  'PATIENT',
  TRUE
)
ON CONFLICT (email) DO NOTHING;

-- Patient User 2: jane.smith@example.com / Password: Patient@123
INSERT INTO users (id, name, email, password_hash, role, is_active)
VALUES (
  '55555555-5555-5555-5555-555555555555',
  'Jane Smith',
  'jane.smith@example.com',
  '$2b$12$hBIpdMUZCiQ7yaAFmfIdVOAMwA78h0glNtbUnMtlz47inYX13N.Wu',
  'PATIENT',
  TRUE
)
ON CONFLICT (email) DO NOTHING;

-- 2. Insert Patients Demographics & Contact Info
INSERT INTO patients (id, user_id, first_name, last_name, email, phone, notification_preference, sms_enabled, email_enabled, date_of_birth, gender, address)
VALUES
  (
    'a1111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444444',
    'John',
    'Doe',
    'patient@gmail.com',
    '+15551234567',
    'BOTH',
    TRUE,
    TRUE,
    '1990-05-15',
    'Male',
    '123 Health Ave, Suite 10, New York, NY'
  ),
  (
    'a2222222-2222-2222-2222-222222222222',
    '55555555-5555-5555-5555-555555555555',
    'Jane',
    'Smith',
    'jane.smith@example.com',
    '+15559876543',
    'SMS',
    TRUE,
    FALSE,
    '1985-08-22',
    'Female',
    '456 Wellness Blvd, Boston, MA'
  )
ON CONFLICT DO NOTHING;

-- 3. Insert Laboratory Tests Catalog
INSERT INTO tests (id, name, code, category, price, reference_range, unit)
VALUES
  ('c1111111-1111-1111-1111-111111111111', 'Complete Blood Count (CBC)', 'TEST-CBC-01', 'Hematology', 45.00, 'Multi-Parameter Panel', 'Panel'),
  ('c2222222-2222-2222-2222-222222222222', 'Fasting Blood Sugar (FBS)', 'TEST-FBS-02', 'Biochemistry', 20.00, '70 - 99', 'mg/dL'),
  ('c3333333-3333-3333-3333-333333333333', 'Lipid Profile Panel', 'TEST-LIPID-03', 'Biochemistry', 65.00, 'Multi-Parameter Panel', 'Panel'),
  ('c4444444-4444-4444-4444-444444444444', 'Thyroid Stimulating Hormone (TSH)', 'TEST-TSH-04', 'Endocrinology', 50.00, '0.4 - 4.0', 'mIU/L')
ON CONFLICT (code) DO NOTHING;

-- 3b. Insert Test Parameters
INSERT INTO test_parameters (id, test_id, name, unit, reference_range, display_order)
VALUES
  ('10000000-0000-0000-0000-000000000001', 'c1111111-1111-1111-1111-111111111111', 'Hemoglobin', 'g/dL', '13.0 - 17.5', 1),
  ('10000000-0000-0000-0000-000000000002', 'c1111111-1111-1111-1111-111111111111', 'White Blood Cells (WBC)', 'x10^3/uL', '4.5 - 11.0', 2),
  ('10000000-0000-0000-0000-000000000003', 'c1111111-1111-1111-1111-111111111111', 'Platelet Count', 'x10^3/uL', '150 - 450', 3),
  ('10000000-0000-0000-0000-000000000004', 'c1111111-1111-1111-1111-111111111111', 'Red Blood Cells (RBC)', 'x10^6/uL', '4.3 - 5.9', 4),
  ('20000000-0000-0000-0000-000000000001', 'c2222222-2222-2222-2222-222222222222', 'Fasting Blood Glucose', 'mg/dL', '70 - 99', 1),
  ('30000000-0000-0000-0000-000000000001', 'c3333333-3333-3333-3333-333333333333', 'Total Cholesterol', 'mg/dL', '< 200', 1),
  ('30000000-0000-0000-0000-000000000002', 'c3333333-3333-3333-3333-333333333333', 'HDL Cholesterol', 'mg/dL', '> 40', 2),
  ('30000000-0000-0000-0000-000000000003', 'c3333333-3333-3333-3333-333333333333', 'LDL Cholesterol', 'mg/dL', '< 100', 3),
  ('30000000-0000-0000-0000-000000000004', 'c3333333-3333-3333-3333-333333333333', 'Triglycerides', 'mg/dL', '< 150', 4),
  ('40000000-0000-0000-0000-000000000001', 'c4444444-4444-4444-4444-444444444444', 'Thyroid Stimulating Hormone (TSH)', 'mIU/L', '0.4 - 4.0', 1)
ON CONFLICT DO NOTHING;

-- 4. Insert Appointments
INSERT INTO appointments (id, patient_id, assigned_to, appointment_date, reason, status, notes)
VALUES
  (
    'b1111111-1111-1111-1111-111111111111',
    '44444444-4444-4444-4444-444444444444',
    '33333333-3333-3333-3333-333333333333',
    NOW() - INTERVAL '1 day',
    'Annual Health Checkup',
    'COMPLETED',
    'Patient fasted for 12 hours prior to test collection.'
  ),
  (
    'b2222222-2222-2222-2222-222222222222',
    '55555555-5555-5555-5555-555555555555',
    '33333333-3333-3333-3333-333333333333',
    NOW() + INTERVAL '1 day',
    'Routine Blood Screening',
    'SCHEDULED',
    'Patient requested morning appointment.'
  )
ON CONFLICT DO NOTHING;

-- 5. Insert Samples (Barcode Tracking)
INSERT INTO samples (id, appointment_id, sample_type, barcode, status, collected_at, collected_by)
VALUES
  (
    'e1111111-1111-1111-1111-111111111111',
    'b1111111-1111-1111-1111-111111111111',
    'Blood (EDTA Tube)',
    'BAR-2026-00189',
    'COMPLETED',
    NOW() - INTERVAL '23 hours',
    '33333333-3333-3333-3333-333333333333'
  ),
  (
    'e2222222-2222-2222-2222-222222222222',
    'b2222222-2222-2222-2222-222222222222',
    'Blood (Serum Separator Tube)',
    'BAR-2026-00190',
    'PENDING',
    NULL,
    NULL
  )
ON CONFLICT (barcode) DO NOTHING;

-- 6. Insert Test Results (Manual Entry from Semi-Automatic Equipment)
INSERT INTO test_results (id, appointment_id, sample_id, test_id, parameter_id, result_value, unit, reference_range, equipment_name, is_normal, remarks, entered_by)
VALUES
  (
    'f1111111-1111-1111-1111-111111111111',
    'b1111111-1111-1111-1111-111111111111',
    'e1111111-1111-1111-1111-111111111111',
    'c1111111-1111-1111-1111-111111111111',
    '10000000-0000-0000-0000-000000000002',
    '6.8',
    'x10^3/uL',
    '4.5 - 11.0',
    'Sysmex XP-300 Automated Analyzer',
    TRUE,
    'WBC count within normal limits.',
    '33333333-3333-3333-3333-333333333333'
  ),
  (
    'f2222222-2222-2222-2222-222222222222',
    'b1111111-1111-1111-1111-111111111111',
    'e1111111-1111-1111-1111-111111111111',
    'c2222222-2222-2222-2222-222222222222',
    '20000000-0000-0000-0000-000000000001',
    '92',
    'mg/dL',
    '70 - 99',
    'Mindray BS-240 Chemistry Analyzer',
    TRUE,
    'Fasting blood glucose normal.',
    '33333333-3333-3333-3333-333333333333'
  )
ON CONFLICT DO NOTHING;

-- 7. Insert Automated PDF Reports Status Tracking
INSERT INTO reports (id, appointment_id, patient_id, report_number, pdf_path, status, sent_via_email, sent_via_sms, generated_at)
VALUES (
  'd1111111-1111-1111-1111-111111111111',
  'b1111111-1111-1111-1111-111111111111',
  '44444444-4444-4444-4444-444444444444',
  'REP-2026-8801',
  '/reports/2026/REP-2026-8801.pdf',
  'GENERATED',
  TRUE,
  TRUE,
  NOW() - INTERVAL '20 hours'
)
ON CONFLICT (report_number) DO NOTHING;

-- 8. Insert Integrated Billing & Payments
INSERT INTO invoices (id, appointment_id, total_amount, discount, net_amount, payment_status)
VALUES (
  'fa111111-1111-1111-1111-111111111111',
  'b1111111-1111-1111-1111-111111111111',
  65.00,
  5.00,
  60.00,
  'PAID'
)
ON CONFLICT (appointment_id) DO NOTHING;

INSERT INTO payments (id, invoice_id, amount_paid, payment_method, collected_by, collected_at)
VALUES (
  'fb111111-1111-1111-1111-111111111111',
  'fa111111-1111-1111-1111-111111111111',
  60.00,
  'CASH',
  '22222222-2222-2222-2222-222222222222',
  NOW() - INTERVAL '24 hours'
)
ON CONFLICT DO NOTHING;
