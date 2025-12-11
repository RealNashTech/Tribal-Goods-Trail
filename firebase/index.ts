import { FirebaseApp, initializeApp, getApps } from 'firebase/app';

import { firebaseConfig } from './config';

let app: FirebaseApp | undefined;

export function getFirebaseApp() {
  if (app) return app;
  const existingApp = getApps()[0];
  app = existingApp ?? initializeApp(firebaseConfig);
  return app;
}

export { firebaseConfig };
