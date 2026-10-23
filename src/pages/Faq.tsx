import ExpandableSection from "@/components/landing/ExpandableSection";
import PublicPageLayout from "@/components/landing/PublicPageLayout";
import { useState } from "react";
import { Link } from "react-router-dom";

const Faq = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleSection = (index: number) => {
    setOpenIndex(openIndex === index ? null : index); // Close if the same section is clicked
  };
  return (
    <PublicPageLayout>
      <h1 className="text-[28px] sm:text-[3.2rem] lg:text-[4.8rem] px-[2.8rem] sm:px-[4rem] italic">
        GOT A QUESTION?
      </h1>

      <div className="px-[2.8rem] sm:px-[4rem] py-[2.4rem]">
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

      <p className="px-[2.8rem] sm:px-[4rem] text-center text-[15px] lg:text-[1.6rem] text-gray">
        Still have a question?{" "}
        <Link to="/contact" className="text-red underline underline-offset-4">
          Send us a message
        </Link>
      </p>
    </PublicPageLayout>
  );
};

export default Faq;
