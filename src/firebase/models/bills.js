import storeService from '../store/storeService.js';

class Bill {
    constructor(bill) {
        this.items = bill.items;
        this.date = bill.date;
        this.time = bill.time;
        this.store = bill.store;
        this.address = bill.address;
        this.phone = bill.phone;
        this.totalAmount = bill.totalAmount;
    }
    async save() {
        if (this.id) {
            const result = await storeService.updateBill(this.id, {
                items: this.items,
                date: this.date,
                time: this.time,
                store: this.store,
                address: this.address,
                phone: this.phone,
                totalAmount: this.totalAmount,
            });
            return result;
        } else {
            const result = await storeService.storeBill({
                items: this.items,
                date: this.date,
                time: this.time,
                store: this.store,
                address: this.address,
                phone: this.phone,
                totalAmount: this.totalAmount,
            });
            this.id = result.id;
            return result;
        }
    }
}

export default Bill;