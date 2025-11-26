const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const dbms = require('./dbms');

const app = express();
const PORT = 3000;

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

dbms.init().then(() => {
    console.log('DBMS Initialized');
});

app.get('/api/index', (req, res) => {
    res.json(dbms.getAllIndex());
});

app.get('/api/search/:key', async (req, res) => {
    try {
        const result = await dbms.search(parseInt(req.params.key));
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/insert', async (req, res) => {
    try {
        const { key, value } = req.body;
        const result = await dbms.insert(key, value);
        res.json(result);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

app.put('/api/update', async (req, res) => {
    try {
        const { key, value } = req.body;
        const result = await dbms.update(key, value);
        res.json(result);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

app.delete('/api/delete/:key', async (req, res) => {
    try {
        const result = await dbms.remove(parseInt(req.params.key));
        res.json(result);
    } catch (e) {
        res.status(400).json({ error: e.message });
    }
});

app.post('/api/reset', async (req, res) => {
    try {
        const result = await dbms.reset();
        res.json(result);
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.post('/api/benchmark', async (req, res) => {
    try {
        const index = dbms.getAllIndex();
        if (index.length === 0) {
            return res.json({ error: 'Database is empty' });
        }

        const iterations = 25;
        let totalComparisons = 0;
        const results = [];

        for (let i = 0; i < iterations; i++) {
            const randomIndex = Math.floor(Math.random() * index.length);
            const key = index[randomIndex].key;
            
            const searchResult = await dbms.search(key);
            totalComparisons += searchResult.comparisons;
            results.push({ key, comparisons: searchResult.comparisons });
        }

        const average = totalComparisons / iterations;
        res.json({ average, results, totalComparisons });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
