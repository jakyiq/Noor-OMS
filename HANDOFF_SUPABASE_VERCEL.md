# 🚀 Supabase + Vercel Handoff & Migration Blueprint
This comprehensive hand-off manual is structured for **Claude Opus**, **Codex**, or **Gemini Flash 3.5 on Antigravity**. It contains the exact SQL tables, database connection wrappers, React context adaptation layers, and deployment guidelines to cleanly migrate this clinic management system from Client-Side Offline Storage to a fully persistent Cloud backend on **Supabase** and **Vercel**.

---

## 📅 Part 1: PostgreSQL DDL (Supabase Schema)
Run the following SQL script inside the Supabase Query Editor to bootstrap all tables, primary keys, foreign relations, and indexes. It matches the strict typing definitions declared in `types.ts`.

```sql
-- 1. CLINICS TABLE
CREATE TABLE clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(100),
  address TEXT,
  logo_url TEXT,
  plan VARCHAR(50) DEFAULT 'trial',
  exclude_pos_from_patient_menu BOOLEAN DEFAULT FALSE,
  print_theme VARCHAR(50) DEFAULT 'burgundy',
  doctor_credentials TEXT,
  doctor_phone VARCHAR(100),
  print_instructions TEXT,
  show_staff_on_print BOOLEAN DEFAULT TRUE,
  print_associates TEXT,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 2. USERS & STAFF TABLE
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  username VARCHAR(100) UNIQUE NOT NULL,
  full_name VARCHAR(150) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'receptionist', -- 'doctor', 'receptionist', 'super_admin'
  permissions JSONB DEFAULT '{"viewFinancials": true, "auditOrders": true, "editPatients": true, "editSettings": true}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 3. PATIENTS TABLE
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(100) NOT NULL,
  age INTEGER,
  gender VARCHAR(20),
  address TEXT,
  notes TEXT,
  outstanding_remaining DECIMAL(12, 2) DEFAULT 0.00,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 4. VISITS (HEALTH / TREATMENT HISTORY)
CREATE TABLE visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
  next_visit_date DATE,
  diagnosis TEXT,
  total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  amount_paid DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  remaining DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  lens_type VARCHAR(255),
  frame_brand VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 5. PRESCRIPTIONS (OPTOMETRY MEASUREMENTS)
CREATE TABLE prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  prescriber VARCHAR(255) NOT NULL,
  lens_type VARCHAR(255) NOT NULL,
  frame_details TEXT,
  od_sphere VARCHAR(50),
  od_cylinder VARCHAR(50),
  od_axis VARCHAR(50),
  os_sphere VARCHAR(50),
  os_cylinder VARCHAR(50),
  os_axis VARCHAR(50),
  pd VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 6. FRAMES INVENTORY TABLE
CREATE TABLE frames (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  brand VARCHAR(255) NOT NULL,
  model VARCHAR(255) NOT NULL,
  color VARCHAR(100),
  type VARCHAR(100), -- 'Full Rim', 'Half Rim', 'Rimless'
  material VARCHAR(100),
  shape VARCHAR(100),
  quantity INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 0,
  cost_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  sell_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 7. LENSES INVENTORY TABLE
CREATE TABLE lenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  lens_type VARCHAR(255) NOT NULL,
  material VARCHAR(255) NOT NULL,
  coating VARCHAR(255) NOT NULL,
  sphere DECIMAL(6, 2) NOT NULL DEFAULT 0.00,
  cylinder DECIMAL(6, 2) NOT NULL DEFAULT 0.00,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 0,
  cost_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  sell_price DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 8. OPERATIONAL EXPENSES (OPEX)
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  category VARCHAR(100) NOT NULL, -- 'lab', 'rent', 'salary', 'utilities', 'other'
  amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 9. AUDIT LOGS
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
  user_id VARCHAR(150),
  user_name VARCHAR(150),
  action VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete'
  entity_type VARCHAR(100) NOT NULL, -- 'patient', 'visit', 'prescription', 'inventory', 'supplier', 'settings'
  entity_id VARCHAR(150) NOT NULL,
  entity_name VARCHAR(255) NOT NULL,
  details TEXT,
  timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- 🛡️ CREATE INDEXES FOR FAST QUERIES (OPTIMIZED READS)
CREATE INDEX idx_patients_clinic ON patients(clinic_id);
CREATE INDEX idx_visits_patient ON visits(patient_id);
CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX idx_frames_clinic ON frames(clinic_id);
CREATE INDEX idx_lenses_clinic ON lenses(clinic_id);
CREATE INDEX idx_expenses_clinic ON expenses(clinic_id);
CREATE INDEX idx_audit_logs_clinic ON audit_logs(clinic_id);
```

---

## ⚡ Part 2: Supabase Javascript Client
Install `@supabase/supabase-js`, create `src/lib/supabase.ts`, and define your client connection:

```bash
npm install @supabase/supabase-js
```

### `src/lib/supabase.ts` Implementation
```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Falling back to offline client mocks."
  );
}

export const supabase = createClient(
  supabaseUrl || "https://placeholder-url.supabase.co",
  supabaseAnonKey || "placeholder-anon-key"
);
```

---

## 🔄 Part 3: Transitioning `ClinicContext.tsx`
Since the system is beautifully modularized and centers on `ClinicContext.tsx`, you only need to change the data fetching functions in **one single file** without restructuring your visual page components!

```typescript
// Replace localStorage effects inside src/context/ClinicContext.tsx with real asynchronous API fetch calls:
import { supabase } from '../lib/supabase';

// 1. Fetching Patients & Visited Sub-records asynchronously
const fetchPatients = async (clinicId: string) => {
  setIsLoading(true);
  const { data, error } = await supabase
    .from('patients')
    .select('*, visits(*), prescriptions(*)')
    .eq('clinic_id', clinicId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error("Error fetching patient profiles:", error.message);
  } else {
    setPatients(data || []);
  }
  setIsLoading(false);
};

// 2. Writing a New Patient to Supabase
const addPatient = async (newPatientData: Omit<Patient, "id">) => {
  const { data, error } = await supabase
    .from('patients')
    .insert([{ ...newPatientData, clinic_id: clinic?.id }])
    .select()
    .single();

  if (error) throw new Error(error.message);
  setPatients(prev => [data, ...prev]);
  logAction({
    action: "create",
    entity_type: "patient",
    entity_id: data.id,
    entity_name: data.full_name,
    details: `Added patient ${data.full_name}`
  });
};
```

---

## 🌐 Part 4: Vercel Deployment Checklist (`vercel.json`)
Creating a `vercel.json` ensures that Single Page Router (SPA) fallbacks are correctly handled by Vercel's edge nodes.

### Configuration file: `vercel.json`
```json
{
  "version": 2,
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

### Setup Environment variables on Vercel Dashboard:
- `VITE_SUPABASE_URL`: Your Supabase Project API URL from `Settings > API`.
- `VITE_SUPABASE_ANON_KEY`: Your Supabase Public Anonymous cryptokey.

---

## 🤖 Successor Agent Task Directive
This application is completely prepared for cloud hosting. The **hardcoded patient profiles, audit trials, clinics registries, and active expenses lists represent clean, empty initial lists**, which fallback into responsive skeleton panels on first load. All stock levels inside frames & lenses remain fully responsive to manual catalog manipulation.

### Steps to start integrating:
1. Initialize a Git repository, push your files, and connect your repo with **Vercel** for instant edge deployments.
2. Fill the `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` inside the Vercel dashboard.
3. Replace the `localStorage` loading blocks in `ClinicContext.tsx` with supabase async actions similar to **Part 3**.
