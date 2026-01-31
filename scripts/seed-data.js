/**
 * Script para popular o banco de dados com dados de exemplo
 * Execute: node scripts/seed-data.js
 */

require('dotenv-flow').config();
const { query } = require('../src/config/db.config');

async function seedData() {
  try {
    console.log('🌱 Iniciando seed de dados...');

    // Buscar o primeiro usuário (ou criar um de teste)
    const usersResult = await query('SELECT id FROM users LIMIT 1');
    
    if (usersResult.rows.length === 0) {
      console.log('❌ Nenhum usuário encontrado. Crie um usuário primeiro através do registro.');
      process.exit(1);
    }

    const userId = usersResult.rows[0].id;
    console.log(`✅ Usando usuário ID: ${userId}`);

    // Adicionar sites de exemplo
    const exampleSites = [
      { url: 'https://example.com', name: 'Example Site' },
      { url: 'https://github.com', name: 'GitHub' },
      { url: 'https://stackoverflow.com', name: 'Stack Overflow' }
    ];

    console.log('📝 Adicionando sites de exemplo...');
    for (const site of exampleSites) {
      // Verificar se já existe
      const existing = await query(
        'SELECT id FROM monitored_sites WHERE url = $1 AND user_id = $2',
        [site.url, userId]
      );

      if (existing.rows.length === 0) {
        await query(
          'INSERT INTO monitored_sites (url, name, user_id, status) VALUES ($1, $2, $3, $4)',
          [site.url, site.name, userId, 'active']
        );
        console.log(`  ✅ Site adicionado: ${site.name}`);
      } else {
        console.log(`  ⏭️  Site já existe: ${site.name}`);
      }
    }

    // Buscar sites para criar logs
    const sitesResult = await query(
      'SELECT id, url FROM monitored_sites WHERE user_id = $1 LIMIT 3',
      [userId]
    );

    if (sitesResult.rows.length > 0) {
      console.log('📋 Adicionando logs de exemplo...');
      
      const logTypes = ['scan', 'security', 'access', 'system'];
      const severities = ['info', 'warning', 'success', 'error'];
      const messages = [
        'Scan de segurança iniciado',
        'Vulnerabilidade XSS detectada',
        'Login bem-sucedido',
        'Tentativa de acesso não autorizado bloqueada',
        'Scan completo finalizado',
        'Sistema atualizado com sucesso',
        'Alerta de segurança: múltiplas tentativas de login',
        'Backup automático realizado'
      ];

      for (let i = 0; i < 20; i++) {
        const site = sitesResult.rows[Math.floor(Math.random() * sitesResult.rows.length)];
        const logType = logTypes[Math.floor(Math.random() * logTypes.length)];
        const severity = severities[Math.floor(Math.random() * severities.length)];
        const message = messages[Math.floor(Math.random() * messages.length)];

        // Criar data aleatória nos últimos 7 dias
        const daysAgo = Math.floor(Math.random() * 7);
        const createdAt = new Date();
        createdAt.setDate(createdAt.getDate() - daysAgo);
        createdAt.setHours(Math.floor(Math.random() * 24));
        createdAt.setMinutes(Math.floor(Math.random() * 60));

        await query(
          `INSERT INTO security_logs 
           (site_id, log_type, severity, message, user_id, created_at) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [site.id, logType, severity, message, userId, createdAt]
        );
      }
      console.log(`  ✅ ${20} logs adicionados`);
    }

    console.log('✅ Seed de dados concluído com sucesso!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao fazer seed:', error);
    process.exit(1);
  }
}

seedData();
