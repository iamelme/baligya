import { ReactNode, SelectHTMLAttributes } from "react";
import { twMerge } from "tailwind-merge";

type SelectProps = {
  options: { label: string; value: string }[];
} & SelectHTMLAttributes<HTMLSelectElement>;

export default function Select({ options, ...props }: SelectProps): ReactNode {
  console.log("props select", props.defaultValue);
  return (
    <select
      {...props}
      className={`${twMerge(`w-full py-1 px-2 bg-white rounded-sm border border-slate-300  ${props.disabled ? "bg-slate-50 text-slate-300" : ""}`, props?.className)}`}
    >
      {options?.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}{" "}
        </option>
      ))}
    </select>
  );
}
