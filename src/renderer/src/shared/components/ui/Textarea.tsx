import { DetailedHTMLProps, ReactNode, TextareaHTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

type Props = {} & DetailedHTMLProps<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  HTMLTextAreaElement
>;

export default function Textarea({ ...props }: Props): ReactNode {
  return (
    <textarea
      {...props}
      className={`${twMerge(`w-full py-1 px-2 bg-white rounded-sm border border-slate-300 resize-y min-h-24 ${props.disabled ? "bg-slate-50 text-slate-300" : ""}`, props?.className)}`}
    />
  );
}
