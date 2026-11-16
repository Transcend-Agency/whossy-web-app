import { PLAY_STORE_URL } from "@/constants/stores";

type Props = {
  /** Classes for the "Coming soon" caption, to suit the background. */
  captionClassName?: string;
  onNavigate?: () => void;
};

// The App Store and Google Play badges. Google Play opens the store listing;
// the App Store badge is dimmed and marked as coming soon until the iPhone
// app is published.
const StoreBadges = ({ captionClassName = "", onNavigate }: Props) => (
  <div className="flex flex-wrap items-start gap-[1.6rem]">
    <div
      className="flex flex-col items-center gap-[4px]"
      role="img"
      aria-label="App Store: iPhone app coming soon"
    >
      <img src="/assets/icons/AppleStore.svg" alt="" className="opacity-50" />
      <span className={`text-[12px] font-medium ${captionClassName}`}>Coming soon</span>
    </div>
    <a href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer" onClick={onNavigate}>
      <img src="/assets/icons/Play-Store.svg" alt="Get it on Google Play" />
    </a>
  </div>
);

export default StoreBadges;
