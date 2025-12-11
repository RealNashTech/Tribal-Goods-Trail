// Placeholder auth helpers. Integrate with Firebase Auth or your chosen provider.
export type UserProfile = {
  uid: string;
  email?: string;
  role?: 'user' | 'admin';
  favorites?: string[];
};

export async function getCurrentUser(): Promise<UserProfile | null> {
  return null;
}

export async function signInAnonymously() {
  return null;
}

export async function requireAuth(): Promise<UserProfile> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}
