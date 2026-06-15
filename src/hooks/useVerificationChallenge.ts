import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/firebase";
import { VerificationChallenge } from "@/types/verification";

export async function getRandomChallenge(): Promise<VerificationChallenge | null> {
  const snap = await getDocs(query(collection(db, "verification_challenges"), where("is_active", "==", true)));
  if (snap.empty) return null;

  const pick = snap.docs[Math.floor(Math.random() * snap.docs.length)];
  return { id: pick.id, ...pick.data() } as VerificationChallenge;
}
