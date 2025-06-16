import React, { useState, useEffect } from 'react';
import { useDropdownOptions } from '../context/DropdownOptionsContext';
import SearchableDropdown from '../components/SearchableDropdown';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';
import { DuplicateResolutionTable, Duplicate, Action } from "../components/DuplicateResolutionTable";

// Define the row type
interface BudgetRow {
  indexId: number;
  budgetLineItem: string;
  typeOfPayment: string;
  categoryInBudget: string;
  sendingLocation: string;
  item: string;
  perMonth: string;
  months: string;
  costForYear?: string;
  status: string;
  dateChanged?: string; // ISO string with date and time
}

const initialRows: BudgetRow[] = [];

function parseImport(text: string) {
  // Split by line, then by tab, comma, or semicolon
  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => line.split(/[\t,;]+/).map(cell => cell.trim()));
}

function exportCSV(rows) {
  const headers = [
    'Index ID', 'Budget Line Item', 'Type of Payment', 'Category In Budget', 'Sending Location', 'Item', 'Per Month', 'Months', 'Cost for Year', 'Status'
  ];
  const csv = [headers.join(',')].concat(
    rows.map(row => [
      row.indexId,
      row.budgetLineItem,
      row.typeOfPayment,
      row.categoryInBudget,
      row.sendingLocation,
      '"' + (row.item || '').replace(/"/g, '""') + '"',
      row.perMonth,
      row.months,
      (parseFloat(row.perMonth) && parseFloat(row.months)) ? (parseFloat(row.perMonth) * parseFloat(row.months)).toFixed(2) : '',
      row.status
    ].join(','))
  ).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'budget-database.csv';
  a.click();
  URL.revokeObjectURL(url);
}

const sortDirections = {
  asc: 'asc',
  desc: 'desc',
};

export default function BudgetDatabase() {
  const { options } = useDropdownOptions();
  const [rows, setRows] = useState<BudgetRow[]>(initialRows);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');
  const [filters, setFilters] = useState({
    budgetLineItem: '',
    typeOfPayment: '',
    status: '',
    item: '',
  });
  const [sort, setSort] = useState<{ col: string; dir: 'asc' | 'desc' } | null>(null);
  const [sheetNames, setSheetNames] = useState<string[] | null>(null);
  const [sheetFile, setSheetFile] = useState<File | null>(null);
  const [sheetSelectOpen, setSheetSelectOpen] = useState(false);
  const [pendingRows, setPendingRows] = useState<string[][] | null>(null);
  const [duplicateIds, setDuplicateIds] = useState<number[]>([]);
  const [importConflictMode, setImportConflictMode] = useState<'none' | 'prompt' | 'overwrite' | 'autoid'>('none');
  const [importSuccess, setImportSuccess] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'active' | 'archive' | 'all'>('active');
  const [showBulkAdjust, setShowBulkAdjust] = useState(false);
  const [bulkAdjustValues, setBulkAdjustValues] = useState({
    budgetLineItem: '',
    perMonth: '',
    months: '',
    typeOfPayment: '',
    categoryInBudget: '',
    sendingLocation: '',
    status: '',
  });
  const [showBulkAdjustIndexId, setShowBulkAdjustIndexId] = useState(false);
  const [bulkIndexIdValues, setBulkIndexIdValues] = useState<{ [oldId: number]: string }>({});
  const [bulkIndexIdError, setBulkIndexIdError] = useState<string | null>(null);

  const getDropdown = (name: string) => options.find(opt => opt.name === name)?.values || [];

  const handleChange = (idx: number, field: string, value: string) => {
    setRows(rows =>
      rows.map((row, i) =>
        i === idx ? { ...row, [field]: value } : row
      )
    );
  };

  const handleAddRow = () => {
    setRows([
      ...rows,
      {
        indexId: rows.length + 1,
        budgetLineItem: '',
        typeOfPayment: '',
        categoryInBudget: '',
        sendingLocation: '',
        item: '',
        perMonth: '',
        months: '12',
        costForYear: '',
        status: 'Active',
        dateChanged: '',
      },
    ]);
  };

  const handleDeleteRow = (idx: number) => {
    setRows(rows => rows.filter((_, i) => i !== idx));
  };

  const handleArchiveToggle = (idx: number) => {
    setRows(rows =>
      rows.map((row, i) =>
        i === idx ? { ...row, status: row.status === 'Active' ? 'Archived' : 'Active', dateChanged: dayjs().toISOString() } : row
      )
    );
  };

  const handleImport = () => {
    const parsed = parseImport(importText);
    if (!parsed.length) return;
    checkForDuplicates(parsed);
  };

  // Excel/CSV upload handler (now inside modal)
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      if (!data) return;
      let workbook;
      if (file.name.endsWith('.csv')) {
        // Parse CSV as a single sheet
        const text = typeof data === 'string' ? data : new TextDecoder().decode(data as ArrayBuffer);
        const rows = parseImport(text);
        checkForDuplicates(rows);
      } else {
        // Parse Excel
        workbook = XLSX.read(data, { type: 'binary' });
        const names = workbook.SheetNames;
        if (names.length === 1) {
          const ws = workbook.Sheets[names[0]];
          const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
          checkForDuplicates(rows as string[][]);
        } else {
          setSheetNames(names);
          setSheetFile(file);
          setSheetSelectOpen(true);
        }
      }
    };
    if (file.name.endsWith('.csv')) {
      reader.readAsText(file);
    } else {
      reader.readAsBinaryString(file);
    }
    e.target.value = '';
  };

  // Add this function to handle filter changes
  const handleFilterChange = (field: string, value: string) => {
    setFilters(f => ({ ...f, [field]: value }));
  };

  // Add this function to handle sorting
  const handleSort = (col: string) => {
    setSort(s => {
      if (!s || s.col !== col) return { col, dir: 'asc' };
      if (s.dir === 'asc') return { col, dir: 'desc' };
      return null;
    });
  };

  // Fix type check in addParsedRows
  const addParsedRows = (rowsToAdd: string[][], mode: 'overwrite' | 'autoid' = 'autoid') => {
    setImportError(null);
    setImportWarnings([]);
    const warnings: string[] = [];
    if (!Array.isArray(rowsToAdd) || rowsToAdd.length === 0) {
      setImportError('No data to import.');
      return;
    }
    if (!rowsToAdd.every(arr => Array.isArray(arr) && arr.length > 0)) {
      setImportError('Import data is not in the expected format.');
      return;
    }
    if (rowsToAdd.length && String(rowsToAdd[0][0]).toLowerCase().includes('index')) {
      rowsToAdd = rowsToAdd.slice(1);
    }
    // Filter out rows where Item is 'Sample Item' (case-insensitive, trimmed)
    rowsToAdd = rowsToAdd.filter(cols => (cols[5] || '').trim().toLowerCase() !== 'sample item');
    // Map arrays to objects
    let mappedRows = rowsToAdd.map(cols => parseRow(cols));
    // 1. Enforce Status (smarter: contains 'archive' = Archived)
    mappedRows = mappedRows.map((obj, i) => {
      let status = obj.status;
      if (typeof status === 'string' && /archive/i.test(status)) {
        if (status !== 'Archived') {
          warnings.push(`Row ${i + 1}: Status "${status}" changed to "Archived".`);
        }
        status = 'Archived';
      } else if (status !== 'Active') {
        warnings.push(`Row ${i + 1}: Status "${status}" changed to "Active".`);
        status = 'Active';
      }
      return { ...obj, status };
    });
    // 2. Validate Cost for Year
    mappedRows = mappedRows.map((obj, i) => {
      const perMonth = parseFloat(obj.perMonth);
      const months = parseFloat(obj.months);
      let costForYear = '';
      if (!isNaN(perMonth) && !isNaN(months)) {
        costForYear = (perMonth * months).toFixed(2);
        if (obj.costForYear && Math.abs(parseFloat(obj.costForYear) - parseFloat(costForYear)) > 0.01) {
          warnings.push(`Row ${i + 1}: Cost for Year corrected from ${obj.costForYear} to ${costForYear}.`);
        }
      }
      return { ...obj, costForYear };
    });
    // 3. Add dateChanged (created/modified)
    const now = dayjs().toISOString();
    mappedRows = mappedRows.map(obj => ({
      ...obj,
      dateChanged: now,
    }));
    // 4. Guarantee unique Index IDs
    let existingIds = rows.map(r => r.indexId);
    let usedIds = new Set(existingIds);
    let nextId = Math.max(0, ...existingIds, ...mappedRows.map(r => r.indexId)) + 1;
    if (mode === 'autoid') {
      mappedRows = mappedRows.map((obj, i) => {
        let id = obj.indexId;
        if (isNaN(id) || usedIds.has(id)) {
          warnings.push(`Row ${i + 1}: Index ID ${id} auto-assigned to ${nextId}.`);
          id = nextId++;
        }
        usedIds.add(id);
        return { ...obj, indexId: id };
      });
    }
    // 5. Merge into table
    let newRows;
    let changed = false;
    if (mode === 'overwrite') {
      // Build a map of imported rows by Index ID (last one wins if duplicates in import)
      const importMap = new Map(mappedRows.map(obj => [obj.indexId, obj]));
      // Replace or add rows based on Index ID
      const existingIdsSet = new Set(rows.map(r => r.indexId));
      // Replace existing rows and track if any changes
      newRows = rows.map(row => {
        if (importMap.has(row.indexId)) {
          const imported = importMap.get(row.indexId)!;
          // If the existing row is archived
          if (row.status === 'Archived') {
            if (imported.status !== row.status && imported.status === 'Active') {
              // Moving from Archive to Active: accept all changes
              changed = true;
              return { ...imported, dateChanged: now };
            } else if (imported.status !== row.status) {
              // Status change (e.g., Archived to something else): allow status change only
              return { ...row, status: imported.status, dateChanged: now };
            } else {
              // Remains archived: only allow status change, skip other changes
              const { status: s1, dateChanged: d1, ...rest1 } = row;
              const { status: s2, dateChanged: d2, ...rest2 } = imported;
              if (JSON.stringify(rest1) !== JSON.stringify(rest2)) {
                warnings.push(`Row with Index ID ${row.indexId} is archived and cannot be updated except for status. Changes were skipped.`);
              }
              return row;
            }
          }
          // For non-archived rows, allow full overwrite
          const { dateChanged: _, ...a } = row;
          const { dateChanged: __, ...b } = imported;
          const isSame = JSON.stringify(a) === JSON.stringify(b);
          if (!isSame) changed = true;
          // Only update dateChanged if data actually changed
          return isSame ? row : imported;
        }
        return row;
      });
      // Add new rows from import that don't exist yet
      for (const [id, obj] of importMap.entries()) {
        if (!existingIdsSet.has(id)) {
          newRows.push(obj);
          changed = true;
        }
      }
      // Remove any possible accidental duplicates (shouldn't happen, but for safety)
      const seen = new Set();
      newRows = newRows.filter(row => {
        if (seen.has(row.indexId)) return false;
        seen.add(row.indexId);
        return true;
      });
      // Warn if any archived rows were skipped due to attempted field changes
      for (const row of rows) {
        if (row.status === 'Archived' && importMap.has(row.indexId)) {
          const imported = importMap.get(row.indexId)!;
          // If any field other than status is different, warn
          const { status: s1, dateChanged: d1, ...rest1 } = row;
          const { status: s2, dateChanged: d2, ...rest2 } = imported;
          if (s1 === s2 && JSON.stringify(rest1) !== JSON.stringify(rest2)) {
            warnings.push(`Row with Index ID ${row.indexId} is archived and cannot be updated except for status. Changes were skipped.`);
          }
        }
      }
      mappedRows = newRows;
      newRows = mappedRows;
    } else {
      newRows = [...rows, ...mappedRows];
      if (newRows.length === rows.length) {
        setImportError('No new rows were added.');
        return;
      }
    }
    setRows(newRows);
    setPendingRows(null);
    setDuplicateIds([]);
    setImportConflictMode('none');
    setShowImport(false);
    setImportText('');
    setImportSuccess(true);
    setImportWarnings(warnings);
    setTimeout(() => setImportSuccess(false), 2000);
  };

  // Parse a row from imported data
  function parseRow(cols: string[], forcedId?: number): BudgetRow {
    let perMonth = cols[6];
    let months = cols[7];
    // If both are blank or zero
    if ((!perMonth || parseFloat(perMonth) === 0) && (!months || parseFloat(months) === 0)) {
      perMonth = '1';
      months = '1';
    } else if (!perMonth || parseFloat(perMonth) === 0) {
      perMonth = '1';
      months = '1';
    } else if (!months || parseFloat(months) === 0) {
      months = '1';
    }
    return {
      indexId: forcedId ?? (parseInt(cols[0], 10) || rows.length + 1),
      budgetLineItem: cols[1] || '',
      typeOfPayment: cols[2] || '',
      categoryInBudget: cols[3] || '',
      sendingLocation: cols[4] || '',
      item: cols[5] || '',
      perMonth,
      months,
      costForYear: cols[8] || '',
      status: cols[9] || 'Active',
      dateChanged: '',
    };
  }

  // Check for duplicate IDs and prompt user
  function checkForDuplicates(rowsToAdd: string[][]) {
    // Remove header if present
    if (rowsToAdd.length && rowsToAdd[0][0]?.toLowerCase().includes('index')) {
      rowsToAdd = rowsToAdd.slice(1);
    }
    const importedIds = rowsToAdd.map(cols => parseInt(cols[0], 10)).filter(id => !isNaN(id));
    const existingIds = rows.map(r => r.indexId);
    const duplicates = importedIds.filter(id => existingIds.includes(id));
    if (duplicates.length) {
      setSheetNames(null);
      setSheetFile(null);
      setSheetSelectOpen(false);
      setPendingRows(rowsToAdd);
      setDuplicateIds(duplicates);
      setImportConflictMode('prompt');
    } else {
      addParsedRows(rowsToAdd, 'autoid');
    }
  }

  // Handle sheet selection
  const handleSheetSelect = (sheetName: string) => {
    if (!sheetFile) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target?.result;
      if (!data) return;
      const workbook = XLSX.read(data, { type: 'binary' });
      const ws = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
      checkForDuplicates(rows as string[][]);
    };
    reader.readAsBinaryString(sheetFile);
  };

  // Filtered rows for the current tab
  let filteredRows = rows.filter(row =>
    (activeTab === 'all' || (activeTab === 'active' ? row.status === 'Active' : row.status === 'Archived')) &&
    (!filters.budgetLineItem || row.budgetLineItem === filters.budgetLineItem) &&
    (!filters.typeOfPayment || row.typeOfPayment === filters.typeOfPayment) &&
    (!filters.status || row.status === filters.status) &&
    (!filters.item || (row.item || '').toLowerCase().includes(filters.item.toLowerCase()))
  );

  if (sort) {
    filteredRows = [...filteredRows].sort((a, b) => {
      const aVal = (a as any)[sort.col] || '';
      const bVal = (b as any)[sort.col] || '';
      if (aVal < bVal) return sort.dir === 'asc' ? -1 : 1;
      if (aVal > bVal) return sort.dir === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Selection logic
  const isAllSelected = filteredRows.length > 0 && filteredRows.every(row => selectedIds.includes(row.indexId));
  const isIndeterminate = selectedIds.length > 0 && !isAllSelected;

  const handleSelectRow = (indexId: number, checked: boolean) => {
    setSelectedIds(ids => checked ? [...ids, indexId] : ids.filter(id => id !== indexId));
  };
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredRows.map(row => row.indexId));
    } else {
      setSelectedIds([]);
    }
  };
  const handleBulkArchive = () => {
    setRows(rows => rows.map(row => selectedIds.includes(row.indexId) ? { ...row, status: 'Archived' } : row));
    setSelectedIds([]);
  };
  const handleBulkDelete = () => {
    setRows(rows => rows.filter(row => !selectedIds.includes(row.indexId)));
    setSelectedIds([]);
  };
  const handleBulkAdjust = () => {
    setShowBulkAdjust(true);
    setBulkAdjustValues({
      budgetLineItem: '',
      perMonth: '',
      months: '',
      typeOfPayment: '',
      categoryInBudget: '',
      sendingLocation: '',
      status: '',
    });
  };
  const handleBulkAdjustApply = () => {
    setRows(rows => rows.map(row =>
      selectedIds.includes(row.indexId) && row.status === 'Active'
        ? {
            ...row,
            budgetLineItem: bulkAdjustValues.budgetLineItem || row.budgetLineItem,
            perMonth: bulkAdjustValues.perMonth || row.perMonth,
            months: bulkAdjustValues.months || row.months,
            typeOfPayment: bulkAdjustValues.typeOfPayment || row.typeOfPayment,
            categoryInBudget: bulkAdjustValues.categoryInBudget || row.categoryInBudget,
            sendingLocation: bulkAdjustValues.sendingLocation || row.sendingLocation,
            status: bulkAdjustValues.status || row.status,
            dateChanged: dayjs().toISOString(),
          }
        : row
    ));
    setShowBulkAdjust(false);
    setSelectedIds([]);
  };
  const handleBulkAdjustIndexId = () => {
    setShowBulkAdjustIndexId(true);
    setBulkIndexIdError(null);
    setBulkIndexIdValues(Object.fromEntries(selectedIds.map(id => [id, id.toString()])));
  };
  const handleBulkIndexIdChange = (oldId: number, newId: string) => {
    setBulkIndexIdValues(vals => ({ ...vals, [oldId]: newId }));
  };
  const handleBulkAdjustIndexIdApply = () => {
    // Validate uniqueness and no conflicts
    const newIds = Object.values(bulkIndexIdValues).map(id => parseInt(id, 10));
    const oldIds = Object.keys(bulkIndexIdValues).map(id => parseInt(id, 10));
    const allExistingIds = rows.map(r => r.indexId).filter(id => !oldIds.includes(id));
    const hasDuplicates = newIds.length !== new Set(newIds).size;
    const hasConflicts = newIds.some(id => allExistingIds.includes(id));
    if (hasDuplicates) {
      setBulkIndexIdError('Duplicate Index IDs detected. All new Index IDs must be unique.');
      return;
    }
    if (hasConflicts) {
      setBulkIndexIdError('One or more new Index IDs conflict with existing rows.');
      return;
    }
    setRows(rows => rows.map(row =>
      bulkIndexIdValues[row.indexId]
        ? { ...row, indexId: parseInt(bulkIndexIdValues[row.indexId], 10), dateChanged: dayjs().toISOString() }
        : row
    ));
    setShowBulkAdjustIndexId(false);
    setSelectedIds([]);
  };

  // Auto-dismiss import warnings
  useEffect(() => {
    if (importWarnings.length > 0) {
      const timer = setTimeout(() => setImportWarnings([]), 8000);
      return () => clearTimeout(timer);
    }
  }, [importWarnings]);

  // Add this function to generate and download the Excel template
  function downloadExcelTemplate() {
    const headers = [
      'Index ID', 'Budget Line Item', 'Type of Payment', 'Category In Budget', 'Sending Location', 'Item', 'Per Month', 'Months', 'Cost for Year', 'Status'
    ];
    const sample = [
      [1, 'Sample Line', 'Credit Card', 'Groceries', 'Bank', 'Sample Item', 100, 12, 1200, 'Active']
    ];
    const ws = XLSX.utils.aoa_to_sheet([headers, ...sample]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template');
    XLSX.writeFile(wb, 'BudgetDatabaseTemplate.xlsx');
  }

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Budget Database</h2>
      {/* Tabs for Active/Archive/All */}
      <div className="mb-2 flex gap-2">
        <button
          className={`px-4 py-1 rounded-t ${activeTab === 'active' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setActiveTab('active')}
        >
          Active
        </button>
        <button
          className={`px-4 py-1 rounded-t ${activeTab === 'archive' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setActiveTab('archive')}
        >
          Archive
        </button>
        <button
          className={`px-4 py-1 rounded-t ${activeTab === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'}`}
          onClick={() => setActiveTab('all')}
        >
          All
        </button>
      </div>
      <div className="mb-2 flex gap-2">
        <button
          className="px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700"
          onClick={() => setShowImport(true)}
        >
          Import
        </button>
        <button
          className="px-4 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700"
          onClick={downloadExcelTemplate}
        >
          Get Excel Template
        </button>
        <button
          className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={handleAddRow}
        >
          Add Row
        </button>
        <button
          className="px-4 py-1 bg-gray-600 text-white rounded hover:bg-gray-700"
          onClick={() => exportCSV(filteredRows)}
        >
          Export CSV
        </button>
      </div>
      {/* Bulk Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="mb-2 flex gap-2 items-center bg-blue-50 border border-blue-200 rounded px-3 py-2">
          <span className="font-semibold text-blue-700">Bulk Actions:</span>
          <button className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700" onClick={handleBulkArchive}>Archive</button>
          <button className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700" onClick={handleBulkDelete}>Delete</button>
          <button className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700" onClick={handleBulkAdjust}>Adjust</button>
          <button className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={handleBulkAdjustIndexId}>Adjust Index ID</button>
          <span className="ml-auto text-xs text-gray-500">{selectedIds.length} selected</span>
        </div>
      )}
      <div className="mb-2 flex flex-wrap gap-2 items-center">
        <SearchableDropdown
          value={filters.budgetLineItem}
          options={getDropdown('Budget Line Item')}
          onChange={val => handleFilterChange('budgetLineItem', val)}
          placeholder="Filter by Budget Line Item"
        />
        <SearchableDropdown
          value={filters.typeOfPayment}
          options={getDropdown('Type of Payment')}
          onChange={val => handleFilterChange('typeOfPayment', val)}
          placeholder="Filter by Type of Payment"
        />
        <SearchableDropdown
          value={filters.status}
          options={['Active', 'Archived']}
          onChange={val => handleFilterChange('status', val)}
          placeholder="Filter by Status"
        />
        <input
          className="border rounded px-1 py-0.5"
          value={filters.item}
          onChange={e => handleFilterChange('item', e.target.value)}
          placeholder="Filter by Item"
        />
        {(filters.budgetLineItem || filters.typeOfPayment || filters.status || filters.item) && (
          <button
            className="px-2 py-0.5 bg-gray-200 rounded hover:bg-gray-300 text-xs"
            onClick={() => setFilters({ budgetLineItem: '', typeOfPayment: '', status: '', item: '' })}
          >
            Clear Filters
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-300 bg-white" style={{ tableLayout: 'auto', width: '100%' }}>
          <colgroup>
            <col style={{ width: '4%' }} />
            <col style={{ width: '7%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '7%' }} />
            <col style={{ width: '7%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '8%' }} />
            <col style={{ width: '10%' }} />
          </colgroup>
          <thead>
            <tr className="bg-gray-100">
              <th className="border px-2 py-1 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={el => { if (el) el.indeterminate = isIndeterminate; }}
                  onChange={e => handleSelectAll(e.target.checked)}
                />
              </th>
              <th className="border px-2 py-1 cursor-pointer" onClick={() => handleSort('indexId')}>Index ID</th>
              <th className="border px-2 py-1 cursor-pointer" onClick={() => handleSort('budgetLineItem')}>Budget Line Item</th>
              <th className="border px-2 py-1 cursor-pointer" onClick={() => handleSort('typeOfPayment')}>Type of Payment</th>
              <th className="border px-2 py-1 cursor-pointer" onClick={() => handleSort('categoryInBudget')}>Category In Budget</th>
              <th className="border px-2 py-1 cursor-pointer" onClick={() => handleSort('sendingLocation')}>Sending Location</th>
              <th className="border px-2 py-1 cursor-pointer w-64" onClick={() => handleSort('item')}>Item</th>
              <th className="border px-2 py-1 cursor-pointer" onClick={() => handleSort('perMonth')}>Per Month</th>
              <th className="border px-2 py-1 cursor-pointer" onClick={() => handleSort('months')}>Months</th>
              <th className="border px-2 py-1 cursor-pointer" onClick={() => handleSort('costForYear')}>Cost for Year</th>
              <th className="border px-2 py-1 cursor-pointer" onClick={() => handleSort('status')}>Status</th>
              <th className="border px-2 py-1 cursor-pointer" onClick={() => handleSort('dateChanged')}>Created/Modified</th>
              <th className="border px-2 py-1">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row, idx) => {
              return (
                <tr key={row.indexId + '-' + idx}>
                  <td className="border px-2 py-1 text-center align-top">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row.indexId)}
                      onChange={e => handleSelectRow(row.indexId, e.target.checked)}
                    />
                  </td>
                  <td className="border px-2 py-1 text-center align-top break-words whitespace-pre-wrap">{row.indexId}</td>
                  <td className="border px-2 py-1 align-top break-words whitespace-pre-wrap">
                    <SearchableDropdown
                      value={row.budgetLineItem}
                      options={getDropdown('Budget Line Item')}
                      onChange={val => handleChange(idx, 'budgetLineItem', val)}
                      placeholder="Select"
                      disabled={row.status === 'Archived'}
                    />
                  </td>
                  <td className="border px-2 py-1 align-top break-words whitespace-pre-wrap">
                    <SearchableDropdown
                      value={row.typeOfPayment}
                      options={getDropdown('Type of Payment')}
                      onChange={val => handleChange(idx, 'typeOfPayment', val)}
                      placeholder="Select"
                      disabled={row.status === 'Archived'}
                    />
                  </td>
                  <td className="border px-2 py-1 align-top break-words whitespace-pre-wrap">
                    <SearchableDropdown
                      value={row.categoryInBudget}
                      options={getDropdown('Category In Budget')}
                      onChange={val => handleChange(idx, 'categoryInBudget', val)}
                      placeholder="Select"
                      disabled={row.status === 'Archived'}
                    />
                  </td>
                  <td className="border px-2 py-1 align-top break-words whitespace-pre-wrap">
                    <SearchableDropdown
                      value={row.sendingLocation}
                      options={getDropdown('Sending Location')}
                      onChange={val => handleChange(idx, 'sendingLocation', val)}
                      placeholder="Select"
                      disabled={row.status === 'Archived'}
                    />
                  </td>
                  <td className="border px-2 py-1 w-64 align-top break-words whitespace-pre-wrap">
                    <input
                      type="text"
                      className="w-full border rounded px-1 py-0.5"
                      value={row.item}
                      onChange={e => handleChange(idx, 'item', e.target.value)}
                      disabled={row.status === 'Archived'}
                    />
                  </td>
                  <td className="border px-2 py-1 align-top break-words whitespace-pre-wrap">
                    <input
                      type="number"
                      className="w-full border rounded px-1 py-0.5"
                      value={row.perMonth}
                      onChange={e => handleChange(idx, 'perMonth', e.target.value)}
                      disabled={row.status === 'Archived'}
                    />
                  </td>
                  <td className="border px-2 py-1 align-top break-words whitespace-pre-wrap">
                    <input
                      type="number"
                      className="w-full border rounded px-1 py-0.5"
                      value={row.months}
                      onChange={e => handleChange(idx, 'months', e.target.value)}
                      disabled={row.status === 'Archived'}
                    />
                  </td>
                  <td className="border px-2 py-1 text-right align-top break-words whitespace-pre-wrap">{row.costForYear && `£ ${row.costForYear}`}</td>
                  <td className="border px-2 py-1 text-center align-top break-words whitespace-pre-wrap">{row.status}</td>
                  <td className="border px-2 py-1 text-center align-top text-xs break-words whitespace-pre-wrap">
                    {row.dateChanged ? (dayjs(row.dateChanged).isSame(dayjs(), 'day') ? dayjs(row.dateChanged).format('HH:mm') : dayjs(row.dateChanged).format('DD/MM/YYYY')) : ''}
                  </td>
                  <td className="border px-2 py-1 text-center flex flex-col gap-1 items-center align-top">
                    {row.status === 'Active' ? (
                      <button
                        className="text-yellow-600 hover:underline"
                        onClick={() => handleArchiveToggle(idx)}
                      >
                        Archive
                      </button>
                    ) : (
                      <button
                        className="text-yellow-600 hover:underline"
                        onClick={() => handleArchiveToggle(idx)}
                      >
                        Unarchive
                      </button>
                    )}
                    <button
                      className="text-red-500 hover:underline"
                      onClick={() => handleDeleteRow(idx)}
                      disabled={filteredRows.length === 1}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {showImport && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-lg">
            <h4 className="text-lg font-semibold mb-2">Bulk Import Rows</h4>
            <p className="mb-2 text-sm text-gray-600">Paste rows from Excel or CSV, or upload a file. Columns: Index ID, Budget Line Item, Type of Payment, Category In Budget, Sending Location, Item, Per Month, Months, (skip Cost for Year), Status.</p>
            <textarea
              className="w-full border rounded px-2 py-1 mb-4"
              rows={8}
              value={importText}
              onChange={e => setImportText(e.target.value)}
              placeholder="Paste your rows here..."
              autoFocus
            />
            <label className="block mb-4">
              <span className="px-4 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600 cursor-pointer inline-block">Upload Excel/CSV</span>
              <input
                type="file"
                accept=".xlsx,.csv"
                className="hidden"
                onChange={handleExcelUpload}
              />
            </label>
            <div className="flex gap-2 justify-end">
              <button
                className="px-4 py-1 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => setShowImport(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                onClick={handleImport}
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
      {sheetSelectOpen && sheetNames && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-xs">
            <h4 className="text-lg font-semibold mb-2">Select Sheet to Import</h4>
            <ul className="mb-4">
              {sheetNames.map(name => (
                <li key={name}>
                  <button
                    className="w-full text-left px-2 py-1 rounded hover:bg-blue-100"
                    onClick={() => handleSheetSelect(name)}
                  >
                    {name}
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2 justify-end">
              <button
                className="px-4 py-1 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => {
                  setSheetNames(null);
                  setSheetFile(null);
                  setSheetSelectOpen(false);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {importSuccess && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded shadow-lg z-[9999]">
          Import successful!
        </div>
      )}
      {importConflictMode === 'prompt' && pendingRows && duplicateIds.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <h4 className="text-lg font-semibold mb-2">Duplicate Index IDs Detected</h4>
            <p className="mb-4 text-sm text-gray-600">The following Index IDs already exist:</p>
            <div className="mb-4 max-h-32 overflow-y-auto border rounded bg-gray-50 px-2 py-1 text-sm">
              <span className="font-semibold">{duplicateIds.join(', ')}</span>
            </div>
            <p className="mb-4 text-sm">Review and resolve each duplicate below:</p>
            {/* New DuplicateResolutionTable UI */}
            <DuplicateResolutionTable
              duplicates={duplicateIds.map(id => {
                const oldRow = rows.find(r => r.indexId === id) || {};
                const newRowArr = pendingRows.find(r => parseInt(r[0], 10) === id) || [];
                // Map newRowArr to object using parseRow
                const newRow = parseRow(newRowArr);
                return { oldRow, newRow, conflictField: "indexId" };
              })}
              columns={["budgetLineItem", "typeOfPayment", "categoryInBudget", "sendingLocation", "item", "perMonth", "months", "costForYear", "status"]}
              onResolve={({ actions, identicalAutoAssign }) => {
                // 1. Handle conflicting duplicates (as before)
                const overwriteIds = Object.entries(actions)
                  .filter(([_, v]) => v === 'accept')
                  .map(([id]) => parseInt(id, 10));
                const autoIds = Object.entries(actions)
                  .filter(([_, v]) => v === 'auto')
                  .map(([id]) => parseInt(id, 10));
                // 2. Handle identicals: auto-assign new ID if checked
                const identicalAutoRows = pendingRows.filter(r =>
                  identicalAutoAssign[parseInt(r[0], 10)]
                );
                // 3. Accept/overwrite
                const acceptRows = pendingRows.filter(r => overwriteIds.includes(parseInt(r[0], 10)));
                // 4. Auto-assign (conflicting + identical)
                const autoRows = [
                  ...pendingRows.filter(r => autoIds.includes(parseInt(r[0], 10))),
                  ...identicalAutoRows
                ];
                // 5. Overwrite selected
                if (acceptRows.length > 0) {
                  addParsedRows(acceptRows, 'overwrite');
                }
                // 6. Auto-assign selected
                if (autoRows.length > 0) {
                  addParsedRows(autoRows, 'autoid');
                }
                // 7. Remove modal
                setPendingRows(null);
                setDuplicateIds([]);
                setImportConflictMode('none');
              }}
            />
            <div className="flex gap-2 justify-end mt-4">
              <button
                className="px-4 py-1 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => {
                  setPendingRows(null);
                  setDuplicateIds([]);
                  setImportConflictMode('none');
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {importError && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded shadow-lg z-[9999]">
          {importError}
        </div>
      )}
      {importWarnings.length > 0 && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 bg-yellow-200 text-yellow-900 px-4 py-2 rounded shadow-lg z-[9999] max-w-xl w-full max-h-64 overflow-y-auto">
          <b>Import Warnings:</b>
          <ul className="list-disc pl-5">
            {importWarnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}
      {/* Bulk Adjust Modal */}
      {showBulkAdjust && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-md">
            <h4 className="text-lg font-semibold mb-2">Bulk Adjust Selected Rows</h4>
            <div className="mb-2 text-sm text-gray-600">Leave a field blank to skip updating it. Only Active rows will be changed.</div>
            <div className="mb-2">
              <label className="block text-sm font-medium">Budget Line Item</label>
              <SearchableDropdown
                value={bulkAdjustValues.budgetLineItem}
                options={getDropdown('Budget Line Item')}
                onChange={val => setBulkAdjustValues(v => ({ ...v, budgetLineItem: val }))}
                placeholder="Set Budget Line Item"
              />
              <label className="block text-sm font-medium">Per Month</label>
              <input
                type="number"
                className="w-full border rounded px-2 py-1 mb-2"
                value={bulkAdjustValues.perMonth}
                onChange={e => setBulkAdjustValues(v => ({ ...v, perMonth: e.target.value }))}
                placeholder="Set Per Month"
              />
              <label className="block text-sm font-medium">Months</label>
              <input
                type="number"
                className="w-full border rounded px-2 py-1 mb-2"
                value={bulkAdjustValues.months}
                onChange={e => setBulkAdjustValues(v => ({ ...v, months: e.target.value }))}
                placeholder="Set Months"
              />
              <label className="block text-sm font-medium">Type of Payment</label>
              <SearchableDropdown
                value={bulkAdjustValues.typeOfPayment}
                options={getDropdown('Type of Payment')}
                onChange={val => setBulkAdjustValues(v => ({ ...v, typeOfPayment: val }))}
                placeholder="Set Type of Payment"
              />
              <label className="block text-sm font-medium">Category In Budget</label>
              <SearchableDropdown
                value={bulkAdjustValues.categoryInBudget}
                options={getDropdown('Category In Budget')}
                onChange={val => setBulkAdjustValues(v => ({ ...v, categoryInBudget: val }))}
                placeholder="Set Category In Budget"
              />
              <label className="block text-sm font-medium">Sending Location</label>
              <SearchableDropdown
                value={bulkAdjustValues.sendingLocation}
                options={getDropdown('Sending Location')}
                onChange={val => setBulkAdjustValues(v => ({ ...v, sendingLocation: val }))}
                placeholder="Set Sending Location"
              />
              <label className="block text-sm font-medium">Status</label>
              <SearchableDropdown
                value={bulkAdjustValues.status}
                options={['Active', 'Archived']}
                onChange={val => setBulkAdjustValues(v => ({ ...v, status: val }))}
                placeholder="Set Status"
              />
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button
                className="px-4 py-1 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => setShowBulkAdjust(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                onClick={handleBulkAdjustApply}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Bulk Adjust Index ID Modal */}
      {showBulkAdjustIndexId && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-md">
            <h4 className="text-lg font-semibold mb-2">Bulk Adjust Index IDs</h4>
            <div className="mb-2 text-sm text-gray-600">Enter a new unique Index ID for each selected row. No duplicates or conflicts allowed.</div>
            {bulkIndexIdError && <div className="mb-2 text-red-600 text-sm">{bulkIndexIdError}</div>}
            <div className="mb-4 max-h-64 overflow-y-auto">
              {selectedIds.map(id => {
                const row = rows.find(r => r.indexId === id);
                if (!row) return null;
                return (
                  <div key={id} className="flex items-center gap-2 mb-2">
                    <span className="w-10 text-xs text-gray-500">Old: {id}</span>
                    <input
                      type="number"
                      className="border rounded px-2 py-1 w-20"
                      value={bulkIndexIdValues[id]}
                      onChange={e => handleBulkIndexIdChange(id, e.target.value)}
                    />
                    <span className="flex-1 text-xs text-gray-700 truncate">{row.item || row.budgetLineItem}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <button
                className="px-4 py-1 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => setShowBulkAdjustIndexId(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-1 bg-green-600 text-white rounded hover:bg-green-700"
                onClick={handleBulkAdjustIndexIdApply}
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 