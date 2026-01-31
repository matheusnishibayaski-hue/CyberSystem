let logger = console;
import('./utils/logger.js')
  .then(({ logger: pinoLogger }) => {
    logger = pinoLogger;
  })
  .catch(() => {
    console.warn('⚠️ Logger não inicializado. Usando console.');
  });

const requiredEnvs = [
  'DB_HOST',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
  'JWT_SECRET',
  'MASTER_KEY'
];

requiredEnvs.forEach(env => {
  if (!process.env[env]) {
    throw new Error(`Variável de ambiente ${env} não configurada`);
  }
});

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes = require('./routes/auth.routes');
const protectedRoutes = require('./routes/protected.routes');

const app = express();

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
  allowedHeaders: ['Content-Type', 'Authorization', 'x-master-key']
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
    const key = req.ip;

    if (typeof authLimiter.resetKey === 'function') {
      authLimiter.resetKey(key);
    } else if (authLimiter.store?.resetKey) {
      authLimiter.store.resetKey(key);
    }

    if (typeof generalLimiter.resetKey === 'function') {
      generalLimiter.resetKey(key);
    } else if (generalLimiter.store?.resetKey) {
      generalLimiter.store.resetKey(key);
    }

    res.json({
      message: 'Rate limit resetado para este IP.',
      ip: key,
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
  const status = err.status || 500;

  // Log estruturado (sem stack em produção)
  const logPayload = {
    level: 'error',
    route: req.originalUrl,
    message: err.message
  };
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    logPayload.stack = err.stack;
  }
  logger.error(logPayload);

  res.status(status).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  });
});

module.exports = app;
