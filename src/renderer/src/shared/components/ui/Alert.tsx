import { DetailedHTMLProps, HTMLAttributes, ReactNode } from "react";
import { twMerge } from "tailwind-merge";

const styles = {
  variant: {
    default: "bg-gray-200",
    danger: "bg-red-200",
    warning: "bg-yellow-200",
    success: "bg-green-200",
    info: "bg-blue-200",
  },
  size: {
    xs: "py-1 px-2 tx-xs",
    default: "py-2 px-3 tx-sm",
  },
};

type Styles = typeof styles;

export type AlertProps = {
  variant?: keyof Styles["variant"];
  size?: keyof Styles["size"];
  children: ReactNode;
} & DetailedHTMLProps<HTMLAttributes<HTMLDivElement>, HTMLDivElement>;

export default function Alert({
  variant = "default",
  size = "default",
  children,
  ...props
}: AlertProps): React.ReactElement {
  return (
    <div
      {...props}
      className={twMerge(
        `rounded-md ${styles.variant[variant]} ${styles.size[size]}`,
        props.className,
      )}
    >
      {children}
    </div>
  );
}
