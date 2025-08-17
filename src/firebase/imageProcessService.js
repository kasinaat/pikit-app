import { Operations } from '../enums/operations.js';
import modelService from './modelService.js';
import fs from 'fs/promises';
import Item from './models/items.js';
import Bill from './models/bills.js';
import Logger from '../config/logger.js';

class ImageProcessingService {
    constructor() {
        this.modelService = modelService;
    }
    
    async processWithOperation(file, operation, customPrompt = null, modelType = "gemini-2.5-flash") {
        try {
            this.validateFile(file);
            
            const fileBuffer = file.buffer || await fs.readFile(file.path);
            
            const result = await this.modelService.processImage(
                fileBuffer, 
                file.mimetype, 
                operation, 
                customPrompt,
                modelType
            );

            return {
                success: true,
                operation: operation,
                model: modelType,
                response: result.response,
                fileName: file.originalname,
                fileSize: file.size,
                mimeType: file.mimetype,
                timestamp: new Date().toISOString(),
                prompt: result.prompt
            };

        } catch (error) {
            Logger.error(`Error in ${operation}`, { 
                operation, 
                error: error.message, 
                fileName: file?.originalname,
                fileSize: file?.size 
            });
            if (file.path) {
                await this.cleanupFile(file.path);
            }
            throw new Error(`${operation} processing failed: ${error.message}`);
        }
    }

    async detectObjects(file, customPrompt = null) {
        Logger.info('Starting object detection', { fileName: file.originalname, fileSize: file.size });
        const result =  await this.processWithOperation(file, Operations.OBJECT_DETECTION, customPrompt);
        const items = result.response.objects.map(item => new Item(item));
        await Promise.all(items.map(item => item.save()));
        Logger.info('Object detection completed', { objectCount: items.length, fileName: file.originalname });
        if (file.path) {
            await this.cleanupFile(file.path);
        }
        return result;
    }

    async extractBillData(file, customPrompt = null) {
        Logger.info('Starting bill extraction', { fileName: file.originalname, fileSize: file.size });
        const result = await this.processWithOperation(file, Operations.BILL_EXTRACTION , customPrompt);
        const bill = new Bill(result.response);
        await bill.save();
        Logger.info('Bill extraction completed', { 
            store: result.response?.data?.store, 
            itemCount: result.response?.data?.items?.length,
            fileName: file.originalname 
        });
        if (file.path) {
            await this.cleanupFile(file.path);
        }
        return result;
    }

    async cleanupFile(filePath) {
        try {
            await fs.unlink(filePath);
            Logger.debug('Cleaned up temporary file', { filePath });
        } catch (error) {
            Logger.warn('Failed to cleanup file', { filePath, error: error.message });
        }
    }

    validateFile(file) {
        if (!file) {
            throw new Error('No file provided');
        }

        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/jpg'];
        if (!allowedTypes.includes(file.mimetype)) {
            throw new Error(`Invalid file type. Allowed types: ${allowedTypes.join(', ')}`);
        }

        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
            throw new Error('File too large. Maximum size is 10MB.');
        }

        return true;
    }
}

const imageProcessingService = new ImageProcessingService();

export { imageProcessingService as default, ImageProcessingService };