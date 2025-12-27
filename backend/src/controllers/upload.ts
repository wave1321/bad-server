import { NextFunction, Request, Response } from 'express'
import { constants } from 'http2'
import path from 'path'
import fs from 'fs'
import BadRequestError from '../errors/bad-request-error'

function checkImageSignature(buffer: Buffer): boolean {
    if (buffer.length < 8) return false;
    
    const hex = buffer.slice(0, 8).toString('hex');
    const header = buffer.slice(0, 3).toString();
    
    // PNG: первые 8 байт = 89 50 4E 47 0D 0A 1A 0A
    if (hex === '89504e470d0a1a0a') return true;
    
    // JPEG: первые 2 байт = FF D8
    if (hex.startsWith('ffd8')) return true;
    
    // GIF: первые 3 байта = "GIF"
    if (header === 'GIF') return true;
    
    return false;
}

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

    try {
        // Проверяем, что файл действительно изображение по содержимому
        const filePath = path.join(req.file.destination, req.file.filename);
        const fileBuffer = fs.readFileSync(filePath);
        
        // Проверяем сигнатуры файлов
        const isImage = checkImageSignature(fileBuffer);
        
        if (!isImage) {
            // Удаляем файл если это не изображение
            fs.unlinkSync(filePath);
            return next(new BadRequestError('Файл не является изображением'));
        }

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
