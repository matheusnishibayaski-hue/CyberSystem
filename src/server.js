require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const session = require('express-session');
const { testConnection } = require('./config/db.config');
const initDatabase = require('./database/init');

const authRoutes = require('./routes/auth.routes');
const protectedRoutes = require('./routes/protected.routes');

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware - Helmet with custom configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding if needed
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  }
}));

// Body Parser (must be before rate limiting)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// CORS Configuration
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({
  origin: corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// General Rate Limiting - Applied to all routes
// Em desenvolvimento, limites mais permissivos para suportar polling automático
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' 
    ? parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 500  // 500 em desenvolvimento (suporta polling)
    : parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 em produção
  message: {
    error: 'Too many requests',
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  skip: (req) => {
    // Skip rate limiting for health check
    return req.path === '/health';
  }
});

// Stricter Rate Limiting for Authentication endpoints
// Em desenvolvimento, permitir mais tentativas para facilitar testes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 50 : 5, // Mais permissivo em desenvolvimento
  message: {
    error: 'Too many authentication attempts',
    message: 'Too many login attempts from this IP, please try again after 15 minutes.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  // Em desenvolvimento, usar store em memória que pode ser resetado
  store: process.env.NODE_ENV === 'development' ? undefined : undefined, // Usar store padrão
});

// Rate limiting mais permissivo para rotas de leitura do dashboard (polling automático)
const dashboardLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' ? 1000 : 300, // Muito permissivo para polling
  message: {
    error: 'Too many requests',
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false
});

// Apply rate limiting
// IMPORTANTE: Aplicar rate limiters específicos ANTES do geral para que tenham prioridade
app.use('/api/auth/login', authLimiter); // Stricter limit for login
app.use('/api/auth/register', authLimiter); // Stricter limit for register

// Rotas de dashboard com limite mais permissivo (para suportar polling automático)
// Aplicar ANTES do generalLimiter para ter prioridade
app.use('/api/protected/dashboard', dashboardLimiter);
app.use('/api/protected/scans/reports', dashboardLimiter); // Relatórios também precisam de polling

// Aplicar rate limiting geral em todas as outras rotas
app.use(generalLimiter); // Apply to all routes

// Session Configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-this-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/protected', protectedRoutes); // Rotas protegidas

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Reset rate limiting (apenas em desenvolvimento)
if (process.env.NODE_ENV === 'development') {
  app.post('/api/dev/reset-rate-limit', (req, res) => {
    // Resetar o rate limiting reiniciando o servidor ou limpando o store
    // Como o rate limiting usa store em memória, precisamos reiniciar o servidor
    // Mas podemos retornar uma mensagem útil
    res.json({
      message: 'Para resetar o rate limiting, reinicie o servidor. O rate limiting será resetado automaticamente.',
      note: 'Em desenvolvimento, o limite é de 50 tentativas a cada 15 minutos.'
    });
  });
}

// 404 Handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.path
  });
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// Helper function to find process using port (Windows)
function findProcessUsingPort(port) {
  try {
    const { execSync } = require('child_process');
    const command = `netstat -ano | findstr :${port}`;
    const output = execSync(command, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] });
    const lines = output.trim().split('\n');
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 5 && parts[3] === `0.0.0.0:${port}`) {
        return parts[parts.length - 1]; // Return PID
      }
    }
  } catch (error) {
    // Command failed or no process found
    return null;
  }
  return null;
}

// Handle server errors
function handleServerError(err) {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ Error: Port ${PORT} is already in use\n`);
    
    // Try to find the PID
    const pid = findProcessUsingPort(PORT);
    
    console.error('💡 Solutions:');
    if (pid) {
      console.error(`   Process ID (PID) using port ${PORT}: ${pid}`);
      console.error(`\n   1. Kill the process directly:`);
      console.error(`      taskkill /PID ${pid} /F`);
    } else {
      console.error(`   1. Find and stop the process using port ${PORT}:`);
      console.error(`      netstat -ano | findstr :${PORT}`);
      console.error(`      taskkill /PID <PID> /F`);
    }
    console.error(`\n   2. Use a different port by setting PORT in .env file`);
    console.error(`   3. Kill all Node.js processes:`);
    console.error(`      Get-Process node | Stop-Process\n`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
}

// Initialize Database and Start Server
const startServer = async () => {
  try {
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
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔒 Security features enabled`);
      console.log(`💾 Database: ${process.env.DB_NAME} @ ${process.env.DB_HOST}:${process.env.DB_PORT}`);
    });

    // Handle server errors
    server.on('error', handleServerError);

    return server;
  } catch (error) {
    // Handle EADDRINUSE in catch block as well
    if (error.code === 'EADDRINUSE') {
      handleServerError(error);
    } else {
      console.error('❌ Erro ao inicializar servidor:', error);
      process.exit(1);
    }
  }
};

const server = startServer().catch((error) => {
  // Handle EADDRINUSE in promise catch
  if (error.code === 'EADDRINUSE') {
    handleServerError(error);
  } else {
    console.error('❌ Falha crítica ao iniciar servidor:', error);
    process.exit(1);
  }
});

module.exports = app;

