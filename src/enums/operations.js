export const Operations = {
    OBJECT_DETECTION: 'objectDetection',
    BILL_EXTRACTION: 'billExtraction'
}

export const OperationVsPrompt = {
    [Operations.OBJECT_DETECTION]: "Analyze this refrigerator image. Identify all visible food items with their precise coordinates (0.0-1.0 normalized). Include confidence scores for each detection.",
    [Operations.BILL_EXTRACTION]: "Extract all information from this bill/receipt. Get item names, prices, quantities, units, store details, date, time, and total amount. Ensure high accuracy."
} 