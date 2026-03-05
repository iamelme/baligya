import { twMerge } from 'tailwind-merge'

import { DetailedHTMLProps, InputHTMLAttributes } from 'react'

type InputProps = {
  className?: string
} & DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>

export default function Input({ className, ...props }: InputProps): React.JSX.Element {
  let base = ''
  if (props.type !== 'checkbox') {
    base = 'w-full py-1 px-2 bg-white rounded-sm'
  } else {
    base = 'w-4 h-4'
  }
  return (
    <input
      {...props}
      className={twMerge(
        `${base}  border border-slate-300 ${props.disabled ? "bg-slate-50 text-slate-300" : ""} ${className}`
      )}
    />
  )
}
