const fs = require('fs').promises;
const path = require('path');

const DB_DIR = path.join(__dirname, 'db');
const MAIN_FILE = path.join(DB_DIR, 'main.db');
const OVERFLOW_FILE = path.join(DB_DIR, 'overflow.db');
const INDEX_FILE = path.join(DB_DIR, 'index.json');

const RECORD_SIZE = 64;

class DBMS {
    constructor() {
        this.index = [];
    }

    async init() {
        try {
            const data = await fs.readFile(INDEX_FILE, 'utf8');
            this.index = JSON.parse(data);
        } catch (e) {
            this.index = [];
            await this.saveIndex();
            await fs.writeFile(MAIN_FILE, Buffer.alloc(0));
            await fs.writeFile(OVERFLOW_FILE, Buffer.alloc(0));
        }
    }

    async saveIndex() {
        await fs.writeFile(INDEX_FILE, JSON.stringify(this.index, null, 2));
    }

    binarySearchIndex(key) {
        let left = 0;
        let right = this.index.length - 1;
        let comparisons = 0;

        while (left <= right) {
            comparisons++;
            const mid = Math.floor((left + right) / 2);
            if (this.index[mid].key === key) {
                return { index: mid, comparisons };
            } else if (this.index[mid].key < key) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
        return { index: -1, comparisons };
    }

    async search(key) {
        const { index, comparisons } = this.binarySearchIndex(key);
        if (index === -1) {
            return { found: false, comparisons };
        }

        const entry = this.index[index];
        const filePath = entry.file === 'main' ? MAIN_FILE : OVERFLOW_FILE;
        
        const handle = await fs.open(filePath, 'r');
        const buffer = Buffer.alloc(RECORD_SIZE);
        await handle.read(buffer, 0, RECORD_SIZE, entry.offset);
        await handle.close();

        const recordKey = buffer.readInt32BE(0);
        const recordValue = buffer.toString('utf8', 4).replace(/\0/g, '');

        return {
            found: true,
            key: recordKey,
            value: recordValue,
            comparisons,
            location: entry.file,
            offset: entry.offset
        };
    }

    async insert(key, value) {
        key = parseInt(key);
        if (isNaN(key)) throw new Error('Key must be an integer');
        
        const { index } = this.binarySearchIndex(key);
        if (index !== -1) {
            throw new Error('Key already exists');
        }

        const buffer = Buffer.alloc(RECORD_SIZE);
        buffer.writeInt32BE(key, 0);
        buffer.write(value, 4, 60, 'utf8');

        const stats = await fs.stat(OVERFLOW_FILE);
        const offset = stats.size;
        
        await fs.appendFile(OVERFLOW_FILE, buffer);

        const newEntry = { key, file: 'overflow', offset };
        
        let left = 0;
        let right = this.index.length - 1;
        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            if (this.index[mid].key < key) {
                left = mid + 1;
            } else {
                right = mid - 1;
            }
        }
        this.index.splice(left, 0, newEntry);
        await this.saveIndex();
        return { success: true };
    }

    async update(key, value) {
        key = parseInt(key);
        const { index } = this.binarySearchIndex(key);
        if (index === -1) {
            throw new Error('Key not found');
        }

        const entry = this.index[index];
        const filePath = entry.file === 'main' ? MAIN_FILE : OVERFLOW_FILE;

        const buffer = Buffer.alloc(RECORD_SIZE);
        buffer.writeInt32BE(key, 0);
        buffer.write(value, 4, 60, 'utf8');

        const handle = await fs.open(filePath, 'r+');
        await handle.write(buffer, 0, RECORD_SIZE, entry.offset);
        await handle.close();

        return { success: true };
    }

    async remove(key) {
        key = parseInt(key);
        const { index } = this.binarySearchIndex(key);
        if (index === -1) {
            throw new Error('Key not found');
        }

        this.index.splice(index, 1);
        await this.saveIndex();
        return { success: true };
    }

    async reset(count = 10000) {
        const data = [];
        const usedKeys = new Set();
        
        while (data.length < count) {
            const key = Math.floor(Math.random() * (count * 10)) + 1;
            if (!usedKeys.has(key)) {
                usedKeys.add(key);
                data.push({ key, value: `Value for ${key}` });
            }
        }

        data.sort((a, b) => a.key - b.key);

        const handle = await fs.open(MAIN_FILE, 'w');
        this.index = [];
        
        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            const buffer = Buffer.alloc(RECORD_SIZE);
            buffer.writeInt32BE(item.key, 0);
            buffer.write(item.value, 4, 60, 'utf8');
            
            const offset = i * RECORD_SIZE;
            await handle.write(buffer, 0, RECORD_SIZE, offset);
            
            this.index.push({ key: item.key, file: 'main', offset });
        }
        await handle.close();

        await fs.writeFile(OVERFLOW_FILE, Buffer.alloc(0));
        
        await this.saveIndex();
        return { count: data.length };
    }

    getAllIndex() {
        return this.index;
    }
}

module.exports = new DBMS();
