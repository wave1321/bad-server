import rateLimit from 'express-rate-limit'

// Базовый лимитер для API
export const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 минут
    max: 100, // максимум 100 запросов за 15 минут
    message: 'Слишком много запросов с этого IP, попробуйте позже',
    standardHeaders: true,
    legacyHeaders: false,
})

// Более строгий лимитер для авторизации
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // максимум 5 попыток входа
    message: 'Слишком много попыток входа, попробуйте позже',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
})