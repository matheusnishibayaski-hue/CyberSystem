require('dotenv-flow').config();
const { query } = require('../src/config/db.config');

async function getMasterKey() {
  try {
    const result = await query(
      'SELECT master_key FROM admin_config ORDER BY id DESC LIMIT 1'
    );

    if (result.rows.length === 0) {
      console.log('❌ Chave mestra não encontrada. Execute a inicialização do banco de dados.');
      process.exit(1);
    }

    console.log('\n🔑 CHAVE MESTRA DO SISTEMA');
    console.log('═'.repeat(50));
    console.log(result.rows[0].master_key);
    console.log('═'.repeat(50));
    console.log('\n⚠️  GUARDE ESTA CHAVE EM LOCAL SEGURO!');
    console.log('   Ela é necessária para acessar a área administrativa.\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao obter chave mestra:', error.message);
    process.exit(1);
  }
}

getMasterKey();
