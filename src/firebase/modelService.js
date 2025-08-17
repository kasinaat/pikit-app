import dotenv from "dotenv";
dotenv.config({ path: '.env' });
import { Operations, OperationVsPrompt } from "../enums/operations.js";
import { initializeApp } from "firebase/app";
import { getAI } from "firebase/ai";
import { GoogleAIBackend } from "firebase/ai";
import { getGenerativeModel } from "firebase/ai";
import { Schema } from "firebase/ai";
import { getFirestore } from "firebase/firestore";
import Logger from "../config/logger.js";

class ModelService {
    constructor() {
        this.firebaseConfig = {
            apiKey: process.env.FIREBASE_API_KEY,
            authDomain: process.env.FIREBASE_AUTH_DOMAIN,
            projectId: process.env.FIREBASE_PROJECT_ID,
            storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
            messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
            appId: process.env.FIREBASE_APP_ID,
            measurementId: process.env.FIREBASE_MEASUREMENT_ID
        };

        this.app = initializeApp(this.firebaseConfig);
        this.ai = getAI(this.app, { backend: new GoogleAIBackend() });
        this.db = getFirestore(this.app);
        this.schemas = this.initializeSchemas();
        this.prompts = this.initializePrompts();
        this.operations = Object.keys(this.schemas);
    }

    initializeSchemas() {
        return {
            [Operations.OBJECT_DETECTION]: Schema.object({
                properties: {
                    objects: Schema.array({
                        items: Schema.object({
                            properties: {
                                name: Schema.string(),
                                coordinates: Schema.object({
                                    properties: {
                                        xPoint: Schema.number(),
                                        yPoint: Schema.number(),
                                    }
                                }),
                                confidence: Schema.number(),
                            },
                        }),
                    }),
                }
            }),

            [Operations.BILL_EXTRACTION]: Schema.object({
                properties: {
                    items: Schema.array({
                        items: Schema.object({
                            properties: {
                                name: Schema.string(),
                                value: Schema.number(),
                                quantity: Schema.number(),
                                confidence: Schema.number(),
                            }
                        }),
                    }),
                    date: Schema.string(),
                    time: Schema.string(),
                    store: Schema.string(),
                    address: Schema.string(),
                    phone: Schema.string(),
                    totalAmount: Schema.number(),
                }
            })
        }
    }

    initializePrompts() {
        return {
            [Operations.OBJECT_DETECTION]: OperationVsPrompt[Operations.OBJECT_DETECTION],
            [Operations.BILL_EXTRACTION]: OperationVsPrompt[Operations.BILL_EXTRACTION]
        };
    }

    createModel(operation, modelType = "gemini-2.5-flash") {
        if (!this.schemas[operation]) {
            throw new Error(`Unknown operation: ${operation}. Available operations: ${this.operations.join(', ')}`);
        }

        return getGenerativeModel(this.ai, {
            model: modelType,
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: this.schemas[operation]
            }
        });
    }

    async processImage(imageBuffer, mimeType, operation, customPrompt = null, modelType = "gemini-2.5-flash") {
        try {
            Logger.info('Processing image with AI model', { 
                operation, 
                modelType, 
                mimeType,
                imageSize: imageBuffer.length,
                hasCustomPrompt: !!customPrompt 
            });
            
            if (!this.operations.includes(operation)) {
                throw new Error(`Invalid operation: ${operation}. Available: ${this.operations.join(', ')}`);
            }
            const model = this.createModel(operation, modelType);
            const prompt = customPrompt || this.prompts[operation];            
            const imagePart = {
                inlineData: { 
                    data: imageBuffer.toString('base64'), 
                    mimeType: mimeType 
                }
            };

            const result = await model.generateContent([prompt, imagePart]);
            const responseData = JSON.parse(result.response.text());
            
            Logger.info('AI model processing completed', { 
                operation, 
                modelType,
                responseSize: JSON.stringify(responseData).length 
            });
            
            return {
                success: true,
                operation: operation,
                model: modelType,
                response: responseData,
                prompt: prompt,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            Logger.error('Error in AI model processing', { 
                operation, 
                modelType, 
                error: error.message,
                mimeType 
            });
            throw new Error(`${operation} failed: ${error.message}`);
        }
    }
}

export default new ModelService();
