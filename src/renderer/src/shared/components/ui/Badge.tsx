import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

const styles = {
  variant: {
    default: "bg-gray-200",
    danger: "bg-red-200",
    warning: "bg-yellow-200",
    info: "bg-blue-200",
    success: "bg-green-200",
  },
};

type Styles = typeof styles;

type BadgeProps = {
  variant?: keyof Styles["variant"];
  children: ReactNode;
};

export default function Badge({
  variant = "default",
  children,
}: BadgeProps): ReactNode {
  return (
    <span
      className={` ${twMerge(`inline-flex items-center py-1 px-2 text-xs rounded-xl`, styles.variant[variant])}`}
    >
      {children}
    </span>
  );
}
