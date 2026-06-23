import { Timestamp } from "firebase/firestore";
export const getYearFromFirebaseDate = (
    firebaseDate: Timestamp | Date | string | undefined | null
): number => {
    if (!firebaseDate) return 0;

    let date: Date;

    if (firebaseDate instanceof Timestamp) {
        // Convert Firestore Timestamp to JS Date
        date = firebaseDate.toDate();
    } else if (firebaseDate instanceof Date) {
        date = firebaseDate;
    } else if (typeof firebaseDate === "string") {
        // Handle ISO string format
        date = new Date(firebaseDate);
    } else {
        return 0;
    }

    return date.getFullYear();
};

