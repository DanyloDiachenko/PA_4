# Simple DBMS with Dense Index and Overflow Area

This project implements a simple Database Management System (DBMS) with a Graphical User Interface (GUI). It uses a **Dense Index** combined with an **Overflow Area** to manage data stored in physical files.

## Features
- **Physical File Storage**: Data is stored in `db/main.db` (sorted) and `db/overflow.db` (unsorted).
- **Dense Index**: An in-memory index (persisted to `db/index.json`) maps keys to file locations.
- **CRUD Operations**: Search, Add, Edit, Delete.
- **Visualization**: View the structure of the Index and Data files.
- **Experiments**: Built-in benchmarking tool to verify search performance.

## Algorithms & Complexity

### 1. Search (Key)
**Pseudocode**:
```text
function Search(key):
    indexEntry = BinarySearch(Index, key)
    if indexEntry is null:
        return Not Found
    
    file = Open(indexEntry.file)
    Seek(file, indexEntry.offset)
    record = Read(file, RecordSize)
    return record
```
**Complexity**: $O(\log N)$
- Binary search on the index takes logarithmic time.
- File access is $O(1)$ (Direct Access).

### 2. Add (Key, Value)
**Pseudocode**:
```text
function Add(key, value):
    if Search(key) is found:
        Error "Key exists"
    
    record = CreateRecord(key, value)
    offset = FileSize(OverflowFile)
    Append(OverflowFile, record)
    
    newEntry = { key, file: 'overflow', offset }
    InsertIntoSortedArray(Index, newEntry)
    SaveIndex()
```
**Complexity**: $O(N)$
- Appending to file is $O(1)$.
- Inserting into the sorted Index array requires shifting elements, which is $O(N)$.

### 3. Delete (Key)
**Pseudocode**:
```text
function Delete(key):
    indexPos = BinarySearchIndex(Index, key)
    if indexPos == -1:
        Error "Not Found"
    
    RemoveAt(Index, indexPos)
    SaveIndex()
```
**Complexity**: $O(N)$
- Removing from an array requires shifting elements, which is $O(N)$.
- The data remains in the file (marked as deleted implicitly by absence from index).

### 4. Edit (Key, NewValue)
**Pseudocode**:
```text
function Edit(key, newValue):
    indexEntry = BinarySearch(Index, key)
    if indexEntry is null:
        Error "Not Found"
    
    record = CreateRecord(key, newValue)
    file = Open(indexEntry.file)
    Write(file, record, indexEntry.offset)
```
**Complexity**: $O(\log N)$
- Search is $O(\log N)$.
- Overwriting the record is $O(1)$.

## Experimental Results

**Setup**:
- Database populated with **10,000** random unique records.
- Records sorted and stored in `main.db`.
- **25** random searches performed.

**Results**:
- **Average Comparisons**: 12.0
- **Theoretical Expectation**: $\log_2(10000) \approx 13.29$.
- The experimental result aligns perfectly with the theoretical binary search complexity.

**Sample Data**:
| Key | Comparisons |
|-----|-------------|
| 22126 | 5 |
| 23484 | 13 |
| 2523 | 12 |
| ... | ... |

## Conclusions
The implementation successfully demonstrates the efficiency of a Dense Index structure. 
- **Search** operations are extremely fast ($O(\log N)$) due to the binary search on the index and direct file access.
- **Insertions** are handled via an Overflow area, avoiding the need to rewrite the entire sorted main file. However, maintaining the sorted in-memory index incurs an $O(N)$ cost, which is acceptable for this scale but would require B-Trees for larger systems.
- **Visualization** helps understand how the index maps logical keys to physical file offsets.

## How to Run

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Server**:
   ```bash
   npm start
   ```

3. **Open GUI**:
   Open [http://localhost:3000](http://localhost:3000) in your browser.

4. **Usage**:
   - Use the **Operations** panel to manage records.
   - Use the **Experiments** panel to generate data and run benchmarks.
