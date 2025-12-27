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

    const fileName = file.originalname.toLowerCase();
    const fileExt = fileName.substring(file.originalname.lastIndexOf('.'));

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
        'image/jpeg': ['.jpg', '.jpeg', '.jpe', '.jif', '.jfif', '.jfi'],
        'image/png': ['.png'],
        'image/gif': ['.gif'],
        'image/svg+xml': ['.svg', '.svgz'],
    };
    
    // Если MIME тип есть в нашем маппинге, проверяем расширение
    const allowedExts = mimeToExt[file.mimetype];
    if (allowedExts) {
        if (!allowedExts.includes(fileExt)) {
            return cb(new Error(`Для MIME типа ${file.mimetype} ожидаются расширения: ${allowedExts.join(', ')}`));
        }
    } else {
        return cb(new Error(`MIME тип ${file.mimetype} не поддерживается`));
    }

    // Проверка на двойные расширения (например: photo.jpg.exe или image.png.php)
    const parts = fileName.split('.');
    if (parts.length > 2) {
        // Проверяем последнее расширение
        const lastExt = `.${  parts[parts.length - 1]}`;
        if (!allowedExtensions.includes(lastExt)) {
            return cb(new Error('Файл имеет несколько расширений'));
        }
        
        // Также проверяем средние части на опасные расширения
        const dangerousMiddleParts = ['php', 'exe', 'js', 'html', 'htm', 'asp', 'aspx', 'jar', 'war'];
        for (let i = 1; i < parts.length - 1; i+=1) {
            if (dangerousMiddleParts.includes(parts[i])) {
                return cb(new Error('Файл содержит опасные расширения'));
            }
        }
    }
    
    // Проверка имени файла на опасные символы
    const dangerousPatterns = [
        // eslint-disable-next-line no-control-regex
        /[<>:"/\\|?*\x00-\x1F]/, // Опасные символы
        /\.\./, // Попытка пути
        /^(con|prn|aux|nul|com[0-9]|lpt[0-9])$/i, // Зарезервированные имена Windows
        /\.(php|exe|js|html|htm|asp|aspx|jar|war|sh|bat|cmd|ps1)$/i, // Опасные расширения где-либо в имени
    ];
    
    // eslint-disable-next-line no-restricted-syntax
    for (const pattern of dangerousPatterns) {
        if (pattern.test(fileName)) {
            return cb(new Error('Недопустимое имя файла'));
        }
    }

    // Проверка размера имени файла
    if (file.originalname.length > 255) {
        return cb(new Error('Имя файла слишком длинное'));
    }

    // Проверка на пустое имя файла
    if (!file.originalname.trim()) {
        return cb(new Error('Имя файла не может быть пустым'));
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
