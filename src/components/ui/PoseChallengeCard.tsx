import { FC, useState } from 'react';
import { IoMdRefresh } from 'react-icons/io';
import { getRandomChallenge, VerificationChallenge } from '@/hooks/useVerificationChallenge';

interface PoseChallengeCardProps {
    challenge: VerificationChallenge;
    onChallengeChange: (challenge: VerificationChallenge) => void;
}

/**
 * The reference pose shown before capturing a verification selfie, with a
 * recaptcha-style refresh so the user can swap to a different pose without
 * closing and reopening the flow.
 */
export const PoseChallengeCard: FC<PoseChallengeCardProps> = ({ challenge, onChallengeChange }) => {
    const [refreshing, setRefreshing] = useState(false);

    const refreshPose = async () => {
        if (refreshing) return;
        setRefreshing(true);
        try {
            const next = await getRandomChallenge(challenge.id);
            if (next) onChallengeChange(next);
        } catch (e) {
            console.error('Failed to load a new challenge:', e);
        } finally {
            setRefreshing(false);
        }
    };

    return (
        <div className="flex items-center gap-4 p-4 bg-red-50 rounded-2xl border border-red-100">
            <img
                src={challenge.image_url}
                alt={challenge.instruction}
                className={`w-[80px] h-[80px] rounded-xl object-cover flex-shrink-0 transition-opacity duration-200 ${refreshing ? 'opacity-40' : 'opacity-100'}`}
            />
            <div className="flex-1">
                <p className="text-[11px] text-red-400 font-bold uppercase tracking-widest mb-1">Match this pose</p>
                <p className="text-[17px] font-bold text-gray-900 leading-tight">{challenge.instruction}</p>
            </div>
            <button
                type="button"
                onClick={refreshPose}
                disabled={refreshing}
                aria-label="Try a different pose"
                title="Try a different pose"
                className="p-2 rounded-full text-red-400 hover:text-red-500 hover:bg-red-100 active:scale-90 transition-all duration-200 cursor-pointer shrink-0 disabled:opacity-50"
            >
                <IoMdRefresh className={`size-[22px] ${refreshing ? 'animate-spin' : ''}`} />
            </button>
        </div>
    );
};
