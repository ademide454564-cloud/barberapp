-- Services, Customers, Appointments temel migrasyonu

CREATE TABLE IF NOT EXISTS services (
	id SERIAL PRIMARY KEY,
	name TEXT NOT NULL,
	duration_minutes INTEGER NOT NULL,
	price NUMERIC(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS customers (
	id SERIAL PRIMARY KEY,
	name TEXT,
	phone_number TEXT NOT NULL,
	email TEXT
);

CREATE TABLE IF NOT EXISTS appointments (
	id SERIAL PRIMARY KEY,
	customer_id INTEGER REFERENCES customers(id) ON DELETE CASCADE,
	service_id INTEGER REFERENCES services(id) ON DELETE RESTRICT,
	start_time TIMESTAMP WITH TIME ZONE NOT NULL,
	end_time TIMESTAMP WITH TIME ZONE NOT NULL,
	status TEXT NOT NULL DEFAULT 'confirmed', -- confirmed, cancelled
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointments_start_end ON appointments(start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
