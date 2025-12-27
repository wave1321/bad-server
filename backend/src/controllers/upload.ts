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

    // Проверка соответствия MIME-типа и расширения (дополнительная проверка)
    const fileExt = req.file.originalname.toLowerCase().substring(
        req.file.originalname.lastIndexOf('.')
    );

    const mimeToExt: Record<string, string[]> = {
        'image/jpeg': ['.jpg', '.jpeg'],
        'image/png': ['.png'],
        'image/gif': ['.gif'],
    };

    if (mimeToExt[req.file.mimetype]) {
        const allowedExts = mimeToExt[req.file.mimetype];
        if (!allowedExts.includes(fileExt)) {
            const filePath = path.join(req.file.destination, req.file.filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            return next(new BadRequestError(`Для MIME типа ${req.file.mimetype} ожидаются расширения: ${allowedExts.join(', ')}`));
        }
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
