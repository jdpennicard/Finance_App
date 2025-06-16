import React, { useState, useRef, useEffect } from 'react';
import { useDropdownOptions } from '../context/DropdownOptionsContext';
import { useAuthFirebase } from '../firebase/AuthFirebaseContext';
import { fetchDropdownOptions, setDropdownOption, DropdownValue } from '../firebase/DropdownOptionsFirebase';

function capitalizeWords(str: string) {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase());
}

function splitValues(str: string): DropdownValue[] {
  return str
    .split(/[;,\r?\n]+/)
    .map(s => capitalizeWords(s.trim()))
    .filter(Boolean)
    .map(v => ({ value: v, archived: false }));
}

export default function DropdownOptionsManager() {
  const { options, setOptions } = useDropdownOptions();
  const { user } = useAuthFirebase();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editTags, setEditTags] = useState<DropdownValue[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [showArchived, setShowArchived] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetchDropdownOptions(user)
      .then(data => {
        if (Object.keys(data).length > 0) {
          setOptions((opts) => opts.map(opt => ({
            ...opt,
            values: data[opt.name] || [],
          })));
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
    // eslint-disable-next-line
  }, [user]);

  const handleEdit = (idx: number) => {
    setEditingIdx(idx);
    setEditTags(options[idx].values);
    setSelected(new Set());
    setShowArchived(false);
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
    setSelected(prev => {
      const newSet = new Set(prev);
      newSet.delete(idx);
      return newSet;
    });
  };

  // Bulk actions
  const handleSelectTag = (idx: number) => {
    setSelected(prev => {
      const newSet = new Set(prev);
      if (newSet.has(idx)) newSet.delete(idx);
      else newSet.add(idx);
      return newSet;
    });
  };

  const handleSelectAll = () => {
    const visible = editTags
      .map((tag, i) => (showArchived || !tag.archived ? i : null))
      .filter(i => i !== null) as number[];
    setSelected(new Set(visible));
  };

  const handleClearSelection = () => setSelected(new Set());

  const handleBulkDelete = () => {
    setEditTags(editTags.filter((_, i) => !selected.has(i)));
    setSelected(new Set());
  };

  const handleBulkArchive = () => {
    setEditTags(editTags.map((tag, i) =>
      selected.has(i) ? { ...tag, archived: true } : tag
    ));
    setSelected(new Set());
  };

  const handleBulkRestore = () => {
    setEditTags(editTags.map((tag, i) =>
      selected.has(i) ? { ...tag, archived: false } : tag
    ));
    setSelected(new Set());
  };

  const archiveTag = (idx: number) => {
    setEditTags(editTags.map((tag, i) =>
      i === idx ? { ...tag, archived: true } : tag
    ));
    setSelected(prev => {
      const newSet = new Set(prev);
      newSet.delete(idx);
      return newSet;
    });
  };

  const handleSave = async () => {
    if (editingIdx === null || !user) return;
    const optionName = options[editingIdx].name;
    try {
      setLoading(true);
      await setDropdownOption(user, optionName, editTags);
      setOptions(opts =>
        opts.map((opt, i) =>
          i === editingIdx ? { ...opt, values: editTags } : opt
        )
      );
      setEditingIdx(null);
      setEditTags([]);
      setInputValue('');
      setSelected(new Set());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditingIdx(null);
    setEditTags([]);
    setInputValue('');
    setSelected(new Set());
  };

  if (loading) return <div className="p-4 text-center">Loading dropdown options...</div>;
  if (error) return <div className="p-4 text-center text-red-600">{error}</div>;

  return (
    <div>
      <h3 className="text-lg font-semibold mb-2">Dropdown Options</h3>
      <div className="mb-2 flex items-center">
        <label className="text-sm cursor-pointer flex items-center">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={e => setShowArchived(e.target.checked)}
            className="mr-2"
          />
          Show Archived
        </label>
      </div>
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
                  {(showArchived ? opt.values : opt.values.filter(v => !v.archived)).map((val, i) => (
                    <span
                      key={val.value + i}
                      className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${opt.color} ${val.archived ? 'opacity-50 italic' : ''}`}
                    >
                      {val.value}
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
              <button
                className="text-xs px-2 py-0.5 bg-gray-200 rounded hover:bg-gray-300 mr-2"
                onClick={handleSelectAll}
                type="button"
              >
                Select All
              </button>
              <button
                className="text-xs px-2 py-0.5 bg-gray-200 rounded hover:bg-gray-300 mr-2"
                onClick={handleClearSelection}
                type="button"
              >
                Clear Selection
              </button>
              <button
                className="text-xs px-2 py-0.5 bg-red-200 text-red-800 rounded hover:bg-red-300 mr-2"
                onClick={handleBulkDelete}
                disabled={selected.size === 0}
                type="button"
              >
                Delete Selected
              </button>
              {!showArchived ? (
                <button
                  className="text-xs px-2 py-0.5 bg-yellow-200 text-yellow-800 rounded hover:bg-yellow-300 mr-2"
                  onClick={handleBulkArchive}
                  disabled={selected.size === 0}
                  type="button"
                >
                  Archive Selected
                </button>
              ) : (
                <button
                  className="text-xs px-2 py-0.5 bg-green-200 text-green-800 rounded hover:bg-green-300 mr-2"
                  onClick={handleBulkRestore}
                  disabled={selected.size === 0}
                  type="button"
                >
                  Restore Selected
                </button>
              )}
              <label className="ml-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={showArchived}
                  onChange={e => setShowArchived(e.target.checked)}
                  className="mr-1"
                />
                Show Archived
              </label>
            </div>
            <div className="flex flex-wrap gap-1 mb-2">
              {editTags
                .map((tag, i) =>
                  (showArchived || !tag.archived) ? (
                    <span
                      key={tag.value + i}
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${options[editingIdx!].color} ${selected.has(i) ? 'ring-2 ring-blue-400' : ''} ${tag.archived ? 'opacity-50' : ''}`}
                      onClick={() => handleSelectTag(i)}
                      style={{ cursor: 'pointer' }}
                    >
                      {tag.value}
                      <button
                        className="ml-1 text-xs text-gray-500 hover:text-yellow-600"
                        onClick={e => { e.stopPropagation(); archiveTag(i); }}
                        aria-label="Archive"
                        type="button"
                      >
                        ×
                      </button>
                    </span>
                  ) : null
                )}
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