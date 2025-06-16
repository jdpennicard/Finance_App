import React from 'react';
import EditableTransactionsTable from '../components/EditableTransactionsTable';

export default function Transactions() {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Transactions</h2>
      <EditableTransactionsTable />
    </div>
  );
} 