const { Queue } = require('bullmq');
const Redis = require('ioredis');

let connection = null;
let scanQueue = null;
let initializationAttempted = false;
let redisUnavailable = false;

// Função para inicializar Redis de forma lazy (somente quando necessário)
function initializeRedis() {
  if (connection && scanQueue) {
    return { connection, scanQueue };
  }

  // Se já tentamos e Redis não está disponível, não tentar novamente
  if (redisUnavailable) {
    return { connection: null, scanQueue: null };
  }

  // Evitar múltiplas tentativas de inicialização simultâneas
  if (initializationAttempted) {
    return { connection, scanQueue };
  }

  initializationAttempted = true;

  try {
    // Criar conexão Redis com configuração para BullMQ
    // BullMQ requer maxRetriesPerRequest: null para funcionar corretamente
    connection = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: null, // Obrigatório para BullMQ
      enableReadyCheck: false,
      lazyConnect: true, // Não conectar imediatamente
      connectTimeout: 1000, // Timeout muito curto
      retryStrategy: () => null, // Não tentar reconectar automaticamente
      enableOfflineQueue: false,
      showFriendlyErrorStack: false, // Reduzir verbosidade de erros
    });

    // Suprimir completamente erros de conexão - Redis não é obrigatório
    const originalEmit = connection.emit.bind(connection);
    connection.emit = function(event, ...args) {
      // Suprimir eventos de erro relacionados a conexão
      if (event === 'error') {
        const err = args[0];
        if (err && (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND')) {
          redisUnavailable = true;
          return false; // Não emitir o evento
        }
      }
      return originalEmit(event, ...args);
    };

    connection.on('connect', () => {
      redisUnavailable = false;
      if (process.env.NODE_ENV === 'development') {
        console.log('[REDIS] ✅ Conectado ao Redis');
      }
    });

    // Criar a fila
    scanQueue = new Queue('scan-queue', { connection });

    return { connection, scanQueue };
  } catch (error) {
    redisUnavailable = true;
    connection = null;
    scanQueue = null;
    return { connection: null, scanQueue: null };
  }
}

// Função para obter scanQueue (inicializa se necessário)
function getScanQueue() {
  if (!scanQueue) {
    const result = initializeRedis();
    scanQueue = result.scanQueue;
  }
  return scanQueue;
}

module.exports = { 
  getScanQueue
};
