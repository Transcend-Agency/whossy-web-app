import { Link } from "react-router-dom";

/** Shown for any address the app does not have a page for. */
const NotFound = () => (
	<main className="flex h-screen w-full flex-col items-center justify-center gap-6 px-8 text-center">
		<h1 className="text-[3.2rem] font-bold">Page not found</h1>
		<p className="max-w-[40rem] text-[1.6rem] text-[#8A8A8E]">
			The page you are looking for does not exist or has moved.
		</p>
		<Link to="/" className="rounded-[0.8rem] bg-[#F2243E] px-[2.4rem] py-[1.2rem] text-[1.6rem] font-medium text-white">
			Back to Whossy
		</Link>
	</main>
);

export default NotFound;
