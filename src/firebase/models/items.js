import storeService from '../store/storeService.js';

class Item {
    constructor(item) {
        this.id = item.id;
        this.name = item.name;
        this.xPoint = item.coordinates.xPoint;
        this.yPoint = item.coordinates.yPoint;
        this.confidence = item.confidence;
    }

    async save() {
        if (this.id) {
            const result = await storeService.updateItem(this.id, {
                name: this.name,
                xPoint: this.xPoint,
                yPoint: this.yPoint,
                confidence: this.confidence,
            });
            return result;
        } else {
            const result = await storeService.storeItem({
                name: this.name,
                xPoint: this.xPoint,
                yPoint: this.yPoint,
                confidence: this.confidence,
            });
            this.id = result.id;
            return result;
        }
    }

}

export default Item;