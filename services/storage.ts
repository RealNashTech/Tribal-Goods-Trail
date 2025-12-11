import { getFirebaseApp } from '@/firebase';

// Placeholder for file upload handling.
export async function uploadImageAsync(_uri: string) {
  getFirebaseApp();
  // TODO: Wire up Firebase Storage upload
  return 'https://placeholder.image/uploaded.png';
}
