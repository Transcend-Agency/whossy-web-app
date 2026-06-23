import { FormEvent, useEffect, useRef, useState } from "react";
import { addDoc, collection, doc, onSnapshot, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { VerificationChallenge } from "@/types/verification";
import upload from "@/hooks/upload";
import toast from "react-hot-toast";

type ChallengeDoc = VerificationChallenge & { id: string };

const VerificationChallenges = () => {
  const [challenges, setChallenges] = useState<ChallengeDoc[]>([]);
  const [label, setLabel] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "verification_challenges"),
      (snap) => setChallenges(snap.docs.map((d) => ({ id: d.id, ...d.data() } as ChallengeDoc))),
      (err) => console.error("Error fetching challenges:", err)
    );

    return () => unsubscribe();
  }, []);

  const toggleActive = async (challengeId: string, isActive: boolean) => {
    try {
      await updateDoc(doc(db, "verification_challenges", challengeId), { is_active: !isActive });
    } catch (err) {
      console.error("Error toggling challenge:", err);
      toast.error("Failed to update challenge");
    }
  };

  const addChallenge = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const file = fileInputRef.current?.files?.[0];
    if (!file || !label.trim()) {
      toast.error("Please provide an image and a label");
      return;
    }

    setSubmitting(true);
    try {
      const image_url = await upload(file, "verification_challenges");
      await addDoc(collection(db, "verification_challenges"), {
        image_url,
        label: label.trim(),
        is_active: true,
        created_at: serverTimestamp(),
      });
      setLabel("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      toast.success("Challenge added");
    } catch (err) {
      console.error("Error adding challenge:", err);
      toast.error("Failed to add challenge");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid gap-y-8">
      <form onSubmit={addChallenge} className="grid gap-y-4 max-w-[400px]">
        <p className="text-[1.6rem] font-bold">Add a new challenge pose</p>
        <input ref={fileInputRef} type="file" accept="image/*" className="text-[1.4rem]" />
        <input
          type="text"
          placeholder="Label, e.g. Smile and look left"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="border border-[#F6F6F6] rounded-lg px-4 py-2 text-[1.4rem]"
        />
        <button
          type="submit"
          disabled={submitting}
          className="bg-gradient-to-br from-orange-400 hover:opacity-70 to-red text-white py-[1rem] px-[2rem] text-[1.4rem] font-bold rounded-lg transition-all duration-300 cursor-pointer disabled:opacity-50">
          {submitting ? "Adding..." : "Add challenge"}
        </button>
      </form>

      <div className="grid gap-y-4">
        <p className="text-[1.6rem] font-bold">Existing challenges</p>
        {challenges.length === 0 && <p className="text-[1.4rem] text-[#8A8A8E]">No challenges yet.</p>}
        <div className="grid gap-y-4">
          {challenges.map((challenge) => (
            <div key={challenge.id} className="flex items-center gap-x-4 border border-[#F6F6F6] rounded-[10px] p-4">
              <img className="w-[100px] h-[75px] object-cover rounded-[10px]" src={challenge.image_url} alt={challenge.label} />
              <p className="text-[1.4rem] font-bold flex-1">{challenge.label}</p>
              <button
                className={`py-[0.8rem] px-[1.6rem] text-[1.2rem] font-bold rounded-lg transition-all duration-300 cursor-pointer ${challenge.is_active ? "bg-[#F6F6F6] hover:bg-[#ececec]" : "bg-gradient-to-br from-orange-400 hover:opacity-70 to-red text-white"}`}
                onClick={() => toggleActive(challenge.id, challenge.is_active)}>
                {challenge.is_active ? "Deactivate" : "Activate"}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VerificationChallenges;
