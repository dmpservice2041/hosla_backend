import sharp from 'sharp';
import fs from 'fs/promises';
import { AppError } from '../utils/AppError';
import { ErrorCode } from '../utils/errorCodes';
import logger from '../utils/logger';

export class UploadService {
    static async processImage(file: Express.Multer.File, outputConfig?: { quality?: number; width?: number }): Promise<string> {
        try {
            const { path: filePath, filename } = file;
            const outputFilename = `compressed-${filename}`;
            const outputPath = `${file.destination}/${outputFilename}`;

            const quality = outputConfig?.quality || 80;
            const width = outputConfig?.width;

            let pipeline = sharp(filePath);

            if (width) {
                pipeline = pipeline.resize(width);
            }

            if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg') {
                pipeline = pipeline.jpeg({ quality });
            } else if (file.mimetype === 'image/png') {
                pipeline = pipeline.png({ quality });
            } else if (file.mimetype === 'image/webp') {
                pipeline = pipeline.webp({ quality });
            }

            await pipeline.toFile(outputPath);

            await fs.unlink(filePath);

            return outputFilename;
        } catch (error) {
            logger.error('Error processing image:', error);
            throw new AppError(ErrorCode.INTERNAL_ERROR, 'Failed to process image');
        }
    }

    static async deleteFile(filename: string): Promise<void> {
        try {
            const filePath = `uploads/${filename}`;
            await fs.unlink(filePath);
        } catch (error) {
            logger.warn(`Failed to delete file ${filename}:`, error);
        }
    }
}
