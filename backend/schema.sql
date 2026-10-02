-- ============================================================
-- CampusFix Pro — PostgreSQL Schema (12 Tables)
-- ============================================================

-- 1. USERS TABLE (Roles: student, faculty, technician, admin)
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'faculty', 'technician', 'admin')),
    phone VARCHAR(50),
    department VARCHAR(255),
    specialization VARCHAR(255),
    student_or_emp_id VARCHAR(100),
    college_name VARCHAR(255),
    created_by_id INTEGER REFERENCES users (id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    icon VARCHAR(50) DEFAULT 'wrench',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. LOCATIONS TABLE (Campus buildings, blocks, labs, hostels)
CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    building_name VARCHAR(255) NOT NULL,
    block_code VARCHAR(50),
    floor VARCHAR(50),
    room_number VARCHAR(100),
    landmark TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. TICKETS TABLE (Core complaints and maintenance work orders)
CREATE TABLE IF NOT EXISTS tickets (
    id SERIAL PRIMARY KEY,
    ticket_id VARCHAR(50) NOT NULL UNIQUE,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES categories (id) ON DELETE RESTRICT,
    technician_id INTEGER REFERENCES users (id) ON DELETE SET NULL,
    location VARCHAR(255) NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'Medium' CHECK (priority IN ('Low', 'Medium', 'High', 'Critical')),
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'Submitted' CHECK (status IN ('Submitted', 'Pending', 'Assigned', 'In Progress', 'Resolved', 'Closed')),
    image_path TEXT,
    resolution_details TEXT,
    estimated_cost NUMERIC(10, 2) DEFAULT 0.00,
    resolved_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. TICKET_HISTORY TABLE (Audit trail of ticket status transitions)
CREATE TABLE IF NOT EXISTS ticket_history (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES tickets (id) ON DELETE CASCADE,
    changed_by_user_id INTEGER REFERENCES users (id) ON DELETE SET NULL,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    comments TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. TICKET_COMMENTS TABLE (Communication thread on tickets)
CREATE TABLE IF NOT EXISTS ticket_comments (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES tickets (id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    is_internal BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. TICKET_ATTACHMENTS TABLE (File and photo attachments)
CREATE TABLE IF NOT EXISTS ticket_attachments (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES tickets (id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100),
    file_size INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. TICKET_FEEDBACK TABLE (Student & Faculty ratings upon resolution)
CREATE TABLE IF NOT EXISTS ticket_feedback (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL UNIQUE REFERENCES tickets (id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comments TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 9. NOTIFICATIONS TABLE (Alerts for users, techs and administrators)
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    ticket_id INTEGER REFERENCES tickets (id) ON DELETE SET NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    type VARCHAR(50) DEFAULT 'ticket',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 10. INVENTORY_ITEMS TABLE (Maintenance spare parts and equipment)
CREATE TABLE IF NOT EXISTS inventory_items (
    id SERIAL PRIMARY KEY,
    item_name VARCHAR(255) NOT NULL,
    item_code VARCHAR(100) UNIQUE,
    category_id INTEGER REFERENCES categories (id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    unit VARCHAR(50) NOT NULL DEFAULT 'pieces',
    min_threshold INTEGER NOT NULL DEFAULT 5,
    unit_cost NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 11. TECHNICIAN_ASSIGNMENTS TABLE (Assignment history & dispatch logs)
CREATE TABLE IF NOT EXISTS technician_assignments (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES tickets (id) ON DELETE CASCADE,
    technician_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    assigned_by_id INTEGER REFERENCES users (id) ON DELETE SET NULL,
    assignment_notes TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'Assigned',
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- 12. FIXBOT_CHAT_LOGS TABLE (Real FixBot AI queries and interactions)
CREATE TABLE IF NOT EXISTS fixbot_chat_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users (id) ON DELETE SET NULL,
    session_id VARCHAR(100),
    prompt TEXT NOT NULL,
    response TEXT NOT NULL,
    provider VARCHAR(50) DEFAULT 'gemini',
    intent VARCHAR(100),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_tickets_user_id ON tickets (user_id);
CREATE INDEX IF NOT EXISTS idx_tickets_category_id ON tickets (category_id);
CREATE INDEX IF NOT EXISTS idx_tickets_technician_id ON tickets (technician_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets (status);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_ticket_comments_ticket_id ON ticket_comments (ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_history_ticket_id ON ticket_history (ticket_id);
CREATE INDEX IF NOT EXISTS idx_fixbot_user_id ON fixbot_chat_logs (user_id);

-- Keep tickets.updated_at fresh on every update
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tickets_updated_at ON tickets;
CREATE TRIGGER tickets_updated_at
BEFORE UPDATE ON tickets
FOR EACH ROW EXECUTE FUNCTION set_updated_at();
