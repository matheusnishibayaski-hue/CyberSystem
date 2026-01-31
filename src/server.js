require('dotenv-flow').config();
const { loadSecrets } = require('./utils/secrets');

const PORT = process.env.PORT || 3000;

let app = null;

// Helper function to find process using port (Windows)
function findProcessUsingPort(port) {
  try {
    const { execSync } = require('child_process');
    const command = `netstat -ano | findstr :${port}`;
    const output = execSync(command, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    const lines = output.trim().split('\n').filter(line => line.trim());
    
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      // Procurar por qualquer linha que contenha a porta e tenha um PID
      if (parts.length >= 5) {
        // Verificar se a porta está na linha (pode estar em diferentes posições)
        const portMatch = line.match(/:(\d+)/);
        if (portMatch && portMatch[1] === port.toString()) {
          // PID geralmente é o último número na linha
          const pid = parts[parts.length - 1];
          if (pid && /^\d+$/.test(pid)) {
            return pid;
          }
        }
      }
    }
  } catch (error) {
    // Command failed or no process found
    return null;
  }
  return null;
}

// Helper function to kill process by PID (Windows)
function killProcessByPid(pid) {
  try {
    const { execSync } = require('child_process');
    execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
    return true;
  } catch (error) {
    return false;
  }
}

// Handle server errors
function handleServerError(err, onProcessKilled = null) {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Error: Port ${PORT} is already in use\n`);
    
    // Try to find the PID
    const pid = findProcessUsingPort(PORT);
    
    if (pid) {
      console.error(`   Process ID (PID) using port ${PORT}: ${pid}`);
      
      // Em desenvolvimento, tentar matar automaticamente se for processo Node.js
      if (process.env.NODE_ENV === 'development') {
        try {
          const { execSync } = require('child_process');
          // Verificar se é um processo Node.js
          const processInfo = execSync(`tasklist /FI "PID eq ${pid}" /FO CSV /NH`, { encoding: 'utf8' });
          if (processInfo.includes('node.exe')) {
            console.error(`\n   🔄 Tentando encerrar processo Node.js automaticamente...`);
            if (killProcessByPid(pid)) {
              console.error(`   ✅ Processo ${pid} encerrado com sucesso!`);
              console.error(`   ⏳ Aguardando 2 segundos para o sistema liberar a porta...\n`);
              
              // Se há callback, chamar para tentar reiniciar
              if (onProcessKilled && typeof onProcessKilled === 'function') {
                onProcessKilled();
                return; // Não executar process.exit abaixo
              } else {
                // Caso contrário, sair e deixar nodemon reiniciar
                setTimeout(() => {
                  console.log(`   🔄 Nodemon irá reiniciar automaticamente...\n`);
                  process.exit(0); // Exit com sucesso para nodemon reiniciar
                }, 2000);
                return;
              }
            } else {
              console.error(`   ⚠️  Não foi possível encerrar o processo automaticamente.\n`);
            }
          }
        } catch (error) {
          // Ignorar erros ao tentar verificar/matar processo
        }
      }
      
      console.error('💡 Solutions:');
      console.error(`   1. Kill the process directly:`);
      console.error(`      taskkill /PID ${pid} /F`);
    } else {
      console.error('💡 Solutions:');
      console.error(`   1. Find and stop the process using port ${PORT}:`);
      console.error(`      netstat -ano | findstr :${PORT}`);
      console.error(`      taskkill /PID <PID> /F`);
    }
    console.error(`\n   2. Use a different port by setting PORT in .env file`);
    console.error(`   3. Kill all Node.js processes:`);
    console.error(`      Get-Process node | Stop-Process\n`);
    
    if (!pid || process.env.NODE_ENV !== 'development') {
      process.exit(1);
    }
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
}

// Initialize Database and Start Server
let retryCount = 0;
const MAX_RETRIES = 3;

const startServer = async (isRetry = false) => {
  try {
    await loadSecrets();

    // Development defaults to avoid 500s when secrets are missing
    if (process.env.NODE_ENV === 'development') {
      if (!process.env.JWT_SECRET) {
        console.warn('⚠️ JWT_SECRET não configurado. Defina no .env.');
      }
      if (!process.env.SESSION_SECRET) {
        console.warn('⚠️ SESSION_SECRET não configurado. Defina no .env.');
      }
    }

    if (!app) {
      app = require('./app');
    }

    const { testConnection } = require('./config/db.config');
    const initDatabase = require('./database/init');

    if (isRetry) {
      retryCount++;
      if (retryCount > MAX_RETRIES) {
        console.error(`\n❌ Máximo de tentativas (${MAX_RETRIES}) atingido. Por favor, verifique manualmente.\n`);
        process.exit(1);
      }
      console.log(`\n🔄 Tentativa ${retryCount} de ${MAX_RETRIES}...\n`);
    } else {
      retryCount = 0;
    }

    // Test database connection
    console.log('🔄 Verificando conexão com banco de dados...');
    const connected = await testConnection();
    
    if (!connected) {
      console.error('❌ Falha ao conectar ao banco de dados. Verifique as configurações.');
      process.exit(1);
    }

    // Initialize database tables
    await initDatabase();

    // Start Server with error handling
    const server = app.listen(PORT, () => {
      console.log('Servidor iniciado');
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔒 Security features enabled`);
      console.log(`💾 Database: ${process.env.DB_NAME} @ ${process.env.DB_HOST}:${process.env.DB_PORT}`);
      retryCount = 0; // Reset contador ao iniciar com sucesso
    });

    // Handle server errors
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        handleServerError(err, () => {
          // Callback para tentar novamente após encerrar processo
          setTimeout(() => {
            startServer(true).catch(() => {
              process.exit(1);
            });
          }, 2000);
        });
      } else {
        handleServerError(err);
      }
    });

    return server;
  } catch (error) {
    // Handle EADDRINUSE in catch block as well
    if (error.code === 'EADDRINUSE') {
      handleServerError(error, () => {
        // Callback para tentar novamente após encerrar processo
        setTimeout(() => {
          startServer(true).catch(() => {
            process.exit(1);
          });
        }, 2000);
      });
    } else {
      console.error('❌ Erro ao inicializar servidor:', error);
      process.exit(1);
    }
  }
};

if (require.main === module) {
  startServer().catch((error) => {
    // Handle EADDRINUSE in promise catch
    if (error.code === 'EADDRINUSE') {
      handleServerError(error, () => {
        // Callback para tentar novamente após encerrar processo
        setTimeout(() => {
          startServer(true).catch(() => {
            process.exit(1);
          });
        }, 2000);
      });
    } else {
      console.error('❌ Falha crítica ao iniciar servidor:', error);
      process.exit(1);
    }
  });
}

