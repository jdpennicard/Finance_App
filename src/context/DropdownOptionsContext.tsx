import React, { createContext, useContext, useState, ReactNode } from 'react';

export type DropdownCategory = {
  name: string;
  color: string;
  values: string[];
};

const initialOptions: DropdownCategory[] = [
  {
    name: 'Budget Line Item',
    color: 'bg-blue-100 text-blue-800',
    values: [
      'Bills', 'Extra This', 'Holding Pot', 'Income', 'Other Money',
    ],
  },
  {
    name: 'Type of Payment',
    color: 'bg-green-100 text-green-800',
    values: [
      'Needs', 'Wants', 'Holding Pot', 'Income', 'Debt',
    ],
  },
  {
    name: 'Category In Budget',
    color: 'bg-yellow-100 text-yellow-800',
    values: [
      '4 Walls', 'Entertainment', 'Living Costs', 'Mistakes', 'Vacations', 'Luxuries', 'Debt', 'Savings/Donations', 'Business', 'Health', 'Gifting', 'Item Not Tracked', 'Recklessness', 'Vacations', 'Clean Up', 'Transfer', 'Insurance',
    ],
  },
  {
    name: 'Sending Location',
    color: 'bg-pink-100 text-pink-800',
    values: [
      'Joint Natwest', 'Subscription', 'Caravan Rent', 'Fish Stuff', 'Float', 'ESPP Pot', 'Jake Monzo', 'Money From Jake', 'Monzo', 'Savings', 'All Insurance', 'Cat Pot', 'Pet Insurance', 'Insurance', 'Food Pot', 'Gousto', 'Petrol Pot', 'Takeaway', 'Evie Monzo', 'Jake - ESPP', 'Jake/Evie', 'Evie', 'Gym Pot', 'Jake', 'Baby Pot', 'Barclaycard', 'Emergency', 'Future Planning', 'Personal Debt', 'Starling', 'Car Pot', 'Birthdays', 'Christmas', 'Vacations', 'Joint Account', 'Ether', 'Clothes', 'Clothes Pot', 'Home', 'House', 'Houses Pot', "Jake's CC", 'Joint Monzo', 'Caravan Pot', 'Cash', "Jake's Birthday", 'JeevieXmas', 'Personal Account', 'Vacation', 'The Ether', 'FirstPort',
    ],
  },
];

type DropdownOptionsContextType = {
  options: DropdownCategory[];
  setOptions: React.Dispatch<React.SetStateAction<DropdownCategory[]>>;
};

const DropdownOptionsContext = createContext<DropdownOptionsContextType | undefined>(undefined);

export function DropdownOptionsProvider({ children }: { children: ReactNode }) {
  const [options, setOptions] = useState<DropdownCategory[]>(initialOptions);
  return (
    <DropdownOptionsContext.Provider value={{ options, setOptions }}>
      {children}
    </DropdownOptionsContext.Provider>
  );
}

export function useDropdownOptions() {
  const ctx = useContext(DropdownOptionsContext);
  if (!ctx) throw new Error('useDropdownOptions must be used within DropdownOptionsProvider');
  return ctx;
} 