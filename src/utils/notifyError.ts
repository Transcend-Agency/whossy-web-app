import toast from "react-hot-toast";

/**
 * `.catch(notifyError("Couldn't save your changes"))` — logs the real error
 * and tells the user what failed, so a rejected write is never silent.
 */
export const notifyError = (message: string) => (err: unknown) => {
    console.error(message, err);
    toast.error(message);
};
