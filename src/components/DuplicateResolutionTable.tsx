import React, { useState } from "react";
import clsx from "clsx";
import { AiOutlineWarning } from "react-icons/ai";
import { Tooltip } from "react-tooltip";
import "react-tooltip/dist/react-tooltip.css";

// Types
export type RowData = {
  indexId: string | number;
  [key: string]: any;
};

export type Duplicate = {
  oldRow: RowData;
  newRow: RowData;
  conflictField: string;
};

export type Action = "keep" | "accept" | "auto";

interface Props {
  duplicates: Duplicate[];
  onResolve: (resolutions: { actions: { [indexId: string]: Action }, identicalAutoAssign: { [indexId: string]: boolean } }) => void;
  columns: string[]; // e.g., ["Budget Line Item", "Type of Payment", ...]
}

const actionLabels = {
  keep: "Keep Old",
  accept: "Accept New",
  auto: "Auto Assign New ID",
};

// Helper: Detect if a change is 'major' (e.g., large number change or required field blank)
function isMajorChange(col: string, oldVal: any, newVal: any) {
  if (typeof oldVal === "number" && typeof newVal === "number") {
    if (oldVal === 0) return false;
    const diff = Math.abs(newVal - oldVal) / Math.abs(oldVal);
    return diff > 0.5; // >50% change
  }
  if ((oldVal && !newVal) || (!oldVal && newVal)) {
    return true;
  }
  return false;
}

// Normalization function for comparison
function normalizeValue(val: any, col?: string) {
  if (val === null || val === undefined) return '';
  // Numeric comparison
  if (!isNaN(val) && val !== '' && typeof val !== 'boolean') {
    return parseFloat(val);
  }
  if (typeof val === 'string') {
    let s = val.trim().toLowerCase();
    if (col === 'status') {
      // Treat 'archive' and 'archived' as the same
      if (s === 'archived') s = 'archive';
      if (s.endsWith('d') && s.slice(0, -1) === 'archive') s = 'archive';
    }
    return s;
  }
  return val;
}

