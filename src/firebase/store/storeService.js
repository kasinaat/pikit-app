
import { 
    collection, 
    doc, 
    addDoc, 
    getDoc, 
    getDocs, 
    setDoc, 
    deleteDoc, 
    query, 
    where 
} from 'firebase/firestore';
import ModelService from '../modelService.js';
import Logger from '../../config/logger.js';

class StoreService {
    constructor() {
        this.db = ModelService.db;
        this.collections = {
            users: 'users',
            items: 'items',
            bills: 'bills'
        }
    }

    async storeItem(itemData) {
        try {
            Logger.info('Attempting to store item', { itemName: itemData.name, quantity: itemData.quantity });
            const itemsCollection = collection(this.db, this.collections.items);
            const docRef = await addDoc(itemsCollection, {
                ...itemData,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            Logger.info('Item stored successfully', { itemId: docRef.id, itemName: itemData.name });
            return { id: docRef.id, ...itemData };
        } catch (error) {
            Logger.error('Error storing item', { error: error.message, itemData });
            throw error;
        }
    }

    async storeBill(billData) {
        try {
            Logger.info('Attempting to store bill', { store: billData.store, itemCount: billData.items?.length });
            const billsCollection = collection(this.db, this.collections.bills);
            const docRef = await addDoc(billsCollection, {
                ...billData,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            Logger.info('Bill stored successfully', { billId: docRef.id, store: billData.store });
            return { id: docRef.id, ...billData };
        } catch (error) {
            Logger.error('Error storing bill', { error: error.message, billData });
            throw error;
        }
    }

}
const storeService = new StoreService();

export { storeService as default, StoreService };