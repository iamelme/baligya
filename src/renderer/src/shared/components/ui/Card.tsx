import { ReactNode } from "react";
import { twMerge } from "tailwind-merge";

type CardType = {
  className?: string;
  header?: ReactNode;
  content: ReactNode;
  footer?: ReactNode;
};

export default function Card({
  className,
  header,
  content,
  footer,
}: CardType): ReactNode {
  return (
    <div
      className={twMerge(
        `bg-white border border-slate-200 rounded-md`,
        className,
      )}
    >
      {header && <header className="py-2 px-3">{header}</header>}
      <div className="py-2 px-3">{content}</div>
      {footer && <footer className="py-2 px-3">{footer}</footer>}
    </div>
  );
}
