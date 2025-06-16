import React, { useState } from 'react';
import { useDropdownOptions } from '../context/DropdownOptionsContext';

const initialRows = [
  { name: '', type: '', categoryInBudget: '', sendingLocation: '', defaultAmount: '' },
];

export default function EditableCategoriesTable() {
  const [rows, setRows] = useState(initialRows);
  const { options } = useDropdownOptions();
  const typeOptions = options.find(opt => opt.name === 'Type of Payment')?.values || [];
  const categoryOptions = options.find(opt => opt.name === 'Category In Budget')?.values || [];
  const sendingLocationOptions = options.find(opt => opt.name === 'Sending Location')?.values || [];

  const handleChange = (idx: number, field: string, value: string) => {
    const updated = rows.map((row, i) =>
      i === idx ? { ...row, [field]: value } : row
    );
    setRows(updated);
  };

  const handleAddRow = () => {
    setRows([...rows, { name: '', type: '', categoryInBudget: '', sendingLocation: '', defaultAmount: '' }]);
  };

  const handleDeleteRow = (idx: number) => {
    setRows(rows.filter((_, i) => i !== idx));
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border border-gray-300 bg-white">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-2 py-1">Name</th>
            <th className="border px-2 py-1">Type</th>
            <th className="border px-2 py-1">Category In Budget</th>
            <th className="border px-2 py-1">Sending Location</th>
            <th className="border px-2 py-1">Default Amount</th>
            <th className="border px-2 py-1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx}>
              <td className="border px-2 py-1">
                <input
                  type="text"
                  className="w-full border rounded px-1 py-0.5"
                  value={row.name}
                  onChange={e => handleChange(idx, 'name', e.target.value)}
                />
              </td>
              <td className="border px-2 py-1">
                <select
                  className="w-full border rounded px-1 py-0.5"
                  value={row.type}
                  onChange={e => handleChange(idx, 'type', e.target.value)}
                >
                  <option value="">Select</option>
                  {typeOptions.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </td>
              <td className="border px-2 py-1">
                <select
                  className="w-full border rounded px-1 py-0.5"
                  value={row.categoryInBudget}
                  onChange={e => handleChange(idx, 'categoryInBudget', e.target.value)}
                >
                  <option value="">Select</option>
                  {categoryOptions.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </td>
              <td className="border px-2 py-1">
                <select
                  className="w-full border rounded px-1 py-0.5"
                  value={row.sendingLocation}
                  onChange={e => handleChange(idx, 'sendingLocation', e.target.value)}
                >
                  <option value="">Select</option>
                  {sendingLocationOptions.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </td>
              <td className="border px-2 py-1">
                <input
                  type="number"
                  className="w-full border rounded px-1 py-0.5"
                  value={row.defaultAmount}
                  onChange={e => handleChange(idx, 'defaultAmount', e.target.value)}
                />
              </td>
              <td className="border px-2 py-1 text-center">
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