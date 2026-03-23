import { ButtonHTMLAttributes, DetailedHTMLProps, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

const styles = {
  variants: {
    default: "bg-indigo-600 text-white",
    danger: "bg-red-500 text-white",
    outline: "border border-slate-400",
    ghost: "hover:underline",
  },
  sizes: {
    default: "py-2 px-4",
    icon: "p-2",
    sm: "py-2 px-4 text-xs",
    xs: "py-2 px-3 text-xs",
  },
};

type Styles = typeof styles;

export type ButtonProps = {
  variant?: keyof Styles["variants"];
  size?: keyof Styles["sizes"];
  full?: boolean;
  children: ReactNode;
} & DetailedHTMLProps<
  ButtonHTMLAttributes<HTMLButtonElement>,
  HTMLButtonElement
>;

export default function Button({
  variant = "default",
  size = "default",
  full = false,
  children,
  ...props
}: ButtonProps): React.JSX.Element {
  return (
    <button
      {...props}
      className={twMerge(
        `inline-flex  justify-center items-center gap-x-1 ${styles.variants[variant]} ${styles.sizes[size]} rounded-sm  cursor-pointer`,
        `${props.className} ${full ? "w-full" : ""} ${props.disabled ? "opacity-75 cursor-default" : ""}`,
      )}
    >
      {children}
    </button>
  );
}
