import React, { useEffect, useState } from 'react';
import { useDropdownOptions } from '../context/DropdownOptionsContext';
import { useAuthFirebase } from '../firebase/AuthFirebaseContext';
import { fetchCategories, addCategory, updateCategory, deleteCategory } from '../firebase/CategoriesFirebase';

export default function EditableCategoriesTable() {
  const { user } = useAuthFirebase();
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { options } = useDropdownOptions();
  const typeOptions = options.find(opt => opt.name === 'Type of Payment')?.values || [];
  const categoryOptions = options.find(opt => opt.name === 'Category In Budget')?.values || [];
  const sendingLocationOptions = options.find(opt => opt.name === 'Sending Location')?.values || [];

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetchCategories(user)
      .then(data => setRows(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  const handleChange = (idx: number, field: string, value: string) => {
    const updated = rows.map((row, i) =>
      i === idx ? { ...row, [field]: value } : row
    );
    setRows(updated);
  };

  const handleAddRow = async () => {
    if (!user) return;
    const newCategory = { name: '', type: '', categoryInBudget: '', sendingLocation: '', defaultAmount: '' };
    try {
      const docRef = await addCategory(user, newCategory);
      setRows([...rows, { ...newCategory, id: docRef.id }]);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleUpdateRow = async (idx: number) => {
    if (!user) return;
    const row = rows[idx];
    if (!row.id) return;
    try {
      await updateCategory(user, row.id, row);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteRow = async (idx: number) => {
    if (!user) return;
    const row = rows[idx];
    if (!row.id) return;
    try {
      await deleteCategory(user, row.id);
      setRows(rows.filter((_, i) => i !== idx));
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) return <div className="p-4 text-center">Loading categories...</div>;
  if (error) return <div className="p-4 text-center text-red-600">{error}</div>;

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
            <tr key={row.id || idx}>
              <td className="border px-2 py-1">
                <input
                  type="text"
                  className="w-full border rounded px-1 py-0.5"
                  value={row.name}
                  onChange={e => handleChange(idx, 'name', e.target.value)}
                  onBlur={() => handleUpdateRow(idx)}
                />
              </td>
              <td className="border px-2 py-1">
                <select
                  className="w-full border rounded px-1 py-0.5"
                  value={row.type}
                  onChange={e => handleChange(idx, 'type', e.target.value)}
                  onBlur={() => handleUpdateRow(idx)}
                >
                  <option value="">Select</option>
                  {typeOptions.map(type => (
                    <option key={type.value} value={type.value}>{type.value}</option>
                  ))}
                </select>
              </td>
              <td className="border px-2 py-1">
                <select
                  className="w-full border rounded px-1 py-0.5"
                  value={row.categoryInBudget}
                  onChange={e => handleChange(idx, 'categoryInBudget', e.target.value)}
                  onBlur={() => handleUpdateRow(idx)}
                >
                  <option value="">Select</option>
                  {categoryOptions.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.value}</option>
                  ))}
                </select>
              </td>
              <td className="border px-2 py-1">
                <select
                  className="w-full border rounded px-1 py-0.5"
                  value={row.sendingLocation}
                  onChange={e => handleChange(idx, 'sendingLocation', e.target.value)}
                  onBlur={() => handleUpdateRow(idx)}
                >
                  <option value="">Select</option>
                  {sendingLocationOptions.map(loc => (
                    <option key={loc.value} value={loc.value}>{loc.value}</option>
                  ))}
                </select>
              </td>
              <td className="border px-2 py-1">
                <input
                  type="number"
                  className="w-full border rounded px-1 py-0.5"
                  value={row.defaultAmount}
                  onChange={e => handleChange(idx, 'defaultAmount', e.target.value)}
                  onBlur={() => handleUpdateRow(idx)}
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