import { Component, ErrorInfo, ReactNode } from "react";

interface ErrorBoundaryState {
	hasError: boolean;
}

/**
 * Catches a render error anywhere below it, so one broken screen shows a
 * message and a way back instead of a blank white page.
 */
export default class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
	state: ErrorBoundaryState = { hasError: false };

	static getDerivedStateFromError(): ErrorBoundaryState {
		return { hasError: true };
	}

	componentDidCatch(error: Error, info: ErrorInfo) {
		console.error("Unhandled render error:", error, info.componentStack);
	}

	render() {
		if (!this.state.hasError) return this.props.children;

		return (
			<div role="alert" className="flex h-screen w-full flex-col items-center justify-center gap-6 px-8 text-center">
				<h1 className="text-[2.4rem] font-bold">Something went wrong</h1>
				<p className="max-w-[40rem] text-[1.6rem] text-[#8A8A8E]">
					We hit an unexpected problem. Reloading usually fixes it.
				</p>
				<button
					className="rounded-[0.8rem] bg-[#F2243E] px-[2.4rem] py-[1.2rem] text-[1.6rem] font-medium text-white"
					onClick={() => window.location.assign("/")}
				>
					Reload Whossy
				</button>
			</div>
		);
	}
}
