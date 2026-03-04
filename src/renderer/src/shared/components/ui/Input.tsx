import { twMerge } from 'tailwind-merge'

import { DetailedHTMLProps, InputHTMLAttributes } from 'react'

type InputProps = {
  className?: string
} & DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>

export default function Input({ className, ...props }: InputProps): React.JSX.Element {
  return (
    <input
      {...props}
      className={twMerge(
        `${base}  border border-slate-300 ${props.disabled ? "bg-slate-50 text-slate-300" : ""} ${className}`
      )}
    />
  )
}
