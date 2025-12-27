import { Request, Express } from 'express'
import multer, { FileFilterCallback } from 'multer'
import { join } from 'path'
import crypto from 'crypto'

type DestinationCallback = (error: Error | null, destination: string) => void
type FileNameCallback = (error: Error | null, filename: string) => void

const storage = multer.diskStorage({
    destination: (
        _req: Request,
        _file: Express.Multer.File,
        cb: DestinationCallback
    ) => {
        cb(
            null,
            join(
                __dirname,
                process.env.UPLOAD_PATH_TEMP
                    ? `../public/${process.env.UPLOAD_PATH_TEMP}`
                    : '../public'
            )
        )
    },

    filename: (
        _req: Request,
        file: Express.Multer.File,
        cb: FileNameCallback
    ) => {
        const fileExt = file.originalname.split('.').pop();
        const uniqueName = `${crypto.randomBytes(16).toString('hex')  }.${  fileExt}`;
        cb(null, uniqueName);
    },
})

const types = [
    'image/png',
    'image/jpg',
    'image/jpeg',
    'image/gif',
    'image/svg+xml',
]

const allowedExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.svg'];

const fileFilter = (
    _req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback
) => {
    // Проверка MIME типа
    if (!types.includes(file.mimetype)) {
        return cb(new Error('Неподдерживаемый тип файла'));
    }

    const fileExt = file.originalname.toLowerCase().substring(file.originalname.lastIndexOf('.'));

    // Проверка что файл имеет расширение
    if (!fileExt || fileExt.length < 2) {
        return cb(new Error('Файл не имеет расширения'));
    }

    // Проверка расширения файла
    if (!allowedExtensions.includes(fileExt)) {
        return cb(new Error('Неподдерживаемое расширение файла'));
    }

    // Проверка соответствия расширения и MIME типа
    const mimeToExt: Record<string, string[]> = {
        'image/jpeg': ['.jpg', '.jpeg'],
        'image/png': ['.png'],
        'image/gif': ['.gif'],
        'image/svg+xml': ['.svg'],
    };
    
    const allowedExts = mimeToExt[file.mimetype];
    if (!allowedExts || !allowedExts.includes(fileExt)) {
        return cb(new Error('Несоответствие типа файла и расширения'));
    }
    
    // Проверка имени файла на опасные символы
    const dangerousChars = /[<>:"/\\|?*]|\.\./;
    if (dangerousChars.test(file.originalname)) {
        return cb(new Error('Недопустимое имя файла'));
    }

    // Проверка размера имени файла
    if (file.originalname.length > 255) {
        return cb(new Error('Имя файла слишком длинное'));
    }

    return cb(null, true)
}

export default multer({ 
    storage, 
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB максимум
        files: 1, // только один файл
    }
})
