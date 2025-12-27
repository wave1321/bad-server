import { NextFunction, Request, Response } from 'express'
import { constants } from 'http2'
import path from 'path'
import fs from 'fs'
import BadRequestError from '../errors/bad-request-error'

export const uploadFile = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    if (!req.file) {
        return next(new BadRequestError('Файл не загружен'))
    }

    // Дополнительная проверка минимального размера (больше 2kb)
    if (req.file.size < 2 * 1024) {
        // Удаляем загруженный файл, если он не прошел проверку
        const filePath = path.join(req.file.destination, req.file.filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        return next(new BadRequestError('Файл слишком маленький. Минимальный размер: 2KB'));
    }

    // Строгая проверка MIME типа
    const allowedMimeTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png', 
        'image/gif'
    ];
    
    // Проверяем что MIME тип точно соответствует изображению
    if (!allowedMimeTypes.includes(req.file.mimetype)) {
        const filePath = path.join(req.file.destination, req.file.filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        return next(new BadRequestError('Неверный тип файла'));
    }

    // Проверка расширения
    const fileExt = path.extname(req.file.originalname).toLowerCase();
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
    
    if (!allowedExtensions.includes(fileExt)) {
        const filePath = path.join(req.file.destination, req.file.filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        return next(new BadRequestError('Неверное расширение файла'));
    }

    // Проверка соответствия MIME типа и расширения
    const mimeToExt: Record<string, string[]> = {
        'image/jpeg': ['.jpg', '.jpeg'],
        'image/jpg': ['.jpg', '.jpeg'],
        'image/png': ['.png'],
        'image/gif': ['.gif'],
    };

    const allowedExts = mimeToExt[req.file.mimetype];
    if (!allowedExts || !allowedExts.includes(fileExt)) {
        const filePath = path.join(req.file.destination, req.file.filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        return next(new BadRequestError('Несоответствие типа и расширения файла'));
    }

    try {
        const fileName = process.env.UPLOAD_PATH_TEMP
            ? `/${process.env.UPLOAD_PATH_TEMP}/${req.file.filename}`
            : `/temp/${req.file.filename}`
        return res.status(constants.HTTP_STATUS_CREATED).send({
            fileName,
            originalName: req.file.originalname,
        })
    } catch (error) {
        // Удаляем файл при ошибке
        const filePath = path.join(req.file.destination, req.file.filename);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        return next(error)
    }
}

export default {}
