import { Link } from 'react-router-dom'

import { routes } from '@/shared/config/routes'

const lessons = [
  {
    title: 'Линейная функция',
    description:
      'Теория, задания и интерактивные тренажеры по формуле y = kx + b.',
    href: routes.linearFunctionLesson,
  },
] as const

export function HomePage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-10 md:py-16">
      <section
        className="grid max-w-3xl gap-6 py-8 md:py-16"
        aria-labelledby="home-title"
      >
        <p className="w-fit rounded-full bg-blue-100 px-3 py-2 text-sm font-bold tracking-[0.08em] text-blue-700 uppercase">
          Уроки математики
        </p>
        <h1
          id="home-title"
          className="text-[clamp(2.5rem,8vw,5rem)] leading-[0.95] font-bold tracking-[-0.06em] text-slate-950"
        >
          Интерактивные материалы и задания.
        </h1>
        <p className="max-w-2xl text-lg text-slate-600">
          Выбирай урок, разбирай теорию по блокам и сразу проверяй себя в
          коротких упражнениях.
        </p>
      </section>

      <section
        className="grid grid-cols-1 gap-4 md:grid-cols-2"
        aria-label="Доступные уроки"
      >
        {lessons.map((lesson) => (
          <Link
            key={lesson.title}
            className="group grid gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-[0_18px_50px_rgb(15_23_42_/_8%)] transition hover:-translate-y-1 hover:border-blue-300 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-blue-100"
            to={lesson.href}
          >
            <span className="text-sm font-bold tracking-[0.08em] text-blue-700 uppercase">
              Урок
            </span>
            <h2 className="text-2xl font-bold text-slate-950 group-hover:text-blue-700">
              {lesson.title}
            </h2>
            <p className="text-slate-600">{lesson.description}</p>
          </Link>
        ))}
      </section>
    </main>
  )
}
