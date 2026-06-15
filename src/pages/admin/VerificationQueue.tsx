import { useEffect, useState } from "react";
import { collection, doc, getDocs, onSnapshot, query, serverTimestamp, updateDoc, where } from "firebase/firestore";
import { db } from "@/firebase";
import { useAuthStore } from "@/store/UserId";
import { User } from "@/types/user";
import { VerificationChallenge } from "@/types/verification";
import toast from "react-hot-toast";

type PendingUser = User & { uid: string };

const VerificationQueue = () => {
  const { auth } = useAuthStore();
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [challengeLabels, setChallengeLabels] = useState<Record<string, string>>({});

  useEffect(() => {
    getDocs(collection(db, "verification_challenges")).then((snap) => {
      const labels: Record<string, string> = {};
      snap.docs.forEach((d) => {
        const data = d.data() as VerificationChallenge;
        labels[d.id] = data.label;
      });
      setChallengeLabels(labels);
    }).catch((err) => console.error("Error fetching challenges:", err));
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      query(collection(db, "users"), where("face_verification.status", "==", "pending_review")),
      (snap) => {
        setPendingUsers(snap.docs.map((d) => ({ uid: d.id, ...d.data() } as PendingUser)));
      },
      (err) => console.error("Error fetching pending verifications:", err)
    );

    return () => unsubscribe();
  }, []);

  const reviewUser = async (uid: string, status: 'approved' | 'rejected') => {
    if (!auth?.uid) return;

    try {
      await updateDoc(doc(db, "users", uid), {
        'face_verification.status': status,
        'face_verification.retake_photo': status === 'rejected',
        'face_verification.reviewed_by': auth.uid,
        'face_verification.reviewed_at': serverTimestamp(),
      });
      toast.success(status === 'approved' ? "User approved" : "User rejected");
    } catch (err) {
      console.error("Error reviewing user:", err);
      toast.error("Failed to update verification status");
    }
  };

  if (pendingUsers.length === 0) {
    return <p className="text-[1.4rem] text-[#8A8A8E]">No pending verifications.</p>;
  }

  return (
    <div className="grid gap-y-6">
      {pendingUsers.map((user) => {
        const challengeId = user.face_verification?.challenge_id;
        const challengeLabel = challengeId ? challengeLabels[challengeId] : undefined;

        return (
          <div key={user.uid} className="border border-[#F6F6F6] rounded-[10px] p-4 grid gap-y-4">
            <p className="text-[1.4rem] font-bold">{user.first_name} {user.last_name} <span className="text-[#8A8A8E] font-normal">({user.uid})</span></p>

            <div className="flex gap-x-6 flex-wrap">
              <div className="grid gap-y-2">
                <p className="text-[1.2rem] font-bold">User was asked to: {challengeLabel ?? "Unknown pose"}</p>
                {user.face_verification?.challenge_image_url ? (
                  <img className="w-[160px] h-[120px] object-cover rounded-[10px]" src={user.face_verification.challenge_image_url} alt="Challenge pose" />
                ) : (
                  <div className="w-[160px] h-[120px] rounded-[10px] bg-[#F6F6F6] flex items-center justify-center text-[1.2rem] text-[#8A8A8E]">No challenge</div>
                )}
              </div>

              <div className="grid gap-y-2">
                <p className="text-[1.2rem] font-bold">Submitted selfie</p>
                {user.face_verification?.photo ? (
                  <img className="w-[160px] h-[120px] object-cover rounded-[10px]" src={user.face_verification.photo} alt="Submitted selfie" />
                ) : (
                  <div className="w-[160px] h-[120px] rounded-[10px] bg-[#F6F6F6] flex items-center justify-center text-[1.2rem] text-[#8A8A8E]">No photo</div>
                )}
              </div>
            </div>

            <div className="flex gap-x-4">
              <button
                className="bg-[#F6F6F6] py-[1rem] px-[2rem] text-[1.4rem] font-bold rounded-lg hover:bg-[#ececec] transition-all duration-300 cursor-pointer"
                onClick={() => reviewUser(user.uid, 'rejected')}>
                Reject
              </button>
              <button
                className="bg-gradient-to-br from-orange-400 hover:opacity-70 to-red text-white py-[1rem] px-[2rem] text-[1.4rem] font-bold rounded-lg transition-all duration-300 cursor-pointer"
                onClick={() => reviewUser(user.uid, 'approved')}>
                Approve
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default VerificationQueue;
