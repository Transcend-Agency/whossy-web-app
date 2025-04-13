import {Timestamp} from "firebase/firestore";

export interface OnboardingProps {
  advance: () => void;
  goBack?: () => void;
}

export type FaceVerification = {
  uid?: string,
  first_name?: string | null,
  last_name?: string | null,
  uploaded_photos: {
    photo1: string,
    photo2: string,
    photo3: string,
    photo4: string,
    photo5: string,
  }
  captured_photo: string | null,
  is_approved?: boolean,
  created_at?: Timestamp | Date | null;
  updated_at?: Timestamp | Date | null;
}
