import { functions } from "@/firebase";
import { httpsCallable } from "firebase/functions";
import { useMutation } from "@tanstack/react-query";

/**
 * Replaces the old usePaystack.ts / useNomba.ts / useNombaAuth.ts, which
 * called Paystack and Nomba directly from the browser using secret keys
 * inlined into the bundle. All of that now lives in
 * functions/src/payments.ts — these hooks just call the Cloud Functions.
 */

type Purpose = "credits" | "subscription";
type Currency = "ngn" | "kes" | "usd";

interface CreateTransactionResult {
  checkoutUrl: string;
  reference: string;
}

interface VerifyTransactionResult {
  status: "success" | "completed";
  purpose: Purpose;
  credits: number | null;
}

export const useCreateTransaction = () => {
  const createTransaction = httpsCallable<
    { purpose: Purpose; currency: Currency; creditOptionIndex?: number },
    CreateTransactionResult
  >(functions, "createTransaction");

  return useMutation({
    mutationFn: async (data: { purpose: Purpose; currency: Currency; creditOptionIndex?: number }) => {
      const res = await createTransaction(data);
      return res.data;
    },
  });
};

export const useVerifyTransaction = () => {
  const verifyTransaction = httpsCallable<{ reference: string }, VerifyTransactionResult>(
    functions,
    "verifyTransaction"
  );

  return useMutation({
    mutationFn: async (reference: string) => {
      const res = await verifyTransaction({ reference });
      return res.data;
    },
  });
};

export const useCancelSubscription = () => {
  const cancelSubscription = httpsCallable<void, { status: "cancelled" }>(functions, "cancelSubscription");

  return useMutation({
    mutationFn: async () => {
      const res = await cancelSubscription();
      return res.data;
    },
  });
};
