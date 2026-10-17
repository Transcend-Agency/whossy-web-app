import type { KeyboardEvent, MouseEvent } from "react";

/**
 * Makes a non-button element (div/figure) keyboard-operable: focusable,
 * announced as a button, and activated by Enter/Space like a real one.
 * Spread onto the element in place of a bare `onClick`.
 */
export const pressable = (onActivate: (e: MouseEvent<HTMLElement> | KeyboardEvent<HTMLElement>) => void) => ({
    role: "button" as const,
    tabIndex: 0,
    onClick: onActivate,
    onKeyDown: (e: KeyboardEvent<HTMLElement>) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onActivate(e);
        }
    },
});
