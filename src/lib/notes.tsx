// src/lib/notes.ts ← VERSI YANG BENAR & AMAN
import { db } from '../config/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  orderBy,
  Timestamp,
} from 'firebase/firestore';

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
  userId: string;
}

const NOTES_COLLECTION = 'notes';

// CREATE
export const createNote = async (userId: string, title: string, content: string): Promise<string> => {
  if (!userId) throw new Error('User ID is required');

  const docRef = await addDoc(collection(db, NOTES_COLLECTION), {
    title: title.trim(),
    content: content.trim(),
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return docRef.id;
};

// READ (real-time) ← INI YANG WAJIB DIPERBAIKI!
export const subscribeToNotes = (
  userId: string,
  callback: (notes: Note[]) => void
) => {
  if (!userId || typeof userId !== 'string') {
    console.warn('Invalid userId:', userId);
    callback([]);
    return () => {};
  }

  const q = query(
    collection(db, NOTES_COLLECTION),
    where('userId', '==', userId),  // PAKAI STRING '==', BUKAN ==
    orderBy('updatedAt', 'desc')
  );

  const unsubscribe = onSnapshot(
    q,
    (snapshot) => {
      const notes: Note[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        notes.push({
          id: doc.id,
          ...data,
          // Pastikan createdAt & updatedAt tidak undefined
          createdAt: data.createdAt ?? null,
          updatedAt: data.updatedAt ?? null,
        } as Note);
      });
      callback(notes);
    },
    (error) => {
      console.error('Error subscribing to notes:', error);
      callback([]);
    }
  );

  return unsubscribe;
};

// UPDATE & DELETE tetap sama
export const updateNote = async (id: string, title: string, content: string) => {
  const noteRef = doc(db, NOTES_COLLECTION, id);
  await updateDoc(noteRef, {
    title: title.trim(),
    content: content.trim(),
    updatedAt: serverTimestamp(),
  });
};

export const deleteNote = async (id: string) => {
  const noteRef = doc(db, NOTES_COLLECTION, id);
  await deleteDoc(noteRef);
};