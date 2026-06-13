import type { HTMLAttributes, PropsWithChildren } from 'react'

import { classNames } from '@/shared/lib/classNames'

interface CardProps extends PropsWithChildren, HTMLAttributes<HTMLElement> {
  readonly title: string
}

export function Card({ children, className, title, ...props }: CardProps) {
  return (
    <article
      className={classNames(
        'grid gap-3 rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgb(15_23_42_/_8%)]',
        className,
      )}
      {...props}
    >
      <h2 className="text-lg leading-tight font-semibold text-slate-950">
        {title}
      </h2>
      <p className="text-slate-600">{children}</p>
    </article>
  )
}
