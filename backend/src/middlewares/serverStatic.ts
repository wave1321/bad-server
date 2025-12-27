import { NextFunction, Request, Response } from 'express'
import fs from 'fs'
import path from 'path'

export default function serveStatic(baseDir: string) {
    return (req: Request, res: Response, next: NextFunction) => {
        // Определяем полный путь к запрашиваемому файлу
        const normalizedPath = path.normalize(req.path).replace(/^(\.\.[/\\])+/, '');
        const filePath = path.join(baseDir, normalizedPath)

        const relativePath = path.relative(baseDir, filePath);
        if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
            return next(); // Отдаем 404
        }
        // Проверяем, существует ли файл
        fs.access(filePath, fs.constants.F_OK, (err) => {
            if (err) {
                // Файл не существует отдаем дальше мидлварам
                return next()
            }
            // Файл существует, отправляем его клиенту
            // eslint-disable-next-line @typescript-eslint/no-shadow
            return res.sendFile(filePath, (err) => {
                if (err) {
                    next(err)
                }
            })
        })
    }
}
