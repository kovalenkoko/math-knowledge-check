import type { ButtonHTMLAttributes } from 'react'

import { classNames } from '@/shared/lib/classNames'

type ButtonVariant = 'primary' | 'secondary'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: ButtonVariant
}

const buttonVariants: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary:
    'border-slate-200 bg-white text-slate-950 hover:border-blue-600 hover:text-blue-700',
}

export function Button({
  className,
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <button
      className={classNames(
        'inline-flex min-h-11 cursor-pointer items-center justify-center rounded-full border border-transparent px-5 font-bold transition duration-150 ease-out hover:-translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-blue-100',
        buttonVariants[variant],
        className,
      )}
      type="button"
      {...props}
    />
  )
}
