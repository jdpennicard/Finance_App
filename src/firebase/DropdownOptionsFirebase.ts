import { db } from './DatabaseFirebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';

export type DropdownValue = { value: string; archived: boolean };

const getOptionsDocRef = (user: User) => doc(db, 'users', user.uid, 'dropdownOptions', 'options');

const DEFAULT_OPTIONS_OBJECT: Record<string, DropdownValue[]> = {
  'Budget Line Item': [
    { value: 'Bills', archived: false },
    { value: 'Income', archived: false },
    { value: 'Sinking Fund', archived: false },
    { value: 'Other Monthly Expenses', archived: false },
  ],
  'Type of Payment': [
    { value: 'Needs', archived: false },
    { value: 'Wants', archived: false },
    { value: 'Income', archived: false },
    { value: 'Debt', archived: false },
  ],
  'Category In Budget': [
    { value: '4 Walls', archived: false },
    { value: 'Entertainment', archived: false },
    { value: 'Living Costs', archived: false },
    { value: 'Luxuries', archived: false },
    { value: 'Health', archived: false },
    { value: 'Gifting', archived: false },
    { value: 'Recklessness', archived: false },
    { value: 'Savings/Debts', archived: false },
  ],
  'Sending Location': [
    { value: 'Joint Account', archived: false },
    { value: 'Account A', archived: false },
    { value: 'Account B', archived: false },
    { value: 'Pot A', archived: false },
  ],
};

function migrateOptionArray(arr: any[]): DropdownValue[] {
  // If already in new format, return as is
  if (arr.length > 0 && typeof arr[0] === 'object' && 'value' in arr[0]) return arr as DropdownValue[];
  // Otherwise, convert strings to objects
  return arr.map(v => ({ value: v, archived: false }));
}

export async function fetchDropdownOptions(user: User) {
  const docRef = getOptionsDocRef(user);
  const snapshot = await getDoc(docRef);
  if (!snapshot.exists()) {
    await setDoc(docRef, DEFAULT_OPTIONS_OBJECT);
    return DEFAULT_OPTIONS_OBJECT;
  }
  const data = snapshot.data();
  // Migrate any arrays of strings to arrays of objects
  const migrated: Record<string, DropdownValue[]> = {};
  for (const key in data) {
    if (Array.isArray(data[key])) {
      migrated[key] = migrateOptionArray(data[key]);
    }
  }
  return migrated;
}

export async function updateDropdownOptions(user: User, newOptions: Record<string, DropdownValue[]>) {
  const docRef = getOptionsDocRef(user);
  return setDoc(docRef, newOptions, { merge: true });
}

export async function setDropdownOption(user: User, optionName: string, values: DropdownValue[]) {
  const docRef = getOptionsDocRef(user);
  return setDoc(docRef, { [optionName]: values }, { merge: true });
} 