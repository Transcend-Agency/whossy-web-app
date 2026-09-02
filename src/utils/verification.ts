import { Timestamp } from "firebase/firestore";
import { User } from "@/types/user";
import { VerificationChallenge } from "@/hooks/useVerificationChallenge";


export type VerificationStatus = 'never_submitted' | 'awaiting_review' | 'approved' | 'rejected' | 'revoked';

// What changing the main photo does to whatever verification state is
// currently live — 'approved' has a badge to revoke, 'awaiting_review' has
// a pending submission that goes stale (see Photos.tsx for why that's
// cleared rather than left to resolve on its own). Every other status has
// nothing live to invalidate.
export type MainPhotoChangeConsequence = 'none' | 'revokes_approval' | 'cancels_pending_review';

export const deriveVerificationStatus = (fv?: User['face_verification'] | null): VerificationStatus => {
  switch (fv?.status) {
    case 'approved':
      return 'approved';
    case 'rejected':
      return 'rejected';
    case 'revoked':
      return 'revoked';
    case 'pending_review':
      return 'awaiting_review';
  }
  
  if (!fv?.photo) return 'never_submitted';
  return fv.retake_photo ? 'rejected' : 'approved';
};

export const verificationStatusLabel = (status: VerificationStatus): string => ({
  never_submitted: 'Not Complete',
  awaiting_review: 'Pending',
  approved: 'Complete',
  rejected: 'Not Complete, Declined',
  revoked: 'Not Complete, Re-verification needed',
}[status]);


export const buildFaceVerificationSubmission = (
  capturedImage: string,
  challenge: Pick<VerificationChallenge, 'id' | 'image_url'> | null,
  mainPhoto?: string | null,
): NonNullable<User['face_verification']> => ({
  retake_photo: false,
  photo: capturedImage,
  updated_at: Timestamp.now(),
  challenge_id: challenge?.id ?? null,
  challenge_image_url: challenge?.image_url ?? null,
  status: 'pending_review',
  profile_photo_snapshot: mainPhoto ?? null,
  rejection_reason: null,
});
