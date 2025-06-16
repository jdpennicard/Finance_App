import React, { useState, useRef } from 'react';
import { useDropdownOptions } from '../context/DropdownOptionsContext';

function capitalizeWords(str: string) {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
}

function splitValues(str: string) {
  return str
    .split(/[;,\r?\n]+/)
    .map(s => capitalizeWords(s.trim()))
    .filter(Boolean);
}

export default function DropdownOptionsManager() {
  const { options, setOptions } = useDropdownOptions();
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editTags, setEditTags] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleEdit = (idx: number) => {
    setEditingIdx(idx);
    setEditTags(options[idx].values);
    setInputValue('');
  };

  const handleTagInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',' || e.key === ';') {
      e.preventDefault();
      addTag(inputValue);
    }
  };

  const handleTagPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const paste = e.clipboardData.getData('text');
    const newTags = splitValues(paste);
    if (newTags.length > 0) {
      setEditTags([...editTags, ...newTags]);
      setInputValue('');
      e.preventDefault();
    }
  };

  const addTag = (val: string) => {
    const newTags = splitValues(val);
    if (newTags.length > 0) {
      setEditTags([...editTags, ...newTags]);
      setInputValue('');
    }
  };

  const removeTag = (idx: number) => {
    setEditTags(editTags.filter((_, i) => i !== idx));
  };

  const handleSave = () => {
    if (editingIdx === null) return;
    setOptions(opts =>
      opts.map((opt, i) =>
        i === editingIdx ? { ...opt, values: editTags } : opt
      )
    );
    setEditingIdx(null);
    setEditTags([]);
    setInputValue('');
  };

  const handleCancel = () => {
    setEditingIdx(null);
    setEditTags([]);
    setInputValue('');
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Dropdown Options</h3>
      <table className="min-w-full border border-gray-300 bg-white mb-4">
        <thead>
          <tr className="bg-gray-100">
            <th className="border px-2 py-1">Category Name</th>
            <th className="border px-2 py-1">Included Values</th>
            <th className="border px-2 py-1">Actions</th>
          </tr>
        </thead>
        <tbody>
          {options.map((opt, idx) => (
            <tr key={opt.name}>
              <td className="border px-2 py-1 font-semibold align-top w-48">{opt.name}</td>
              <td className="border px-2 py-1 text-sm align-top">
                <div className="flex flex-wrap gap-1">
                  {opt.values.map((val, i) => (
                    <span
                      key={val + i}
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${opt.color}`}
                    >
                      {val}
                    </span>
                  ))}
                </div>
              </td>
              <td className="border px-2 py-1 text-center align-top">
                <button
                  className="text-blue-600 hover:underline"
                  onClick={() => handleEdit(idx)}
                >
                  Edit
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {editingIdx !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-6 w-full max-w-md">
            <h4 className="text-lg font-semibold mb-2">
              Edit Values for: {options[editingIdx].name}
            </h4>
            <label className="block mb-2 text-sm font-medium">Add values (comma, semicolon, or line break to add):</label>
            <div className="flex flex-wrap gap-1 mb-2">
              {editTags.map((tag, i) => (
                <span
                  key={tag + i}
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${options[editingIdx!].color}`}
                >
                  {tag}
                  <button
                    className="ml-1 text-xs text-gray-500 hover:text-red-600"
                    onClick={() => removeTag(i)}
                    aria-label="Remove"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <input
              ref={inputRef}
              className="w-full border rounded px-2 py-1 mb-4"
              value={inputValue}
              onChange={handleTagInput}
              onKeyDown={handleTagKeyDown}
              onPaste={handleTagPaste}
              placeholder="Type and press comma, semicolon, or paste multiple lines..."
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <button
                className="px-4 py-1 bg-gray-200 rounded hover:bg-gray-300"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={handleSave}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 