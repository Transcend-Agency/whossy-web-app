import { Timestamp } from "firebase/firestore";

export type VerificationChallenge = {
  id?: string;
  image_url: string;
  label: string;
  is_active: boolean;
  created_at?: Timestamp | Date | null;
};
