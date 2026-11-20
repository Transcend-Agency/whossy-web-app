import { PLAY_STORE_URL } from "@/constants/stores";

// Payments are switched off on the web until a payment provider is set up
// (createTransaction refuses them on the server too). Credits and Premium
// are bought in the Android app for now.
const WebPaymentsUnavailable = () => (
  <div
    role="status"
    className="rounded-[1.6rem] p-[2rem] text-center space-y-[1.2rem] bg-[#FFF4F5]"
    style={{ border: "1px solid #F2243E" }}
  >
    <p className="text-[1.8rem] font-semibold text-black">Payments aren't available on the web yet</p>
    <p className="text-[1.5rem] text-[#5c5c5c]">
      To buy credits or subscribe to Premium, use the Whossy app on Google Play.
      The iPhone app is coming soon.
    </p>
    <a
      href={PLAY_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex w-full justify-center rounded-[0.8rem] bg-red py-[1.4rem] text-[1.7rem] font-medium text-white"
    >
      Get the app on Google Play
    </a>
  </div>
);

export default WebPaymentsUnavailable;
