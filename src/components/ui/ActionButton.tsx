import React from "react";

type Variant = "primary" | "secondary" | "ghost";

interface ActionButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    loading?: boolean;
    loadingText?: string;
    iconRight?: React.ReactNode;
    /** Shown as a tooltip while disabled, so the user can tell why it's inactive. */
    disabledReason?: string;
}

const VARIANTS: Record<Variant, string> = {
    primary: "bg-[#485FE6] text-white shadow-[0_4px_14px_rgba(72,95,230,0.35)] hover:bg-[#3b50d0] hover:shadow-[0_6px_18px_rgba(72,95,230,0.45)] hover:-translate-y-[1px]",
    secondary: "bg-[#EEF0FD] text-[#485FE6] hover:bg-[#E0E4FB]",
    ghost: "bg-transparent text-[#485FE6] hover:bg-[#EEF0FD]",
};

const Spinner = () => (
    <svg className="animate-spin w-[1.6rem] h-[1.6rem]" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
        <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
);

const ActionButton: React.FC<ActionButtonProps> = ({
    variant = "primary", loading, loadingText, iconRight, disabledReason, disabled, className = "", children, type = "button", ...props
}) => {
    const isDisabled = loading || disabled;
    return (
        <button
            type={type}
            disabled={isDisabled}
            aria-busy={loading || undefined}
            title={disabled && !loading ? disabledReason : undefined}
            className={`inline-flex items-center justify-center gap-[0.8rem] min-w-[16rem] px-[2.4rem] py-[1.2rem] rounded-full text-[1.4rem] font-semibold transition-all duration-200 active:translate-y-0 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:translate-y-0 ${VARIANTS[variant]} ${className}`}
            {...props}
        >
            {loading ? <><Spinner />{loadingText ?? children}</> : <>{children}{iconRight}</>}
        </button>
    );
};

export default ActionButton;
