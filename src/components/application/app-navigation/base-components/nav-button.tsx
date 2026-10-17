import type { FC, MouseEventHandler, ReactNode } from "react";
import { Pressable } from "react-aria-components";
import { NavLink } from "react-router";
import { Tooltip } from "@/components/base/tooltip/tooltip";
import { cx } from "@/utils/cx";

interface NavButtonProps {
  /** Whether the collapsible nav item is open. */
  open?: boolean;
  /** URL to navigate to when the button is clicked. */
  href?: string;
  /** Label text for the button. */
  label?: string;
  /** Icon component to display. */
  icon?: FC<{ className?: string }>;
  /** Whether the button is currently active. */
  current?: boolean;
  /** Handler for click events. */
  onClick?: MouseEventHandler;
  /** Additional CSS classes to apply to the button. */
  className?: string;
  /** Placement of the tooltip. */
  tooltipPlacement?: "top" | "right" | "bottom" | "left";
  /** Content to display. */
  children?: ReactNode;
}

export const NavButton = ({
  current,
  label,
  href,
  icon: Icon,
  className,
  tooltipPlacement = "right",
  onClick,
  children,
}: NavButtonProps) => {
  const iconOnly = !children;

  return (
    <Tooltip isDisabled={!label} title={label} placement={tooltipPlacement}>
      <Pressable>
        <NavLink
          to={href ?? "#"}
          end={href === "/"}
          aria-label={label}
          onClick={onClick}
          className={({ isActive }) =>
            cx(
              "group/item relative flex w-full cursor-pointer items-center justify-center gap-1 rounded-md bg-primary outline-focus-ring transition duration-100 ease-linear select-none hover:bg-quaternary/80 focus-visible:z-10 focus-visible:outline-2 focus-visible:outline-offset-2",
              (isActive || current) && "bg-quaternary hover:bg-quaternary/80",
              iconOnly ? "size-9" : "px-2 py-1.5",
              className,
            )
          }
        >
          {({ isActive }) => (
            <>
              {Icon && (
                <Icon
                  aria-hidden="true"
                  className={cx(
                    "size-5 shrink-0 text-fg-quaternary transition-inherit-all group-hover/item:text-fg-quaternary_hover",
                    (isActive || current) && "text-fg-quaternary_hover",
                  )}
                />
              )}

              {children && (
                <span
                  className={cx(
                    "px-0.5 text-sm font-semibold transition duration-100 ease-linear group-hover/item:text-quaternary_hover",
                    (isActive || current) && "text-quaternary_hover",
                  )}
                >
                  {children}
                </span>
              )}
            </>
          )}
        </NavLink>
      </Pressable>
    </Tooltip>
  );
};
