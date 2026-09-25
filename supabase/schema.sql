-- SAHA-ERP / ORION PROJE TAKIP
-- PostgreSQL Database Schema & Row Level Security (RLS) Policies
-- Designed for Supabase

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS
CREATE TYPE user_role AS ENUM ('admin', 'spv', 'accountant');
CREATE TYPE project_type_enum AS ENUM ('saha', 'studyo', 'gizli_musteri', 'diger');
CREATE TYPE business_model_enum AS ENUM ('model_a_macro', 'model_b_micro');
CREATE TYPE project_status_enum AS ENUM ('draft', 'feasibility', 'active', 'completed', 'cancelled');
CREATE TYPE personnel_role_enum AS ENUM ('anketor', 'gozlemci', 'gizli_musteri', 'cevirici', 'girisci');
CREATE TYPE expense_category_enum AS ENUM ('yakit', 'yemek', 'konaklama', 'kargo', 'diger');
CREATE TYPE invoice_status_enum AS ENUM ('not_invoiced', 'invoiced', 'collected');

-- 3. PROFILES TABLE (Supabase Auth link)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    role user_role NOT NULL DEFAULT 'spv',
    phone TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PERSONNEL DIRECTORY (Havuz & Kara Liste)
CREATE TABLE IF NOT EXISTS personnel_directory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name TEXT NOT NULL,
    identity_number VARCHAR(11),
    phone VARCHAR(20) NOT NULL,
    city VARCHAR(50) DEFAULT 'İstanbul',
    default_role personnel_role_enum NOT NULL DEFAULT 'anketor',
    default_unit_price DECIMAL(10,2) DEFAULT 180.00,
    is_blacklisted BOOLEAN DEFAULT FALSE,
    blacklist_reason TEXT,
    blacklisted_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PROJECTS (Projeler & İkili İş Modeli)
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) NOT NULL UNIQUE,
    client_name VARCHAR(150) NOT NULL,
    title VARCHAR(255) NOT NULL,
    project_type project_type_enum NOT NULL DEFAULT 'saha',
    business_model business_model_enum NOT NULL DEFAULT 'model_b_micro',
    status project_status_enum NOT NULL DEFAULT 'feasibility',
    
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    -- Hedef ve Finansman
    target_surveys INTEGER NOT NULL DEFAULT 500,
    client_unit_price DECIMAL(10,2) NOT NULL DEFAULT 350.00,
    client_total_budget DECIMAL(12,2) GENERATED ALWAYS AS (target_surveys * client_unit_price) STORED,
    
    -- Model A (Taşeron / Dış İller) Alanları
    subcontractor_name VARCHAR(150),
    subcontractor_unit_price DECIMAL(10,2) DEFAULT 0.00,
    
    -- Model B (Öz Ekip / Mikro) Alanları
    assigned_spv_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    daily_overhead_rate DECIMAL(10,2) DEFAULT 2000.00, -- Günlük SPV veya sabit gider payı
    default_personnel_rate DECIMAL(10,2) DEFAULT 180.00,
    
    -- Fizibilite Simülasyon Metrikleri
    simulated_cost DECIMAL(12,2) DEFAULT 0.00,
    simulated_net_margin DECIMAL(12,2) DEFAULT 0.00,
    simulated_margin_percent DECIMAL(5,2) DEFAULT 0.00,
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. PROJECT PERSONNEL ASSIGNMENTS (Dinamik Fiyat Override)
CREATE TABLE IF NOT EXISTS project_personnel (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    personnel_id UUID NOT NULL REFERENCES personnel_directory(id) ON DELETE RESTRICT,
    assigned_role personnel_role_enum NOT NULL DEFAULT 'anketor',
    custom_unit_price DECIMAL(10,2) NOT NULL, -- Override Fiyat (örn. 220 TL)
    daily_food_allowance DECIMAL(10,2) DEFAULT 0.00,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, personnel_id)
);

