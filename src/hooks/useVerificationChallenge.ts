import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebase';

export type VerificationChallenge = {
  id: string;
  image_url: string;
  instruction: string;
};

export async function getRandomChallenge(): Promise<VerificationChallenge | null> {
  const snapshot = await getDocs(
    query(collection(db, 'Challenges'), where('active', '==', true))
  );
  if (snapshot.empty) return null;
  const docs = snapshot.docs;
  const pick = docs[Math.floor(Math.random() * docs.length)];
  return { id: pick.id, ...(pick.data() as Omit<VerificationChallenge, 'id'>) };
}
