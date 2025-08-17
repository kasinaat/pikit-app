import express from 'express';
import multer from 'multer';
import imageProcessingService from './firebase/imageProcessService.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

const upload = multer({
    dest: 'uploads/',
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to Pikit App',
        status: 'Server is running successfully',
        timestamp: new Date().toISOString(),
    });
});

app.get('/operations', (req, res) => {
    try {
        const operations = {
            'objectDetection': {
                name: 'Object Detection',
                description: 'Analyze refrigerator images to identify all visible food items with their precise coordinates (0.0-1.0 normalized). Perfect for tracking inventory and finding items.',
                endpoint: '/process/refrigerator',
                supportedFileTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
                example: 'Upload a photo of your refrigerator interior'
            },
            'billExtraction': {
                name: 'Bill Extraction', 
                description: 'Extract all information from bills and receipts including item names, prices, quantities, units, store details, date, time, and total amount. Great for expense tracking.',
                endpoint: '/process/bill',
                supportedFileTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'],
                example: 'Upload a photo of a grocery receipt or bill'
            }
        };
        
        res.json({
            success: true,
            operations,
            totalOperations: Object.keys(operations).length
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

app.post('/process/refrigerator', upload.single('file'), async (req, res) => {
    try {
        const customPrompt = req.body.customPrompt || 
            "Analyze this refrigerator image. Identify all visible food items with coordinates (0.0-1.0). Include confidence scores.";
        
        const result = await imageProcessingService.detectObjects(req.file, customPrompt);
        
        res.json({
            success: true,
            message: 'Refrigerator analysis completed successfully',
            ...result
        });

    } catch (error) {
        console.error('Error processing refrigerator:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to analyze refrigerator',
            error: error.message
        });
    }
});

app.post('/process/bill', upload.single('file'), async (req, res) => {
    try {
        const customPrompt = req.body.customPrompt || 
            "Extract all information from this bill/receipt including items, prices, store details, and totals.";
        
        const result = await imageProcessingService.extractBillData(req.file, customPrompt);
        
        res.json({
            success: true,
            message: 'Bill extraction completed successfully',
            ...result
        });

    } catch (error) {
        console.error('Error processing bill:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to extract bill data',
            error: error.message
        });
    }
});

app.use((error, req, res, next) => {
    console.error('Unhandled error:', error);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: error.message
    });
});

// Start server
app.listen(port, () => {
    console.log(`🚀 Pikit App server is running on port ${port}`);
});

export default app;