import { db } from './DatabaseFirebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, query } from 'firebase/firestore';
import { User } from 'firebase/auth';

export async function fetchCategories(user: User) {
  const q = query(collection(db, 'users', user.uid, 'categories'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export async function addCategory(user: User, category: any) {
  return addDoc(collection(db, 'users', user.uid, 'categories'), category);
}

export async function updateCategory(user: User, categoryId: string, data: any) {
  return updateDoc(doc(db, 'users', user.uid, 'categories', categoryId), data);
}

export async function deleteCategory(user: User, categoryId: string) {
  return deleteDoc(doc(db, 'users', user.uid, 'categories', categoryId));
} 