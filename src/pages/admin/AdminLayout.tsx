import { NavLink, Outlet } from "react-router-dom";

const AdminLayout = () => {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `px-4 py-2 rounded-md text-[1.4rem] font-medium ${isActive ? "bg-black text-white" : "text-black hover:bg-[#F6F6F6]"}`;

  return (
    <div className="min-h-screen bg-white">
      <header className="flex items-center justify-between px-8 py-4 border-b border-[#F6F6F6]">
        <h1 className="text-[2rem] font-bold">Whossy Admin</h1>
        <nav className="flex gap-x-2">
          <NavLink to="/admin/verifications" className={linkClass}>Verification Queue</NavLink>
          <NavLink to="/admin/challenges" className={linkClass}>Challenges</NavLink>
        </nav>
      </header>
      <main className="p-8">
        <Outlet />
      </main>
    </div>
  );
};

export default AdminLayout;
