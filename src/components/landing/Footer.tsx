import { Link } from "react-router-dom";

const FOOTER_LINKS = [
  { to: "/faq", label: "FAQ" },
  { to: "/contact", label: "Contact Us" },
  { to: "/privacy-policy", label: "Privacy Policy" },
  { to: "/delete-account", label: "Delete Account" },
];

const Footer = () => {
  return (
    <div className="lg:flex lg:justify-center px-[2.8rem] sm:px-[4rem] bg-red w-full mt-[10rem]">
      <footer className="text-white py-[4.8rem] lg:py-[6rem] w-full grid gap-[4rem] sm:grid-cols-2 lg:grid-cols-3 lg:items-start">
        <div className="space-y-[2.4rem]">
          <Link to="/" className="inline-flex items-center" aria-label="Whossy home">
            <img src={'/assets/icons/logo.svg'} alt="" className="mr-[0.8rem]" />
            <p className="text-[1.6rem]">whossy</p>
          </Link>
          <p className="font-medium text-[1.6rem]">whossy © {new Date().getFullYear()}. All rights reserved</p>
          <div className="flex space-x-[4rem]">
            <a href="#x" aria-label="X">
              <img src={'/assets/icons/twitter.svg'} alt="" />
            </a>
            <a href="#instagram" aria-label="Instagram">
              <img src={'/assets/icons/instagram.svg'} alt="" />
            </a>
            <a href="#facebook" aria-label="Facebook">
              <img src={'/assets/icons/facebookLogo.svg'} alt="" />
            </a>
            <a href="#telegram" aria-label="Telegram">
              <img src={'/assets/icons/telegram.svg'} alt="" />
            </a>
          </div>
        </div>

        <nav aria-label="Footer" className="flex flex-col items-start space-y-[2.4rem] text-[1.6rem]">
          {FOOTER_LINKS.map(({ to, label }) => (
            <Link key={to} to={to} className="hover:underline underline-offset-4">
              {label}
            </Link>
          ))}
        </nav>

        <div className="flex flex-col space-y-[2.4rem] sm:col-span-2 lg:col-span-1">
          <h3 className="font-bold text-[1.6rem]">DOWNLOAD OUR APP</h3>
          <div className="flex flex-wrap gap-[1.6rem]">
            <a href="#app-store">
              <img src={'/assets/icons/AppleStore.svg'} alt="Download on the App Store" />
            </a>
            <a href="#play-store">
              <img src={'/assets/icons/Play-Store.svg'} alt="Get it on Google Play" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Footer;
