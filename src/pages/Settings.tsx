import ProfileHeader from "@/components/dashboard/ProfileHeader";
import Switch from "@/components/ui/Switch";

const Options = () => {
  return (
    <section
      className="bg-[#F6F6F6] mt-4 text-[1.4rem] px-[1.6rem] space-y-[1.6rem]  py-[1.2rem]"
      style={{
        borderTop: "1px solid #ECECEC",
        borderBottom: "1px solid #ECECEC",
      }}
    >
      {options.map((item, i) => (
        <div
          className="pb-[1.2rem]"
          key={i}
          style={{ borderBottom: "1px solid #D9D9D9" }}
        >
          <header className="flex items-center">
            <h1>{item.title}</h1>
            {item.isPremium && (
              <div
                className="text-white rounded-full ml-2 text-[1.2rem] py-[0.4rem] px-[0.8rem]"
                style={{
                  background: `linear-gradient(to bottom, #FF5C00, #F0174B)`,
                }}
              >
                Premium
              </div>
            )}
          </header>
          <article>
            <Switch text={item.desc} />
          </article>
        </div>
      ))}
    </section>
  );
};

const ViewMore = ({ text }: { text: string }) => {
  return (
    <div
      className="flex bg-[#F6F6F6] justify-between text-[1.4rem] my-4 px-[1.6rem] py-[1.2rem]"
      style={{ border: "1px solid #D9D9D980" }}
    >
      <p>{text}</p>
      <img src="/assets/icons/right-arrow.svg" alt="" />
    </div>
  );
};

const Settings = () => {
  return (
    <div>
      <ProfileHeader title="Settings" />
      <Options />
      {viewMore.map((item, i) => (
        <ViewMore key={i} text={item} />
      ))}
      <div
        className="flex cursor-pointer bg-[#F6F6F6] justify-center items-center gap-4 text-[1.4rem] my-4 px-[1.6rem] py-[1.2rem]"
        style={{ border: "1px solid #D9D9D980" }}
        onClick={() => console.log("Logged Out!")}
      >
        <img src="/assets/icons/logout.svg" alt="" />
        <p>Logout</p>
      </div>
      <div
        className="flex bg-[#F6F6F6] cursor-pointer text-[#F2243E] justify-center items-center gap-4 text-[1.4rem] my-4 px-[1.6rem] py-[1.4rem]"
        style={{ border: "1px solid #D9D9D980" }}
      >
        <p>Delete Account</p>
      </div>
    </div>
  );
};

export default Settings;

const options = [
  {
    title: "Incognito",
    desc: "Your profile will be hidden from public users but will be seen by people you like.",
    isPremium: true,
  },
  {
    title: "Incoming Messages",
    desc: "This will allow only verified users to message you.",
    isPremium: false,
  },
  {
    title: "Hide verification badge",
    desc: "This will hide the verification badge on your profile.",
    isPremium: false,
  },
  {
    title: "Public search",
    desc: "Other users will be able to find your profile online when they search the internet.",
    isPremium: false,
  },
  {
    title: "Read receipts",
    desc: "Matches won’t be able to see when you have read and their messages and you won’t be able to see theirs.",
    isPremium: false,
  },
  {
    title: "Online Status",
    desc: "Users won’t be able to see when you’re online.",
    isPremium: true,
  },
];

const viewMore = [
  "Blocked contacts",
  "Help & Support",
];
