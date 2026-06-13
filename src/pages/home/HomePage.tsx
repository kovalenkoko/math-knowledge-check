import { Button, Card } from '@/shared/ui'

const featureCards = [
  {
    title: 'Adaptive checks',
    description:
      'Build short knowledge checks that can evolve from simple quizzes into adaptive practice flows.',
  },
  {
    title: 'Clean architecture',
    description:
      'Keep pages, app providers, shared UI, and future features isolated from the start.',
  },
  {
    title: 'Quality baseline',
    description:
      'Ship with TypeScript, linting, formatting, and production builds already wired in.',
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
          Math Knowledge Check
        </p>
        <h1
          id="home-title"
          className="text-[clamp(2.5rem,8vw,5rem)] leading-[0.95] font-bold tracking-[-0.06em] text-slate-950"
        >
          A modern foundation for math assessment flows.
        </h1>
        <p className="max-w-2xl text-lg text-slate-600">
          Start from a small React application that is ready for routing,
          reusable UI, Tailwind components, and future feature modules.
        </p>
        <div className="flex flex-wrap gap-3" aria-label="Primary actions">
          <Button>Start building</Button>
          <Button variant="secondary">Review structure</Button>
        </div>
      </section>

      <section
        className="grid grid-cols-1 gap-4 md:grid-cols-3"
        aria-label="Application foundation"
      >
        {featureCards.map((feature) => (
          <Card key={feature.title} title={feature.title}>
            {feature.description}
          </Card>
        ))}
      </section>
    </main>
  )
}
