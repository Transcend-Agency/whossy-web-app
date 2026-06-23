interface ProfileHeaderProps {
  title: string;
  changed?: boolean;
  goBack?: () => void;
  save?: () => void;
}

const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  title,
  save,
  changed,
  goBack,
}) => {
  return (
    <header className="profile__header">
      <div className="profile__header__name">
        <img src="/assets/icons/left-arrow-black.svg" alt="Back Arrow" />
        <h1
          onClick={() => {
            goBack ? goBack() : window.history.back();
          }}
        >
          {title}
        </h1>
      </div>
      {changed && (
        <button className="profile__header__save" onClick={save}>
          Save
        </button>
      )}
    </header>
  );
};

export default ProfileHeader;
