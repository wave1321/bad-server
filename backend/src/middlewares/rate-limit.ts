import rateLimit from 'express-rate-limit'

// Для маршрутов по умолчанию
export const globalLimiter = rateLimit({
    windowMs: 10 * 1000,
    max: 10,
    message: { 
        error: 'Слишком много запросов, попробуйте позже' 
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false, // считать ВСЕ запросы
    keyGenerator: (req) => 
        // Используем IP адрес
         req.ip || req.headers['x-forwarded-for'] as string || 'unknown'
    
});

// Для API
export const apiLimiter = rateLimit({
    windowMs: 10 * 1000,
    max: 5,
    message: 'Слишком много запросов с этого IP, попробуйте позже',
    standardHeaders: true,
    legacyHeaders: false,
})

// Более строгий лимитер для авторизации
export const authLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: 'Слишком много попыток входа, попробуйте позже',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
})