-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    role VARCHAR(20) DEFAULT 'viewer',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Adicionar coluna is_active se não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='is_active') THEN
        ALTER TABLE users ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
END $$;

-- Adicionar coluna role se não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='users' AND column_name='role') THEN
        ALTER TABLE users ADD COLUMN role VARCHAR(20) DEFAULT 'viewer';
    END IF;
END $$;

-- Índice para busca rápida por email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Tabela de tokens revogados (para logout)
CREATE TABLE IF NOT EXISTS revoked_tokens (
    id SERIAL PRIMARY KEY,
    token TEXT NOT NULL UNIQUE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    revoked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para busca rápida de tokens revogados
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_token ON revoked_tokens(token);
CREATE INDEX IF NOT EXISTS idx_revoked_tokens_user_id ON revoked_tokens(user_id);

-- Tabela de tentativas de login (para auditoria e segurança)
CREATE TABLE IF NOT EXISTS login_attempts (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    success BOOLEAN DEFAULT FALSE,
    attempted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índice para análise de tentativas de login
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON login_attempts(ip_address);
CREATE INDEX IF NOT EXISTS idx_login_attempts_attempted_at ON login_attempts(attempted_at);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at na tabela users
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Tabela de sites monitorados
CREATE TABLE IF NOT EXISTS monitored_sites (
    id SERIAL PRIMARY KEY,
    url VARCHAR(500) NOT NULL,
    name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'active',
    last_scan TIMESTAMP,
    vulnerabilities INTEGER DEFAULT 0,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Adicionar coluna vulnerabilities se não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='monitored_sites' AND column_name='vulnerabilities') THEN
        ALTER TABLE monitored_sites ADD COLUMN vulnerabilities INTEGER DEFAULT 0;
    END IF;
END $$;

-- Índices para sites monitorados
CREATE INDEX IF NOT EXISTS idx_monitored_sites_user_id ON monitored_sites(user_id);
CREATE INDEX IF NOT EXISTS idx_monitored_sites_status ON monitored_sites(status);
CREATE INDEX IF NOT EXISTS idx_monitored_sites_url ON monitored_sites(url);

-- Tabela de logs de segurança
CREATE TABLE IF NOT EXISTS security_logs (
    id SERIAL PRIMARY KEY,
    site_id INTEGER REFERENCES monitored_sites(id) ON DELETE SET NULL,
    log_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) DEFAULT 'info',
    message TEXT NOT NULL,
    details JSONB,
    ip_address VARCHAR(45),
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para logs de segurança
CREATE INDEX IF NOT EXISTS idx_security_logs_site_id ON security_logs(site_id);
CREATE INDEX IF NOT EXISTS idx_security_logs_type ON security_logs(log_type);
CREATE INDEX IF NOT EXISTS idx_security_logs_severity ON security_logs(severity);
CREATE INDEX IF NOT EXISTS idx_security_logs_created_at ON security_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_security_logs_user_id ON security_logs(user_id);

-- Tabela de alertas importados do ZAP
CREATE TABLE IF NOT EXISTS security_alerts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    risk VARCHAR(50),
    url TEXT,
    description TEXT,
    solution TEXT,
    status VARCHAR(20) DEFAULT 'open',
    acknowledged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para alertas importados
CREATE INDEX IF NOT EXISTS idx_security_alerts_risk ON security_alerts(risk);

-- Adicionar coluna acknowledged se não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='security_alerts' AND column_name='acknowledged') THEN
        ALTER TABLE security_alerts ADD COLUMN acknowledged BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Adicionar coluna status se não existir
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='security_alerts' AND column_name='status') THEN
        ALTER TABLE security_alerts ADD COLUMN status VARCHAR(20) DEFAULT 'open';
    END IF;
END $$;

-- Tabela de configurações administrativas
CREATE TABLE IF NOT EXISTS admin_config (
    id SERIAL PRIMARY KEY,
    master_key VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Função para gerar chave mestra aleatória
CREATE OR REPLACE FUNCTION generate_master_key()
RETURNS VARCHAR(255) AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    result VARCHAR(255) := '';
    i INTEGER;
    char_index INTEGER;
BEGIN
    FOR i IN 1..20 LOOP
        char_index := floor(random() * length(chars) + 1)::INTEGER;
        result := result || substr(chars, char_index, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Inicializar chave mestra se não existir
DO $$
DECLARE
    key_exists BOOLEAN;
    new_key VARCHAR(255);
BEGIN
    SELECT EXISTS(SELECT 1 FROM admin_config) INTO key_exists;
    
    IF NOT key_exists THEN
        new_key := generate_master_key();
        INSERT INTO admin_config (master_key) VALUES (new_key);
        RAISE NOTICE 'Chave mestra gerada: %', new_key;
    END IF;
END $$;