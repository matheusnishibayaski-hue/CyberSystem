require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool, testConnection } = require('../config/db.config');

const initDatabase = async () => {
  try {
    console.log('🔄 Inicializando banco de dados...');
    
    // Testa conexão
    const connected = await testConnection();
    if (!connected) {
      throw new Error('Não foi possível conectar ao banco de dados');
    }

    // Lê o arquivo SQL
    const sqlPath = path.join(__dirname, 'init.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Executa o SQL
    await pool.query(sql);
    
    console.log('✅ Tabelas criadas/verificadas com sucesso!');
    console.log('📊 Tabelas disponíveis:');
    console.log('   - users (usuários do sistema)');
    console.log('   - revoked_tokens (tokens revogados)');
    console.log('   - login_attempts (tentativas de login)');
    console.log('   - monitored_sites (sites monitorados)');
    console.log('   - security_logs (logs de segurança)');
    
    return true;
  } catch (error) {
    console.error('❌ Erro ao inicializar banco de dados:', error.message);
    console.error(error);
    throw error;
  }
};

// Executa se chamado diretamente
if (require.main === module) {
  initDatabase()
    .then(() => {
      console.log('✅ Inicialização concluída!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Falha na inicialização:', error);
      process.exit(1);
    });
}

module.exports = initDatabase;
