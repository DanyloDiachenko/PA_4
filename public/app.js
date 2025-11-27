const API_URL = 'http://localhost:3000/api';

const keyInput = document.getElementById('keyInput');
const valueInput = document.getElementById('valueInput');
const operationResult = document.getElementById('operationResult');
const benchmarkResult = document.getElementById('benchmarkResult');
const indexVisual = document.getElementById('indexVisual');
const mainFileVisual = document.getElementById('mainFileVisual');
const overflowFileVisual = document.getElementById('overflowFileVisual');

let currentIndexData = [];

fetchIndex();

async function fetchIndex() {
    try {
        const response = await fetch(`${API_URL}/index?t=${Date.now()}`);
        currentIndexData = await response.json();
        console.log('Fetched Index:', currentIndexData.length, 'items');
        console.log('Overflow items:', currentIndexData.filter(i => i.file === 'overflow').length);
        renderVisualization();
    } catch (e) {
        console.error('Failed to fetch index', e);
    }
}

function renderVisualization() {
    indexVisual.innerHTML = '';
    
    const MAX_ITEMS = 500;
    
    const fragment = document.createDocumentFragment();
    
    currentIndexData.forEach((item, idx) => {
        const div = document.createElement('div');
        div.className = 'index-item';
        div.id = `index-key-${item.key}`;
        div.innerHTML = `<span>Key: ${item.key}</span> <span>${item.file}:${item.offset}</span>`;
        fragment.appendChild(div);
    });
    
    indexVisual.appendChild(fragment);

    const mainItems = currentIndexData.filter(i => i.file === 'main');
    const overflowItems = currentIndexData.filter(i => i.file === 'overflow');
    
    renderFileVisual(mainFileVisual, mainItems, 'Main');
    renderFileVisual(overflowFileVisual, overflowItems, 'Overflow');
}

function renderFileVisual(container, items, type) {
    container.innerHTML = '';
    if (items.length > 200) {
        container.innerHTML = `<div style="padding:10px">Contains ${items.length} records. (Showing first 100)</div>`;
        items = items.slice(0, 100);
    }
    
    const fragment = document.createDocumentFragment();
    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'index-item';
        div.innerHTML = `<span>[${item.offset}] Key: ${item.key}</span>`;
        fragment.appendChild(div);
    });
    container.appendChild(fragment);
}

async function searchRecord() {
    const key = keyInput.value;
    if (!key) return;

    operationResult.textContent = 'Searching...';
    clearHighlights();

    try {
        const response = await fetch(`${API_URL}/search/${key}`);
        const result = await response.json();

        if (result.found) {
            operationResult.innerHTML = `Found!\nKey: ${result.key}\nValue: ${result.value}\nComparisons: ${result.comparisons}\nLocation: ${result.location} @ ${result.offset}`;
            highlightKey(result.key);
        } else {
            operationResult.textContent = `Not Found. (Comparisons: ${result.comparisons})`;
        }
    } catch (e) {
        operationResult.textContent = 'Error: ' + e.message;
    }
}

async function insertRecord() {
    const key = keyInput.value;
    const value = valueInput.value;
    if (!key || !value) return;

    try {
        const response = await fetch(`${API_URL}/insert`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, value })
        });
        const result = await response.json();

        if (result.error) {
            operationResult.textContent = 'Error: ' + result.error;
        } else {
            operationResult.textContent = 'Inserted successfully.';
            fetchIndex();
        }
    } catch (e) {
        operationResult.textContent = 'Error: ' + e.message;
    }
}

async function updateRecord() {
    const key = keyInput.value;
    const value = valueInput.value;
    if (!key || !value) return;

    try {
        const response = await fetch(`${API_URL}/update`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, value })
        });
        const result = await response.json();

        if (result.error) {
            operationResult.textContent = 'Error: ' + result.error;
        } else {
            operationResult.textContent = 'Updated successfully.';
        }
    } catch (e) {
        operationResult.textContent = 'Error: ' + e.message;
    }
}

async function deleteRecord() {
    const key = keyInput.value;
    if (!key) return;

    try {
        const response = await fetch(`${API_URL}/delete/${key}`, {
            method: 'DELETE'
        });
        const result = await response.json();

        if (result.error) {
            operationResult.textContent = 'Error: ' + result.error;
        } else {
            operationResult.textContent = 'Deleted successfully.';
            fetchIndex();
        }
    } catch (e) {
        operationResult.textContent = 'Error: ' + e.message;
    }
}

async function resetDB() {
    benchmarkResult.textContent = 'Generating 10,000 records... Please wait.';
    try {
        const response = await fetch(`${API_URL}/reset`, { method: 'POST' });
        const result = await response.json();
        benchmarkResult.textContent = `Database reset with ${result.count} records.`;
        fetchIndex();
    } catch (e) {
        benchmarkResult.textContent = 'Error: ' + e.message;
    }
}

async function runBenchmark() {
    benchmarkResult.textContent = 'Running benchmark...';
    try {
        const response = await fetch(`${API_URL}/benchmark`, { method: 'POST' });
        const result = await response.json();
        
        if (result.error) {
            benchmarkResult.textContent = 'Error: ' + result.error;
            return;
        }

        let text = `Average Comparisons: ${result.average}\nTotal Searches: 25\n\nDetails:\n`;
        result.results.forEach(r => {
            text += `Key: ${r.key}, Comparisons: ${r.comparisons}\n`;
        });
        benchmarkResult.textContent = text;
    } catch (e) {
        benchmarkResult.textContent = 'Error: ' + e.message;
    }
}

function highlightKey(key) {
    const el = document.getElementById(`index-key-${key}`);
    if (el) {
        el.classList.add('highlight');
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function clearHighlights() {
    document.querySelectorAll('.highlight').forEach(el => el.classList.remove('highlight'));
}
