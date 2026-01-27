require('dotenv').config();
const { Pool } = require('pg');

// Configuração do pool de conexões PostgreSQL
const pool = new Pool({
  host: process.env.DB_HOST || 'painellinux.fabricadetempo.cloud',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'CyberSystem',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '83e93176b68d4e97dadc5fc34e3aa331',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  max: 20, // máximo de clientes no pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Testa a conexão
pool.on('connect', () => {
  console.log('✅ Conectado ao banco de dados PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Erro inesperado no pool do PostgreSQL:', err);
  process.exit(-1);
});

// Função para testar conexão
const testConnection = async () => {
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Conexão com banco de dados estabelecida:', result.rows[0].now);
    return true;
  } catch (error) {
    console.error('❌ Erro ao conectar ao banco de dados:', error.message);
    return false;
  }
};

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
  testConnection
};
