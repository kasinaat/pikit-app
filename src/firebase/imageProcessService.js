import { Operations } from '../enums/operations.js';
import modelService from './modelService.js';
import fs from 'fs/promises';
import Item from './models/items.js';
import Bill from './models/bills.js';

class ImageProcessingService {
    constructor() {
        this.modelService = modelService;
    }
    
    async processWithOperation(file, operation, customPrompt = null, modelType = "gemini-2.5-flash") {
        try {
            this.validateFile(file);
            
            const fileBuffer = await fs.readFile(file.path);
            
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
            console.error(`Error in ${operation}:`, error);
            await this.cleanupFile(file.path);
            throw new Error(`${operation} processing failed: ${error.message}`);
        }
    }

    async detectObjects(file, customPrompt = null) {
        const result =  await this.processWithOperation(file, Operations.OBJECT_DETECTION, customPrompt);
        const items = result.response.objects.map(item => new Item(item));
        await Promise.all(items.map(item => item.save()));
        await this.cleanupFile(file.path);
        return result;
    }

    async extractBillData(file, customPrompt = null) {
        const result = await this.processWithOperation(file, Operations.BILL_EXTRACTION , customPrompt);
        const bill = new Bill(result.response);
        await bill.save();
        await this.cleanupFile(file.path);
        return result;
    }

    async cleanupFile(filePath) {
        try {
            await fs.unlink(filePath);
            console.log(`Cleaned up temporary file: ${filePath}`);
        } catch (error) {
            console.warn(`Failed to cleanup file ${filePath}:`, error.message);
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