-- 7. EXPENSES (Saha Fişleri & Masraflar)
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    created_by_spv_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    category expense_category_enum NOT NULL DEFAULT 'yakit',
    amount DECIMAL(10,2) NOT NULL,
    receipt_image_url TEXT,
    description TEXT NOT NULL,
    is_approved BOOLEAN DEFAULT TRUE,
    expense_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ADVANCES (Canlı Avans Düşümleri)
CREATE TABLE IF NOT EXISTS advances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    personnel_id UUID NOT NULL REFERENCES personnel_directory(id) ON DELETE RESTRICT,
    issued_by_spv_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20) DEFAULT 'nakit',
    note TEXT,
    issued_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. SETTLEMENTS (Anket Kapama & Otomatik Hakediş)
CREATE TABLE IF NOT EXISTS settlements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    personnel_id UUID NOT NULL REFERENCES personnel_directory(id) ON DELETE RESTRICT,
    total_surveys INTEGER NOT NULL DEFAULT 0,
    invalid_surveys INTEGER NOT NULL DEFAULT 0,
    valid_surveys INTEGER GENERATED ALWAYS AS (total_surveys - invalid_surveys) STORED,
    unit_price_applied DECIMAL(10,2) NOT NULL,
    gross_amount DECIMAL(12,2) NOT NULL, -- valid_surveys * unit_price_applied
    advances_deducted DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    net_payable DECIMAL(12,2) NOT NULL, -- gross_amount - advances_deducted
    is_paid BOOLEAN DEFAULT FALSE,
    paid_at TIMESTAMPTZ,
    payment_reference TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(project_id, personnel_id)
);

-- 10. CLIENT INVOICES (Müşteri Faturalandırma & Tahsilat)
CREATE TABLE IF NOT EXISTS client_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    invoice_number VARCHAR(100),
    invoice_amount DECIMAL(12,2) NOT NULL,
    status invoice_status_enum NOT NULL DEFAULT 'not_invoiced',
    invoiced_at DATE,
    collected_at DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE personnel_directory ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_personnel ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE advances ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_invoices ENABLE ROW LEVEL SECURITY;

-- Helper Function: Check Admin
CREATE OR REPLACE FUNCTION is_admin() RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Admin sees all, SPV sees self
CREATE POLICY admin_all_profiles ON profiles FOR ALL USING (is_admin());
CREATE POLICY user_read_self ON profiles FOR SELECT USING (id = auth.uid());

-- Personnel Directory: Admin manages, SPV reads non-blacklisted
CREATE POLICY admin_all_personnel ON personnel_directory FOR ALL USING (is_admin());
CREATE POLICY spv_read_personnel ON personnel_directory FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'spv') 
    AND is_blacklisted = FALSE
);

-- Projects:
-- Admin full access
CREATE POLICY admin_all_projects ON projects FOR ALL USING (is_admin());
-- SPV reads only assigned projects
CREATE POLICY spv_assigned_projects ON projects FOR SELECT USING (
    assigned_spv_id = auth.uid()
);

-- Expenses & Advances:
CREATE POLICY admin_all_expenses ON expenses FOR ALL USING (is_admin());
CREATE POLICY spv_expenses ON expenses FOR ALL USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = expenses.project_id AND projects.assigned_spv_id = auth.uid())
);

CREATE POLICY admin_all_advances ON advances FOR ALL USING (is_admin());
CREATE POLICY spv_advances ON advances FOR ALL USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = advances.project_id AND projects.assigned_spv_id = auth.uid())
);

-- Settlements:
CREATE POLICY admin_all_settlements ON settlements FOR ALL USING (is_admin());
CREATE POLICY spv_read_settlements ON settlements FOR SELECT USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = settlements.project_id AND projects.assigned_spv_id = auth.uid())
);

-- Client Invoices: Only Admin / Accountant can view/edit
CREATE POLICY admin_all_invoices ON client_invoices FOR ALL USING (is_admin());

-- 12. REALTIME PUBLICATION SETUP
ALTER PUBLICATION supabase_realtime ADD TABLE projects, expenses, advances, settlements, client_invoices;
