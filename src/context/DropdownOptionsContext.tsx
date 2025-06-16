import React, { createContext, useContext, useState, ReactNode } from 'react';
import { DropdownValue } from '../firebase/DropdownOptionsFirebase';

export type DropdownCategory = {
  name: string;
  color: string;
  values: DropdownValue[];
};

const initialOptions: DropdownCategory[] = [
  {
    name: 'Budget Line Item',
    color: 'bg-blue-100 text-blue-800',
    values: [
      { value: 'Bills', archived: false },
      { value: 'Extra This', archived: false },
      { value: 'Holding Pot', archived: false },
      { value: 'Income', archived: false },
      { value: 'Other Money', archived: false },
    ],
  },
  {
    name: 'Type of Payment',
    color: 'bg-green-100 text-green-800',
    values: [
      { value: 'Needs', archived: false },
      { value: 'Wants', archived: false },
      { value: 'Holding Pot', archived: false },
      { value: 'Income', archived: false },
      { value: 'Debt', archived: false },
    ],
  },
  {
    name: 'Category In Budget',
    color: 'bg-yellow-100 text-yellow-800',
    values: [
      { value: '4 Walls', archived: false },
      { value: 'Entertainment', archived: false },
      { value: 'Living Costs', archived: false },
      { value: 'Mistakes', archived: false },
      { value: 'Vacations', archived: false },
      { value: 'Luxuries', archived: false },
      { value: 'Debt', archived: false },
      { value: 'Savings/Donations', archived: false },
      { value: 'Business', archived: false },
      { value: 'Health', archived: false },
      { value: 'Gifting', archived: false },
      { value: 'Item Not Tracked', archived: false },
      { value: 'Recklessness', archived: false },
      { value: 'Vacations', archived: false },
      { value: 'Clean Up', archived: false },
      { value: 'Transfer', archived: false },
      { value: 'Insurance', archived: false },
    ],
  },
  {
    name: 'Sending Location',
    color: 'bg-pink-100 text-pink-800',
    values: [
      { value: 'Joint Natwest', archived: false },
      { value: 'Subscription', archived: false },
      { value: 'Caravan Rent', archived: false },
      { value: 'Fish Stuff', archived: false },
      { value: 'Float', archived: false },
      { value: 'ESPP Pot', archived: false },
      { value: 'Jake Monzo', archived: false },
      { value: 'Money From Jake', archived: false },
      { value: 'Monzo', archived: false },
      { value: 'Savings', archived: false },
      { value: 'All Insurance', archived: false },
      { value: 'Cat Pot', archived: false },
      { value: 'Pet Insurance', archived: false },
      { value: 'Insurance', archived: false },
      { value: 'Food Pot', archived: false },
      { value: 'Gousto', archived: false },
      { value: 'Petrol Pot', archived: false },
      { value: 'Takeaway', archived: false },
      { value: 'Evie Monzo', archived: false },
      { value: 'Jake - ESPP', archived: false },
      { value: 'Jake/Evie', archived: false },
      { value: 'Evie', archived: false },
      { value: 'Gym Pot', archived: false },
      { value: 'Jake', archived: false },
      { value: 'Baby Pot', archived: false },
      { value: 'Barclaycard', archived: false },
      { value: 'Emergency', archived: false },
      { value: 'Future Planning', archived: false },
      { value: 'Personal Debt', archived: false },
      { value: 'Starling', archived: false },
      { value: 'Car Pot', archived: false },
      { value: 'Birthdays', archived: false },
      { value: 'Christmas', archived: false },
      { value: 'Vacations', archived: false },
      { value: 'Joint Account', archived: false },
      { value: 'Ether', archived: false },
      { value: 'Clothes', archived: false },
      { value: 'Clothes Pot', archived: false },
      { value: 'Home', archived: false },
      { value: 'House', archived: false },
      { value: 'Houses Pot', archived: false },
      { value: "Jake's CC", archived: false },
      { value: 'Joint Monzo', archived: false },
      { value: 'Caravan Pot', archived: false },
      { value: 'Cash', archived: false },
      { value: "Jake's Birthday", archived: false },
      { value: 'JeevieXmas', archived: false },
      { value: 'Personal Account', archived: false },
      { value: 'Vacation', archived: false },
      { value: 'The Ether', archived: false },
      { value: 'FirstPort', archived: false },
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