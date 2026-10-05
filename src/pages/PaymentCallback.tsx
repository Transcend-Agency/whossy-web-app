import { useVerifyTransaction } from "@/hooks/usePayments";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Oval } from "react-loader-spinner";
import toast from "react-hot-toast";

/**
 * Both Paystack and Nomba redirect here after checkout, with `?reference=`
 * set to the value createTransaction generated. The actual crediting
 * happens server-side in verifyTransaction — this page just triggers that
 * call and reports the outcome. Reloading this page (e.g. a slow double
 * redirect) is safe: verifyTransaction is idempotent on `payments/{reference}`.
 */
const PaymentCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { mutate: verify } = useVerifyTransaction();
  const [state, setState] = useState<"verifying" | "success" | "error">("verifying");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    const reference = searchParams.get("reference");
    if (!reference) {
      setState("error");
      return;
    }

    verify(reference, {
      onSuccess: () => {
        setState("success");
        toast.success("Thanks for doing business with us!");
      },
      onError: (err) => {
        console.error(err);
        setState("error");
        toast.error("We couldn't confirm that payment. If you were charged, contact support.");
      },
    });
  }, [searchParams, verify]);

  return (
    <div className="flex flex-col items-center justify-center gap-y-6 min-h-screen text-center px-6">
      {state === "verifying" && (
        <>
          <Oval color="#F2243E" secondaryColor="#fefefe" width={40} height={40} />
          <p className="text-[1.8rem]">Confirming your payment...</p>
        </>
      )}
      {state === "success" && (
        <>
          <p className="text-[2rem] font-semibold">Payment confirmed</p>
          <button
            className="bg-red text-white py-[1.4rem] px-[2.4rem] rounded-[0.8rem] text-[1.8rem]"
            onClick={() => navigate("/dashboard/user-profile")}
          >
            Back to profile
          </button>
        </>
      )}
      {state === "error" && (
        <>
          <p className="text-[2rem] font-semibold">We couldn't confirm this payment</p>
          <p className="text-[1.6rem] text-gray">If you were charged, please contact support.</p>
          <button
            className="bg-red text-white py-[1.4rem] px-[2.4rem] rounded-[0.8rem] text-[1.8rem]"
            onClick={() => navigate("/dashboard/user-profile")}
          >
            Back to profile
          </button>
        </>
      )}
    </div>
  );
};

export default PaymentCallback;