export const DuplicateResolutionTable: React.FC<Props> = ({
  duplicates,
  onResolve,
  columns,
}) => {
  // Filter out rows where item is 'Sample Item' in either oldRow or newRow
  const filteredDuplicates = duplicates.filter(
    d => d.newRow.item !== 'Sample Item' && d.oldRow.item !== 'Sample Item'
  );

  // Split into identical and conflicting using normalization
  const identical = filteredDuplicates.filter(d =>
    columns.every(col => normalizeValue(d.oldRow[col], col) === normalizeValue(d.newRow[col], col))
  );
  const conflicting = filteredDuplicates.filter(d =>
    columns.some(col => normalizeValue(d.oldRow[col], col) !== normalizeValue(d.newRow[col], col))
  );

  // Compute columns with at least one change (for conflicting, using normalization)
  const changedColumns = columns.filter(col =>
    conflicting.some(({ oldRow, newRow }) => normalizeValue(oldRow[col], col) !== normalizeValue(newRow[col], col))
  );

  // State for actions for conflicting
  const [actions, setActions] = useState<{ [indexId: string]: Action }>(
    Object.fromEntries(conflicting.map((d) => [String(d.newRow.indexId), "accept"]))
  );
  // State for identical auto-assign
  const [identicalAutoAssign, setIdenticalAutoAssign] = useState<{ [indexId: string]: boolean }>(
    Object.fromEntries(identical.map((d) => [String(d.newRow.indexId), false]))
  );

  const setAll = (action: Action) => {
    setActions(
      Object.fromEntries(conflicting.map((d) => [String(d.newRow.indexId), action]))
    );
  };

  const handleChange = (indexId: string, action: Action) => {
    setActions((prev) => ({ ...prev, [indexId]: action }));
  };

  const handleIdenticalAutoAssign = (indexId: string, checked: boolean) => {
    setIdenticalAutoAssign(prev => ({ ...prev, [indexId]: checked }));
  };

  return (
    <div className="w-full max-w-full">
      {/* Identical Section */}
      {identical.length > 0 && (
        <div className="mb-6 p-4 border rounded bg-gray-50">
          <div className="mb-2 font-semibold text-gray-700">
            <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded">Identical Duplicates</span>
            <br />
            <span className="text-sm">These items have matching IDs and are otherwise identical. They will be skipped unless you check <b>Auto Assign New ID</b>:</span>
          </div>
          <table className="min-w-full text-sm mb-2">
            <thead>
              <tr>
                <th className="p-2">Index ID</th>
                <th className="p-2">item</th>
                <th className="p-2">costForYear</th>
                <th className="p-2">status</th>
                <th className="p-2 whitespace-nowrap min-w-[160px] w-40">Auto Assign New ID</th>
              </tr>
            </thead>
            <tbody>
              {identical.map(({ oldRow, newRow }) => (
                <tr key={newRow.indexId} className="border-t">
                  <td className="p-2 align-top font-mono">{newRow.indexId}</td>
                  <td className="p-2 align-top">{newRow['item']}</td>
                  <td className="p-2 align-top">{newRow['costForYear']}</td>
                  <td className="p-2 align-top">{newRow['status']}</td>
                  <td className="p-2 align-top text-center whitespace-nowrap min-w-[160px] w-40">
                    <input
                      type="checkbox"
                      checked={identicalAutoAssign[String(newRow.indexId)]}
                      onChange={e => handleIdenticalAutoAssign(String(newRow.indexId), e.target.checked)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Bulk Actions for conflicting */}
      {conflicting.length > 0 && (
        <div className="flex gap-2 mb-2 sticky top-0 bg-white z-10 p-2 border-b">
          {(["accept", "keep", "auto"] as Action[]).map((action) => (
            <button
              key={action}
              className="px-3 py-1 rounded bg-blue-100 hover:bg-blue-200 text-blue-800 font-medium"
              onClick={() => setAll(action)}
              type="button"
            >
              {actionLabels[action]} All
            </button>
          ))}
        </div>
      )}
      {/* Conflicting Table */}
      {conflicting.length > 0 && (
        <div className="overflow-x-auto max-h-96 overflow-y-auto border rounded shadow-sm">
          <table className="min-w-full text-sm">
            <thead className="sticky top-0 bg-gray-50 z-20">
              <tr>
                <th className="p-2 bg-gray-50">Action</th>
                <th className="p-2 bg-gray-50">Index ID</th>
                <th className="p-2 bg-gray-50">item</th>
                {changedColumns.map((col) => (
                  col !== 'item' && <th key={col} className="p-2 bg-gray-50">{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {conflicting.map(({ oldRow, newRow }, i) => (
                <tr key={newRow.indexId} className="border-t">
                  {/* Action */}
                  <td className="p-2 align-top">
                    <div className="flex flex-col gap-1">
                      {(["keep", "accept", "auto"] as Action[]).map((action) => (
                        <label key={action} className="flex items-center gap-1">
                          <input
                            type="radio"
                            name={`action-${newRow.indexId}`}
                            checked={actions[String(newRow.indexId)] === action}
                            onChange={() => handleChange(String(newRow.indexId), action)}
                          />
                          <span className="text-xs">{actionLabels[action]}</span>
                        </label>
                      ))}
                    </div>
                  </td>
                  {/* Index ID */}
                  <td className="p-2 align-top font-mono">{newRow.indexId}</td>
                  {/* Always show item */}
                  <td className="p-2 align-top min-w-[180px] whitespace-normal">{newRow['item']}</td>
                  {/* Only show changed columns, new value + old value (strikethrough if changed) in one cell */}
                  {changedColumns.map((col) => {
                    if (col === 'item') return null;
                    const changed = normalizeValue(oldRow[col], col) !== normalizeValue(newRow[col], col);
                    const major = changed && isMajorChange(col, oldRow[col], newRow[col]);
                    const isBlank = !newRow[col];
                    return (
                      <td
                        key={col}
                        className={clsx(
                          "p-2 align-top",
                          changed && "bg-green-100",
                          isBlank && "bg-red-100"
                        )}
                        data-tooltip-id={`tooltip-new-${i}-${col}`}
                        data-tooltip-content={changed ? `New: ${newRow[col]}` : undefined}
                      >
                        <span>{newRow[col]}</span>
                        {changed && (
                          <span className="ml-2 text-gray-500 line-through italic">{oldRow[col]}</span>
                        )}
                        {major && (
                          <span 
                            data-tooltip-id={`warn-new-${i}-${col}`}
                            data-tooltip-content="Major change!"
                            className="text-yellow-600 ml-1"
                          >
                            <AiOutlineWarning size={16} />
                            <Tooltip id={`warn-new-${i}-${col}`} />
                          </span>
                        )}
                        {isBlank && (
                          <span 
                            data-tooltip-id={`blank-new-${i}-${col}`}
                            data-tooltip-content="Blank value!"
                            className="text-red-600 ml-1"
                          >
                            <AiOutlineWarning size={16} />
                            <Tooltip id={`blank-new-${i}-${col}`} />
                          </span>
                        )}
                        {changed && <Tooltip id={`tooltip-new-${i}-${col}`} />}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {/* Confirm Button */}
      <div className="flex justify-end mt-4">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => onResolve({ actions, identicalAutoAssign })}
        >
          Confirm Choices
        </button>
      </div>
    </div>
  );
}; 