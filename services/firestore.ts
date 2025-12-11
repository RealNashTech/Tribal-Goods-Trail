import { getFirestore } from 'firebase/firestore';

import { getFirebaseApp } from '@/firebase';

export type Business = {
  id?: string;
  name: string;
  category: string;
  description: string;
  tribalAffiliation: string;
  address: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  phone?: string;
  email?: string;
  website?: string;
  hours?: string;
  imageUrl?: string;
  tags?: string[];
  featured?: boolean;
};

export type BusinessSubmission = Business & {
  status: 'pending' | 'approved' | 'rejected';
  reviewNotes?: string;
  reviewedBy?: string;
  reviewedDate?: string;
  submitterEmail?: string;
};

export function getDb() {
  const app = getFirebaseApp();
  return getFirestore(app);
}

// Placeholder CRUD functions
export async function fetchBusinesses(): Promise<Business[]> {
  // TODO: Implement Firestore query
  return [];
}

export async function submitBusiness(data: BusinessSubmission) {
  // TODO: Persist submission to Firestore
  return data;
}

export async function toggleFavorite(_: string, __: string) {
  // TODO: Write favorite toggle logic
  return true;
}
