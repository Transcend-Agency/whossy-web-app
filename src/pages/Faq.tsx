import ExpandableSection from "@/components/landing/ExpandableSection";
import Footer from "@/components/landing/Footer";
import Navbar from "@/components/landing/Navbar";
import { useState } from "react";

const Faq = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleSection = (index: number) => {
    setOpenIndex(openIndex === index ? null : index); // Close if the same section is clicked
  };
  return (
    <>
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow">
      <div className="relative z-10 flex flex-col pt-[12.8rem] lg:pt-[3rem]">
        <p className="text-[3.2rem] lg:text-[4.8rem] px-[2rem] lg:px-[4rem] italic">
          GOT A QUESTION?
        </p>
      </div>

      <div className="p-20 text-[1.6rem] leading-[3.2rem] lg:text-[2rem] lg:leading-[4rem]">
        <ExpandableSection
          index={0}
          isOpen={openIndex === 0}
          toggleSection={toggleSection}
          placeholder="How does the matchmaking algorithm work?"
          answer="Our matchmaking algorithm considers your preferences, location, and compatibility factors to suggest profiles that are best suited to you. We constantly refine our algorithm to ensure meaningful connections."
        />
        <ExpandableSection
          index={1}
          isOpen={openIndex === 1}
          toggleSection={toggleSection}
          placeholder="Is my personal information safe on this app?"
          answer="Yes, we prioritize your privacy. All your information is encrypted and stored securely. We also do not share your data with third parties without your consent."
        />
        <ExpandableSection
          index={2}
          isOpen={openIndex === 2}
          toggleSection={toggleSection}
          placeholder="How do I report inappropriate behavior?"
          answer="You can report any user directly from their profile or chat by selecting the 'Report' option. Our team reviews each report carefully to maintain a safe and respectful community."
        />
        <ExpandableSection
          index={3}
          isOpen={openIndex === 3}
          toggleSection={toggleSection}
          placeholder="Can I use the app for free, or are there premium features?"
          answer="Our app offers essential features for free, allowing you to match, chat, and connect. Premium features, like seeing who viewed your profile and boosting your visibility, are available through our subscription plans."
        />
      </div>
      </main>

      <Footer />
      </div>
    </>
  );
};

export default Faq;
