
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
            const itemsCollection = collection(this.db, this.collections.items);
            const docRef = await addDoc(itemsCollection, {
                ...itemData,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            return { id: docRef.id, ...itemData };
        } catch (error) {
            console.error('Error storing item:', error);
            throw error;
        }
    }

    async storeBill(billData) {
        try {
            const billsCollection = collection(this.db, this.collections.bills);
            const docRef = await addDoc(billsCollection, {
                ...billData,
                createdAt: new Date(),
                updatedAt: new Date()
            });
            return { id: docRef.id, ...billData };
        } catch (error) {
            console.error('Error storing bill:', error);
            throw error;
        }
    }

}
const storeService = new StoreService();

export { storeService as default, StoreService };