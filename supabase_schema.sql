-- TABLA DE PERFILES (Vinculada a Auth.Users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    family_id TEXT,
    role TEXT CHECK (role IN ('mom', 'dad', 'child')),
    name TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA DE HIJOS (Diferente de perfiles de usuario si no tienen cuenta propia)
CREATE TABLE children (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id TEXT NOT NULL,
    name TEXT NOT NULL,
    color TEXT,
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA DE EVENTOS Y CALENDARIO
CREATE TABLE events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id TEXT NOT NULL,
    date DATE NOT NULL,
    title TEXT NOT NULL,
    type TEXT CHECK (type IN ('custody', 'activity', 'expense')),
    assigned_to TEXT,
    created_by TEXT,
    child_ids TEXT[],
    start_time TIME,
    end_time TIME,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA DE MENSAJES DE CHAT
CREATE TABLE messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id TEXT NOT NULL,
    channel_id TEXT NOT NULL,
    sender TEXT NOT NULL,
    text TEXT NOT NULL,
    timestamp TEXT, -- Guardamos el formato legible del cliente o usamos created_at
    attachment JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA DE GASTOS
CREATE TABLE expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id TEXT NOT NULL,
    title TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    payer TEXT CHECK (payer IN ('mom', 'dad')),
    date DATE NOT NULL,
    category TEXT,
    fund_id TEXT,
    child_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA DE SOLICITUDES DE PAGO
CREATE TABLE payment_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id TEXT NOT NULL,
    title TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    type TEXT CHECK (type IN ('request', 'send')),
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA DE FONDOS DE AHORRO
CREATE TABLE funds (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id TEXT NOT NULL,
    title TEXT NOT NULL,
    target_amount DECIMAL(10,2),
    current_amount DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA DE DOCUMENTOS
CREATE TABLE documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id TEXT NOT NULL,
    child_id TEXT,
    name TEXT NOT NULL,
    type TEXT,
    date TEXT,
    size TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- TABLA DE DIARIO COMPARTIDO
CREATE TABLE diary_entries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    family_id TEXT NOT NULL,
    date TEXT NOT NULL,
    text TEXT NOT NULL,
    image TEXT,
    author TEXT,
    timestamp TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- HABILITAR REALTIME (Opcional, se puede hacer desde el Dashboard de Supabase)
-- ALTER PUBLICATION supabase_realtime ADD TABLE messages, events, expenses, payment_requests, funds, documents, diary_entries, children;
