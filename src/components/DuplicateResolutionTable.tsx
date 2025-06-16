import React, { useState } from "react";
import clsx from "clsx";
import { AiOutlineWarning } from "react-icons/ai";
import ReactTooltip from "react-tooltip";
import { DuplicateResolutionTable, Duplicate, Action } from "../components/DuplicateResolutionTable";

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
  onResolve: (resolutions: { [indexId: string]: Action }) => void;
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

export const DuplicateResolutionTable: React.FC<Props> = ({
  duplicates,
  onResolve,
  columns,
}) => {
  const [actions, setActions] = useState<{ [indexId: string]: Action }>(
    Object.fromEntries(duplicates.map((d) => [d.newRow.indexId, "accept"]))
  );

  const setAll = (action: Action) => {
    setActions(
      Object.fromEntries(duplicates.map((d) => [d.newRow.indexId, action]))
    );
  };

  const handleChange = (indexId: string, action: Action) => {
    setActions((prev) => ({ ...prev, [indexId]: action }));
  };

  return (
    <div className="w-full max-w-full">
      {/* Bulk Actions */}
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
      {/* Table */}
      <div className="overflow-x-auto max-h-96 overflow-y-auto border rounded shadow-sm">
        <table className="min-w-full text-sm">
          <thead className="sticky top-10 bg-gray-50 z-10">
            <tr>
              <th className="p-2">Action</th>
              <th className="p-2">Old Value</th>
              <th className="p-2">New Value</th>
              <th className="p-2">Index ID</th>
              {columns.map((col) => (
                <th key={col} className="p-2">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {duplicates.map(({ oldRow, newRow }, i) => (
              <tr key={newRow.indexId} className="border-t">
                {/* Action */}
                <td className="p-2 align-top">
                  <div className="flex flex-col gap-1">
                    {(["keep", "accept", "auto"] as Action[]).map((action) => (
                      <label key={action} className="flex items-center gap-1">
                        <input
                          type="radio"
                          name={`action-${newRow.indexId}`}
                          checked={actions[newRow.indexId] === action}
                          onChange={() => handleChange(newRow.indexId, action)}
                        />
                        <span className="text-xs">{actionLabels[action]}</span>
                      </label>
                    ))}
                  </div>
                </td>
                {/* Old Value */}
                <td className="p-2 align-top bg-gray-50">
                  {columns.map((col) => {
                    const changed = oldRow[col] !== newRow[col];
                    const major = changed && isMajorChange(col, oldRow[col], newRow[col]);
                    return (
                      <div
                        key={col}
                        className={clsx(
                          "truncate relative flex items-center gap-1",
                          changed && "bg-yellow-100"
                        )}
                        data-tip={changed ? `Old: ${oldRow[col]}` : undefined}
                        data-for={`tooltip-old-${i}-${col}`}
                      >
                        {oldRow[col]}
                        {major && (
                          <span data-tip="Major change!" data-for={`warn-old-${i}-${col}`} className="text-yellow-600">
                            <AiOutlineWarning size={16} />
                            <ReactTooltip id={`warn-old-${i}-${col}`} effect="solid" place="top" />
                          </span>
                        )}
                        {changed && <ReactTooltip id={`tooltip-old-${i}-${col}`} effect="solid" place="top" />}
                      </div>
                    );
                  })}
                </td>
                {/* New Value */}
                <td className="p-2 align-top bg-white">
                  {columns.map((col) => {
                    const changed = oldRow[col] !== newRow[col];
                    const major = changed && isMajorChange(col, oldRow[col], newRow[col]);
                    const isBlank = !newRow[col];
                    return (
                      <div
                        key={col}
                        className={clsx(
                          "truncate relative flex items-center gap-1",
                          changed && "bg-green-100",
                          isBlank && "bg-red-100"
                        )}
                        data-tip={changed ? `New: ${newRow[col]}` : undefined}
                        data-for={`tooltip-new-${i}-${col}`}
                      >
                        {newRow[col]}
                        {major && (
                          <span data-tip="Major change!" data-for={`warn-new-${i}-${col}`} className="text-yellow-600">
                            <AiOutlineWarning size={16} />
                            <ReactTooltip id={`warn-new-${i}-${col}`} effect="solid" place="top" />
                          </span>
                        )}
                        {isBlank && (
                          <span data-tip="Blank value!" data-for={`blank-new-${i}-${col}`} className="text-red-600">
                            <AiOutlineWarning size={16} />
                            <ReactTooltip id={`blank-new-${i}-${col}`} effect="solid" place="top" />
                          </span>
                        )}
                        {changed && <ReactTooltip id={`tooltip-new-${i}-${col}`} effect="solid" place="top" />}
                      </div>
                    );
                  })}
                </td>
                {/* Index ID */}
                <td className="p-2 align-top font-mono">{newRow.indexId}</td>
                {/* Other columns (optional) */}
                {/* ... */}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Confirm Button */}
      <div className="flex justify-end mt-4">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          onClick={() => onResolve(actions)}
        >
          Confirm Choices
        </button>
      </div>
    </div>
  );
}; 