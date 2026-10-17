import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebase';

export type VerificationChallenge = {
  id: string;
  image_url: string;
  instruction: string;
};

/**
 * Picks a random active challenge. Pass `excludeId` when the user asks for a
 * different pose (recaptcha-style refresh) so the reroll never hands back the
 * pose they're already looking at — unless it's the only one in the pool.
 */
export async function getRandomChallenge(excludeId?: string): Promise<VerificationChallenge | null> {
  const snapshot = await getDocs(
    query(collection(db, 'Challenges'), where('active', '==', true))
  );
  if (snapshot.empty) return null;
  let docs = snapshot.docs;
  if (excludeId && docs.length > 1) {
    docs = docs.filter((d) => d.id !== excludeId);
  }
  const pick = docs[Math.floor(Math.random() * docs.length)];
  return { id: pick.id, ...(pick.data() as Omit<VerificationChallenge, 'id'>) };
}
