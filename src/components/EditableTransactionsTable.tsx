import React, { useState } from 'react';

const initialRows = [
  { date: '', category: '', description: '', amount: '', type: '' },
];

const categories = ['Income', 'Bills', 'Sinking Fund', 'Expense'];
const types = ['income', 'expense'];

export default function EditableTransactionsTable() {
  const [rows, setRows] = useState(initialRows);

  const handleChange = (idx: number, field: string, value: string) => {
    const updated = rows.map((row, i) =>
      i === idx ? { ...row, [field]: value } : row
    );
    setRows(updated);
  };

  const handleAddRow = () => {
    setRows([...rows, { date: '', category: '', description: '', amount: '', type: '' }]);
  };

  const handleDeleteRow = (idx: number) => {
    setRows(rows.filter((_, i) => i !== idx));
  };

  const handleDuplicateRow = (idx: number) => {
    const rowToDuplicate = rows[idx];
    const newRows = [...rows];
    newRows.splice(idx + 1, 0, { ...rowToDuplicate });
    setRows(newRows);
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-300 bg-white">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-2 py-1">Date</th>
            <th className="border px-2 py-1">Category</th>
            <th className="border px-2 py-1">Description</th>
            <th className="border px-2 py-1">Amount</th>
            <th className="border px-2 py-1">Type</th>
            <th className="border px-2 py-1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              <td className="border px-2 py-1">
                <input
                  type="date"
                  className="w-full border rounded px-1 py-0.5"
                  value={row.date}
                  onChange={e => handleChange(idx, 'date', e.target.value)}
                />
              </td>
              <td className="border px-2 py-1">
                <select
                  className="w-full border rounded px-1 py-0.5"
                  value={row.category}
                  onChange={e => handleChange(idx, 'category', e.target.value)}
                >
                  <option value="">Select</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </td>
              <td className="border px-2 py-1">
                <input
                  type="text"
                  className="w-full border rounded px-1 py-0.5"
                  value={row.description}
                  onChange={e => handleChange(idx, 'description', e.target.value)}
                />
              </td>
              <td className="border px-2 py-1">
                <input
                  type="number"
                  className="w-full border rounded px-1 py-0.5"
                  value={row.amount}
                  onChange={e => handleChange(idx, 'amount', e.target.value)}
                />
              </td>
              <td className="border px-2 py-1">
                <select
                  className="w-full border rounded px-1 py-0.5"
                  value={row.type}
                  onChange={e => handleChange(idx, 'type', e.target.value)}
                >
                  <option value="">Select</option>
                  {types.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </td>
              <td className="border px-2 py-1 text-center space-x-2">
                <button
                  className="text-blue-500 hover:underline"
                  onClick={() => handleDuplicateRow(idx)}
                >
                  Duplicate
                </button>
                <button
                  className="text-red-500 hover:underline"
                  onClick={() => handleDeleteRow(idx)}
                  disabled={rows.length === 1}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        className="mt-2 px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
        onClick={handleAddRow}
      >
        Add Row
      </button>
    </div>
  );
} 