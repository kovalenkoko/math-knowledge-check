import { type MouseEvent, type ReactNode, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { routes } from '@/shared/config/routes'
import { classNames } from '@/shared/lib/classNames'
import { Button } from '@/shared/ui'

type QuizOption = {
  readonly id: string
  readonly label: string
  readonly isCorrect: boolean
  readonly explanation?: string
}

type MatchingChoice = {
  readonly id: string
  readonly label: string
}

type MatchingSituation = {
  readonly id: string
  readonly text: string
  readonly correctChoiceId: string
}

type TrainerTask = {
  readonly id: string
  readonly formula: string
  readonly k: number
  readonly b: number
}

type Point = {
  readonly x: number
  readonly y: number
}

const linearExamples = [
  { formula: 'y = 3x + 5', k: '3', b: '5' },
  { formula: 'y = 2x − 3', k: '2', b: '−3' },
  { formula: 'y = −2x − 7', k: '−2', b: '−7' },
  { formula: 'y = 2x', k: '2', b: '0' },
  { formula: 'y = −3', k: '0', b: '−3' },
  { formula: 'y = (6x − 4) / 2', k: '6 / 2 = 3', b: '−4 / 2 = −2' },
  { formula: 'y = 5 − 3x', k: '−3', b: '5' },
] as const

const nonLinearQuizOptions: readonly QuizOption[] = [
  { id: 'linear-positive', label: 'y = 2x + 3', isCorrect: false },
  { id: 'linear-negative', label: 'y = −x', isCorrect: false },
  {
    id: 'power',
    label: 'y = x² − 1',
    isCorrect: true,
    explanation:
      'В формуле линейной функции x должен быть только в первой степени, а деление допустимо только на число.',
  },
  { id: 'fraction-coefficient', label: 'y = ⅓x', isCorrect: false },
  {
    id: 'division-by-x',
    label: 'y = 3 / x',
    isCorrect: true,
    explanation:
      'В формуле линейной функции x должен быть только в первой степени, а деление допустимо только на число.',
  },
] as const

const coefficientQuizzes = [
  {
    title:
      'Рассмотри функцию y = −x − 4. Чему равны угловой коэффициент k и свободный член b?',
    options: [
      { id: 'a', label: 'k = 1, b = −4', isCorrect: false },
      { id: 'b', label: 'k = −1, b = 4', isCorrect: false },
      { id: 'c', label: 'k = −1, b = −4', isCorrect: true },
      { id: 'd', label: 'k = −4, b = −1', isCorrect: false },
    ],
  },
  {
    title:
      'Рассмотри функцию y = 5 − x. Чему равны угловой коэффициент k и свободный член b?',
    options: [
      { id: 'a', label: 'k = −1, b = 5', isCorrect: true },
      { id: 'b', label: 'k = 5, b = 1', isCorrect: false },
      { id: 'c', label: 'k = 1, b = 5', isCorrect: false },
      { id: 'd', label: 'k = −1, b = −5', isCorrect: false },
    ],
  },
] as const

const sortingOptions: readonly QuizOption[] = [
  {
    id: 'minus-3x-plus-8',
    label: 'y = −3x + 8',
    isCorrect: true,
    explanation: 'Да, это y = kx + b, где k = −3, b = 8.',
  },
  {
    id: 'x-square-minus-4',
    label: 'y = x² − 4',
    isCorrect: false,
    explanation: 'Нет, степень x равна 2.',
  },
  {
    id: 'x-over-5',
    label: 'y = x / 5',
    isCorrect: true,
    explanation: 'Да, это ⅕x, где k = 0.2, b = 0.',
  },
  {
    id: 'five-over-x',
    label: 'y = 5 / x',
    isCorrect: false,
    explanation: 'Нет, делиться на x в линейной функции нельзя.',
  },
  {
    id: 'minus-9',
    label: 'y = −9',
    isCorrect: true,
    explanation: 'Да, это постоянная функция, где k = 0, b = −9.',
  },
] as const

const matchingSituations: readonly MatchingSituation[] = [
  {
    id: 'money-box',
    text: 'Ты открыл копилку, где уже лежало 500 рублей, и каждый день докладываешь туда по 50 рублей.',
    correctChoiceId: 'positive-fast',
  },
  {
    id: 'snow',
    text: 'На улице тает сугроб высотой 120 см, его высота уменьшается на 10 см каждый час.',
    correctChoiceId: 'negative',
  },
  {
    id: 'snail',
    text: 'Улитка ползет по вертикальной стене со скоростью 0.2 метра в минуту.',
    correctChoiceId: 'positive-fraction',
  },
] as const

const matchingChoices: readonly MatchingChoice[] = [
  {
    id: 'negative',
    label: 'А) k < 0: процесс убывает. Функция: y = −10x + 120',
  },
  {
    id: 'positive-fraction',
    label: 'Б) k > 0 и дробный: медленный рост. Функция: y = 0.2x',
  },
  {
    id: 'positive-fast',
    label: 'В) k > 0: процесс увеличивается. Функция: y = 50x + 500',
  },
] as const

const trueFalseStatements = [
  {
    id: 'negative-k-up',
    text: 'Если коэффициент k = −5, то линия на графике будет подниматься вверх слева направо.',
    answer: false,
  },
  {
    id: 'bigger-k-steeper',
    text: 'Чем больше значение коэффициента k, например k = 100 по сравнению с k = 2, тем круче график идет вверх.',
    answer: true,
  },
  {
    id: 'small-k-fast',
    text: 'Если k = 0.1, то процесс изменения происходит очень быстро.',
    answer: false,
  },
] as const

const bCoefficientTasks = [
  {
    id: 'a',
    equation: 'А) y = 5x + 12',
    expected: ['12', '(0;12)'],
    answer: 'b = 12, точка (0; 12)',
  },
  {
    id: 'b',
    equation: 'Б) y = −2x − 8',
    expected: ['-8', '(0;-8)'],
    answer: 'b = −8, точка (0; −8)',
  },
  {
    id: 'c',
    equation: 'В) y = 0.5x',
    expected: ['0', '(0;0)'],
    answer: 'b = 0, точка (0; 0)',
  },
  {
    id: 'd',
    equation: 'Г) y = 100 − 4x',
    expected: ['100', '(0;100)'],
    answer: 'b = 100, точка (0; 100)',
  },
] as const

const propertiesQuizOptions: readonly QuizOption[] = [
  {
    id: 'domain',
    label: 'А) Областью определения функции являются любые числа.',
    isCorrect: false,
  },
  {
    id: 'zero',
    label: 'Б) Нулем функции является точка с абсциссой x = 3.',
    isCorrect: false,
  },
  {
    id: 'positive-at-one',
    label: 'В) При x = 1 функция принимает положительное значение.',
    isCorrect: true,
    explanation:
      'Верно, это неверное утверждение: при x = 1 получаем y = 2 − 6 = −4.',
  },
  {
    id: 'y-intersection',
    label: 'Г) График этой функции пересекает ось y в точке (0; −6).',
    isCorrect: false,
  },
] as const

const trainerTasks: readonly TrainerTask[] = [
  { id: 'two-minus-three', formula: 'y = 2x − 3', k: 2, b: -3 },
  { id: 'minus-x-plus-four', formula: 'y = −x + 4', k: -1, b: 4 },
  { id: 'half-x-plus-one', formula: 'y = 0.5x + 1', k: 0.5, b: 1 },
  { id: 'minus-third-x-minus-two', formula: 'y = −⅓x − 2', k: -1 / 3, b: -2 },
] as const

const axisRange = 10
const graphSize = 440
const graphCenter = graphSize / 2
const gridStep = graphSize / (axisRange * 2)

export function LinearFunctionLessonPage() {
  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-8 md:py-12">
        <header className="grid gap-6 rounded-[2rem] bg-slate-950 p-6 text-white shadow-[0_24px_80px_rgb(15_23_42_/_20%)] md:p-10">
          <Link
            className="w-fit text-sm font-bold text-blue-200 hover:text-white focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-blue-200"
            to={routes.home}
          >
            ← Все уроки
          </Link>
          <div className="grid gap-4">
            <p className="w-fit rounded-full bg-blue-500/20 px-3 py-2 text-sm font-bold tracking-[0.08em] text-blue-100 uppercase">
              Линейная функция
            </p>
            <h1 className="max-w-4xl text-[clamp(2.4rem,7vw,5.5rem)] leading-[0.95] font-black tracking-[-0.06em]">
              Разбираем формулу y = kx + b на живых примерах.
            </h1>
            <p className="max-w-3xl text-lg text-slate-200">
              Теория разделена на короткие логические блоки, а после каждого
              важного шага есть задание или тренажер с мгновенной проверкой.
            </p>
          </div>
        </header>

        <Section title="Теория: от TikTok к формуле">
          <div className="grid gap-5 text-slate-700">
            <p>
              Представь, что у тебя на аккаунте в TikTok сейчас 50 подписчиков.
              Ты начал выкладывать крутые ролики, и каждый день на тебя
              подписываются еще по 10 человек.
            </p>
            <FormulaCard>
              <p>Через 1 день: 50 + 10 · 1 = 60</p>
              <p>Через 2 дня: 50 + 10 · 2 = 70</p>
              <p>Через x дней: 50 + 10 · x</p>
              <p className="pt-2 text-xl font-black text-blue-700">
                y = 10x + 50
              </p>
            </FormulaCard>
            <p>
              Это и есть линейная функция. Ее общая формула выглядит так:
              <InlineFormula>y = kx + b</InlineFormula>.
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <InfoCard title="x — аргумент">
                Независимая переменная, которую мы выбираем сами. В примере это
                количество дней.
              </InfoCard>
              <InfoCard title="y — функция">
                Зависимая переменная, которая получается после расчета. В
                примере это количество подписчиков.
              </InfoCard>
              <InfoCard title="k — угловой коэффициент">
                Показывает скорость изменения и наклон графика.
              </InfoCard>
              <InfoCard title="b — свободный член">
                Показывает начальное состояние процесса, точку старта.
              </InfoCard>
            </div>
          </div>
        </Section>

        <Section title="Определение и примеры">
          <div className="grid gap-5">
            <p className="text-slate-700">
              Функция вида <InlineFormula>y = kx + b</InlineFormula>, где x и y
              — переменные, а k и b — числа, называется линейной функцией. Ее
              графиком всегда является прямая линия. Для построения такой прямой
              достаточно найти всего две точки.
            </p>
            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white">
              <table className="w-full border-collapse text-left">
                <thead className="bg-slate-100 text-slate-950">
                  <tr>
                    <th className="border border-slate-200 px-4 py-3">
                      Линейные функции
                    </th>
                    <th className="border border-slate-200 px-4 py-3">k</th>
                    <th className="border border-slate-200 px-4 py-3">b</th>
                  </tr>
                </thead>
                <tbody>
                  {linearExamples.map((example) => (
                    <tr key={example.formula} className="even:bg-slate-50">
                      <td className="border border-slate-200 px-4 py-3 font-semibold text-slate-900">
                        {example.formula}
                      </td>
                      <td className="border border-slate-200 px-4 py-3">
                        {example.k}
                      </td>
                      <td className="border border-slate-200 px-4 py-3">
                        {example.b}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Section>

        <Section title="Задания: узнаем линейную функцию">
          <div className="grid gap-5 lg:grid-cols-2">
            <SingleChoiceQuiz
              title="Какая функция НЕ является линейной?"
              options={nonLinearQuizOptions}
              alertMessage="В формуле линейной функции x должен быть только в первой степени, а деление только на число! Попробуй еще раз."
            />
            {coefficientQuizzes.map((quiz) => (
              <SingleChoiceQuiz
                key={quiz.title}
                title={quiz.title}
                options={quiz.options}
              />
            ))}
          </div>
          <MultiSelectQuiz
            title="Помоги роботу отсортировать функции. Какие из них являются линейными?"
            options={sortingOptions}
          />
        </Section>

        <Section title="Теория: что показывает k">
          <div className="grid gap-4 md:grid-cols-3">
            <InfoCard title="k > 0">
              Прямая растет вверх. Процесс увеличивается: например, подписчики
              растут по формуле y = 10x + 50.
            </InfoCard>
            <InfoCard title="k < 0">
              Прямая падает вниз. Процесс убывает: например, баланс телефона
              уменьшается по формуле y = −15x + 200.
            </InfoCard>
            <InfoCard title="Дробный k">
              График пологий, изменения идут медленно: например, y = 0.5x.
            </InfoCard>
          </div>
          <MatchingExercise />
          <TrueFalseQuiz />
        </Section>

        <Section title="Теория: что показывает b">
          <div className="grid gap-5 text-slate-700">
            <p>
              Коэффициент b — это начальное состояние процесса. В примере с
              TikTok b = 50, то есть столько подписчиков было до начала отсчета
              дней.
            </p>
            <p>
              На графике b показывает точку пересечения прямой с вертикальной
              осью y. Координаты этой точки всегда равны
              <InlineFormula>(0; b)</InlineFormula>.
            </p>
            <BCoefficientExercise />
          </div>
        </Section>

        <Section title="Свойства линейной функции">
          <div className="grid gap-5 text-slate-700">
            <InfoCard title="Почему достаточно двух точек?">
              Через любые две точки на плоскости можно провести прямую, и притом
              только одну. Поэтому не нужно считать таблицу из 10 значений:
              достаточно найти две удобные точки и провести прямую.
            </InfoCard>
            <div className="grid gap-4 md:grid-cols-2">
              <InfoCard title="Область определения D(y)">
                В формулу y = kx + b можно подставить любое число x. В
                математике область определения линейной функции — все числа.
              </InfoCard>
              <InfoCard title="Множество значений E(y)">
                Если k ≠ 0, прямая достигает любых значений y. Если k = 0,
                функция постоянная, например y = 50, и E(y) = {'{50}'}.
              </InfoCard>
              <InfoCard title="Нули функции">
                Нуль функции — это точка, где y = 0. Для y = kx + b нужно решить
                уравнение kx + b = 0, то есть x = −b / k.
              </InfoCard>
              <InfoCard title="Знакопостоянство">
                Если график выше оси x, то y {'>'} 0. Если ниже оси x, то y
                {' < '}0. Нуль функции разделяет эти промежутки.
              </InfoCard>
            </div>
            <SingleChoiceQuiz
              title="Дана функция y = 2x − 6. Какое утверждение НЕ верно?"
              options={propertiesQuizOptions}
            />
          </div>
        </Section>

        <Section title="Тренажер 1: ползунки k и b">
          <SliderTrainer />
        </Section>

        <Section title="Тренажер 2: построй прямую по двум точкам">
          <GraphTrainer />
        </Section>
      </div>
    </main>
  )
}

function Section({
  children,
  title,
}: {
  readonly children: ReactNode
  readonly title: string
}) {
  return (
    <section className="grid gap-6 rounded-[2rem] border border-slate-200 bg-white p-5 shadow-[0_18px_50px_rgb(15_23_42_/_8%)] md:p-8">
      <div className="grid gap-2">
        <p className="text-sm font-black tracking-[0.12em] text-blue-700 uppercase">
          Блок
        </p>
        <h2 className="text-3xl font-black tracking-[-0.04em] text-slate-950 md:text-4xl">
          {title}
        </h2>
      </div>
      {children}
    </section>
  )
}

function FormulaCard({ children }: { readonly children: ReactNode }) {
  return (
    <div className="grid gap-2 rounded-3xl border border-blue-100 bg-blue-50 p-5 font-semibold text-slate-950">
      {children}
    </div>
  )
}

function InlineFormula({ children }: { readonly children: ReactNode }) {
  return (
    <span className="mx-1 rounded-xl bg-slate-100 px-2 py-1 font-black text-slate-950">
      {children}
    </span>
  )
}

function InfoCard({
  children,
  title,
}: {
  readonly children: ReactNode
  readonly title: string
}) {
  return (
    <article className="grid gap-2 rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <h3 className="text-lg font-black text-slate-950">{title}</h3>
      <p className="text-slate-700">{children}</p>
    </article>
  )
}

function SingleChoiceQuiz({
  alertMessage,
  options,
  title,
}: {
  readonly alertMessage?: string
  readonly options: readonly QuizOption[]
  readonly title: string
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selectedOption = options.find((option) => option.id === selectedId)

  function handleSelect(option: QuizOption) {
    setSelectedId(option.id)

    if (option.isCorrect && alertMessage) {
      window.alert(alertMessage)
    }
  }

  return (
    <article className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <h3 className="text-xl font-black text-slate-950">{title}</h3>
      <div className="grid gap-2">
        {options.map((option) => {
          const isSelected = selectedId === option.id

          return (
            <button
              key={option.id}
              className={classNames(
                'rounded-2xl border bg-white px-4 py-3 text-left font-semibold transition hover:border-blue-300 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue-100',
                isSelected &&
                  option.isCorrect &&
                  'border-emerald-300 bg-emerald-50 text-emerald-800',
                isSelected &&
                  !option.isCorrect &&
                  'border-red-300 bg-red-50 text-red-800',
                !isSelected && 'border-slate-200 text-slate-800',
              )}
              type="button"
              onClick={() => handleSelect(option)}
            >
              {option.label}
            </button>
          )
        })}
      </div>
      {selectedOption ? (
        <Feedback isCorrect={selectedOption.isCorrect}>
          {selectedOption.isCorrect
            ? (selectedOption.explanation ?? 'Верно!')
            : 'Пока неверно. Посмотри на формулу y = kx + b и попробуй еще раз.'}
        </Feedback>
      ) : null}
    </article>
  )
}

function MultiSelectQuiz({
  options,
  title,
}: {
  readonly options: readonly QuizOption[]
  readonly title: string
}) {
  const [selectedIds, setSelectedIds] = useState<readonly string[]>([])
  const selectedOptions = options.filter((option) =>
    selectedIds.includes(option.id),
  )

  function toggleOption(optionId: string) {
    setSelectedIds((currentIds) =>
      currentIds.includes(optionId)
        ? currentIds.filter((id) => id !== optionId)
        : [...currentIds, optionId],
    )
  }

  return (
    <article className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <h3 className="text-xl font-black text-slate-950">{title}</h3>
      <div className="grid gap-2 md:grid-cols-2">
        {options.map((option) => {
          const isSelected = selectedIds.includes(option.id)

          return (
            <button
              key={option.id}
              className={classNames(
                'rounded-2xl border px-4 py-3 text-left font-semibold transition hover:border-blue-300 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue-100',
                isSelected &&
                  option.isCorrect &&
                  'border-emerald-300 bg-emerald-50 text-emerald-800',
                isSelected &&
                  !option.isCorrect &&
                  'border-red-300 bg-red-50 text-red-800',
                !isSelected && 'border-slate-200 bg-white text-slate-800',
              )}
              type="button"
              onClick={() => toggleOption(option.id)}
            >
              {option.label}
            </button>
          )
        })}
      </div>
      {selectedOptions.length > 0 ? (
        <div className="grid gap-2">
          {selectedOptions.map((option) => (
            <Feedback key={option.id} isCorrect={option.isCorrect}>
              {option.explanation}
            </Feedback>
          ))}
        </div>
      ) : null}
    </article>
  )
}

function MatchingExercise() {
  const [answers, setAnswers] = useState<Record<string, string>>({})

  return (
    <article className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <h3 className="text-xl font-black text-slate-950">
        Задание: соотнеси ситуацию и коэффициент k
      </h3>
      <div className="grid gap-4">
        {matchingSituations.map((situation) => {
          const selectedId = answers[situation.id]
          const isCorrect = selectedId === situation.correctChoiceId

          return (
            <div
              key={situation.id}
              className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4"
            >
              <p className="font-semibold text-slate-900">{situation.text}</p>
              <div className="grid gap-2 md:grid-cols-3">
                {matchingChoices.map((choice) => {
                  const isSelected = selectedId === choice.id

                  return (
                    <button
                      key={choice.id}
                      className={classNames(
                        'rounded-2xl border px-3 py-3 text-left text-sm font-semibold transition hover:border-blue-300 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue-100',
                        isSelected &&
                          isCorrect &&
                          'border-emerald-300 bg-emerald-50 text-emerald-800',
                        isSelected &&
                          !isCorrect &&
                          'border-red-300 bg-red-50 text-red-800',
                        !isSelected &&
                          'border-slate-200 bg-slate-50 text-slate-700',
                      )}
                      type="button"
                      onClick={() =>
                        setAnswers((currentAnswers) => ({
                          ...currentAnswers,
                          [situation.id]: choice.id,
                        }))
                      }
                    >
                      {choice.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </article>
  )
}

function TrueFalseQuiz() {
  const [answers, setAnswers] = useState<Record<string, boolean>>({})

  return (
    <article className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <h3 className="text-xl font-black text-slate-950">
        Блиц-проверка: верно или неверно?
      </h3>
      <div className="grid gap-3">
        {trueFalseStatements.map((statement) => {
          const selectedAnswer = answers[statement.id]
          const hasAnswer = selectedAnswer !== undefined
          const isCorrect = selectedAnswer === statement.answer

          return (
            <div
              key={statement.id}
              className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_auto]"
            >
              <p className="font-semibold text-slate-900">{statement.text}</p>
              <div className="flex gap-2">
                {[true, false].map((answer) => {
                  const isSelected = selectedAnswer === answer

                  return (
                    <button
                      key={String(answer)}
                      className={classNames(
                        'rounded-full border px-4 py-2 text-sm font-black transition focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue-100',
                        isSelected &&
                          isCorrect &&
                          'border-emerald-300 bg-emerald-50 text-emerald-800',
                        isSelected &&
                          !isCorrect &&
                          'border-red-300 bg-red-50 text-red-800',
                        !isSelected &&
                          'border-slate-200 bg-slate-50 text-slate-700',
                      )}
                      type="button"
                      onClick={() =>
                        setAnswers((currentAnswers) => ({
                          ...currentAnswers,
                          [statement.id]: answer,
                        }))
                      }
                    >
                      {answer ? 'Верно' : 'Неверно'}
                    </button>
                  )
                })}
              </div>
              {hasAnswer ? (
                <div className="md:col-span-2">
                  <Feedback isCorrect={isCorrect}>
                    {isCorrect ? 'Верно!' : 'Неверно, подумай о знаке k.'}
                  </Feedback>
                </div>
              ) : null}
            </div>
          )
        })}
      </div>
    </article>
  )
}

function BCoefficientExercise() {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isChecked, setIsChecked] = useState(false)

  function normalize(value: string) {
    return value.replaceAll(' ', '').replaceAll('−', '-').toLowerCase()
  }

  function isAnswerCorrect(task: (typeof bCoefficientTasks)[number]) {
    const value = normalize(answers[task.id] ?? '')

    return task.expected.every((part) => value.includes(normalize(part)))
  }

  return (
    <article className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <h3 className="text-xl font-black text-slate-950">
        Задание: найди b и точку пересечения с осью y
      </h3>
      <p className="text-slate-700">
        Образец: y = 3x + 7, значит b = 7, точка пересечения (0; 7).
      </p>
      <div className="grid gap-3">
        {bCoefficientTasks.map((task) => {
          const isCorrect = isAnswerCorrect(task)

          return (
            <label key={task.id} className="grid gap-2">
              <span className="font-semibold text-slate-900">
                {task.equation}
              </span>
              <input
                className={classNames(
                  'rounded-2xl border bg-white px-4 py-3 text-slate-950 transition outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100',
                  isChecked && isCorrect && 'border-emerald-300 bg-emerald-50',
                  isChecked && !isCorrect && 'border-red-300 bg-red-50',
                  !isChecked && 'border-slate-200',
                )}
                placeholder="Например: b = 12, (0; 12)"
                value={answers[task.id] ?? ''}
                onChange={(event) =>
                  setAnswers((currentAnswers) => ({
                    ...currentAnswers,
                    [task.id]: event.target.value,
                  }))
                }
              />
              {isChecked ? (
                <span
                  className={classNames(
                    'text-sm font-semibold',
                    isCorrect ? 'text-emerald-700' : 'text-red-700',
                  )}
                >
                  {isCorrect ? 'Верно!' : `Проверь себя: ${task.answer}.`}
                </span>
              ) : null}
            </label>
          )
        })}
      </div>
      <Button className="w-fit" onClick={() => setIsChecked(true)}>
        Проверить
      </Button>
    </article>
  )
}

function SliderTrainer() {
  const [k, setK] = useState(1)
  const [b, setB] = useState(0)
  const explanation = useMemo(() => buildSliderExplanation(k, b), [k, b])

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,440px)]">
      <div className="grid gap-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <SliderControl label="k" value={k} onChange={setK} />
        <SliderControl label="b" value={b} onChange={setB} />
        <FormulaCard>
          <p className="text-xl font-black text-slate-950">
            {formatLinearFunction(k, b)}
          </p>
        </FormulaCard>
        <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5 text-slate-800">
          {explanation.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
      </div>
      <CoordinateGraph k={k} b={b} points={[]} />
    </div>
  )
}

function SliderControl({
  label,
  onChange,
  value,
}: {
  readonly label: string
  readonly onChange: (value: number) => void
  readonly value: number
}) {
  return (
    <label className="grid gap-2">
      <span className="flex items-center justify-between font-black text-slate-950">
        <span>{label}</span>
        <span className="rounded-full bg-white px-3 py-1 text-blue-700">
          {value}
        </span>
      </span>
      <input
        className="accent-blue-600"
        max={10}
        min={-10}
        step={0.5}
        type="range"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  )
}

function GraphTrainer() {
  const [taskIndex, setTaskIndex] = useState(0)
  const [points, setPoints] = useState<readonly Point[]>([])
  const [result, setResult] = useState<'correct' | 'wrong' | null>(null)
  const task = trainerTasks[taskIndex]

  function handlePoint(point: Point) {
    setResult(null)
    setPoints((currentPoints) => {
      const nextPoints = currentPoints.some(
        (currentPoint) =>
          currentPoint.x === point.x && currentPoint.y === point.y,
      )
        ? currentPoints.filter(
            (currentPoint) =>
              currentPoint.x !== point.x || currentPoint.y !== point.y,
          )
        : [...currentPoints, point]

      return nextPoints.slice(-2)
    })
  }

  function checkAnswer() {
    if (points.length !== 2 || points[0].x === points[1].x) {
      setResult('wrong')
      return
    }

    const isCorrect = points.every(
      (point) => Math.abs(point.y - (task.k * point.x + task.b)) < 0.0001,
    )

    setResult(isCorrect ? 'correct' : 'wrong')
  }

  function nextTask() {
    setTaskIndex((currentIndex) => (currentIndex + 1) % trainerTasks.length)
    setPoints([])
    setResult(null)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,440px)]">
      <div className="grid gap-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <p className="text-lg font-black text-slate-950">
          Построй график функции: {task.formula}
        </p>
        <p className="text-slate-700">
          Кликни по сетке и поставь две точки с целыми координатами. Затем нажми
          «Проверить».
        </p>
        <div className="rounded-2xl bg-white p-4 font-semibold text-slate-800">
          Выбранные точки:{' '}
          {points.length > 0
            ? points.map((point) => `(${point.x}; ${point.y})`).join(', ')
            : 'пока нет'}
        </div>
        <div className="flex flex-wrap gap-3">
          <Button onClick={checkAnswer}>Проверить</Button>
          <Button
            variant="secondary"
            onClick={() => {
              setPoints([])
              setResult(null)
            }}
          >
            Сбросить точки
          </Button>
          <Button variant="secondary" onClick={nextTask}>
            Следующая функция
          </Button>
        </div>
        {result ? (
          <Feedback isCorrect={result === 'correct'}>
            {result === 'correct'
              ? 'Верно! Обе точки лежат на этой прямой.'
              : 'Неверно. Подставь x каждой точки в формулу и проверь y.'}
          </Feedback>
        ) : null}
      </div>
      <ClickableCoordinateGraph
        k={result === 'correct' ? task.k : undefined}
        b={result === 'correct' ? task.b : undefined}
        points={points}
        onPointClick={handlePoint}
      />
    </div>
  )
}

function CoordinateGraph({
  b,
  k,
  points,
}: {
  readonly b: number
  readonly k: number
  readonly points: readonly Point[]
}) {
  const start = mapPoint({ x: -axisRange, y: k * -axisRange + b })
  const end = mapPoint({ x: axisRange, y: k * axisRange + b })

  return (
    <GraphShell>
      <GraphGrid />
      <line
        className="stroke-blue-600"
        strokeLinecap="round"
        strokeWidth={4}
        x1={start.x}
        x2={end.x}
        y1={start.y}
        y2={end.y}
      />
      <GraphPoints points={points} />
    </GraphShell>
  )
}

function ClickableCoordinateGraph({
  b,
  k,
  onPointClick,
  points,
}: {
  readonly b?: number
  readonly k?: number
  readonly onPointClick: (point: Point) => void
  readonly points: readonly Point[]
}) {
  function handleClick(event: MouseEvent<SVGSVGElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    const xInSvg = ((event.clientX - rect.left) / rect.width) * graphSize
    const yInSvg = ((event.clientY - rect.top) / rect.height) * graphSize
    const point = {
      x: clamp(
        Math.round((xInSvg - graphCenter) / gridStep),
        -axisRange,
        axisRange,
      ),
      y: clamp(
        Math.round((graphCenter - yInSvg) / gridStep),
        -axisRange,
        axisRange,
      ),
    }

    onPointClick(point)
  }

  const line =
    k === undefined || b === undefined
      ? null
      : {
          start: mapPoint({ x: -axisRange, y: k * -axisRange + b }),
          end: mapPoint({ x: axisRange, y: k * axisRange + b }),
        }

  return (
    <GraphShell onClick={handleClick}>
      <GraphGrid />
      {line ? (
        <line
          className="stroke-emerald-600"
          strokeLinecap="round"
          strokeWidth={4}
          x1={line.start.x}
          x2={line.end.x}
          y1={line.start.y}
          y2={line.end.y}
        />
      ) : null}
      <GraphPoints points={points} />
    </GraphShell>
  )
}

function GraphShell({
  children,
  onClick,
}: {
  readonly children: ReactNode
  readonly onClick?: (event: MouseEvent<SVGSVGElement>) => void
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-3">
      <svg
        aria-label="Координатная плоскость"
        className={classNames(
          'aspect-square w-full rounded-2xl bg-white',
          onClick && 'cursor-crosshair',
        )}
        role="img"
        viewBox={`0 0 ${graphSize} ${graphSize}`}
        onClick={onClick}
      >
        {children}
      </svg>
    </div>
  )
}

function GraphGrid() {
  const coordinates = Array.from(
    { length: axisRange * 2 + 1 },
    (_, index) => index - axisRange,
  )

  return (
    <>
      {coordinates.map((coordinate) => {
        const position = graphCenter + coordinate * gridStep

        return (
          <g key={coordinate}>
            <line
              className="stroke-slate-100"
              x1={position}
              x2={position}
              y1={0}
              y2={graphSize}
            />
            <line
              className="stroke-slate-100"
              x1={0}
              x2={graphSize}
              y1={position}
              y2={position}
            />
          </g>
        )
      })}
      <line
        className="stroke-slate-400"
        strokeWidth={2}
        x1={0}
        x2={graphSize}
        y1={graphCenter}
        y2={graphCenter}
      />
      <line
        className="stroke-slate-400"
        strokeWidth={2}
        x1={graphCenter}
        x2={graphCenter}
        y1={0}
        y2={graphSize}
      />
      {coordinates
        .filter((coordinate) => coordinate !== 0 && coordinate % 2 === 0)
        .map((coordinate) => {
          const xPosition = graphCenter + coordinate * gridStep
          const yPosition = graphCenter - coordinate * gridStep

          return (
            <g
              key={`label-${coordinate}`}
              className="fill-slate-400 text-[10px]"
            >
              <text textAnchor="middle" x={xPosition} y={graphCenter + 14}>
                {coordinate}
              </text>
              <text textAnchor="end" x={graphCenter - 6} y={yPosition + 4}>
                {coordinate}
              </text>
            </g>
          )
        })}
      <text
        className="fill-slate-500 text-xs font-bold"
        x={graphSize - 14}
        y={graphCenter - 8}
      >
        x
      </text>
      <text
        className="fill-slate-500 text-xs font-bold"
        x={graphCenter + 8}
        y={14}
      >
        y
      </text>
    </>
  )
}

function GraphPoints({ points }: { readonly points: readonly Point[] }) {
  return (
    <>
      {points.map((point) => {
        const mappedPoint = mapPoint(point)

        return (
          <g key={`${point.x}-${point.y}`}>
            <circle
              className="fill-orange-500 stroke-white"
              cx={mappedPoint.x}
              cy={mappedPoint.y}
              r={7}
              strokeWidth={3}
            />
            <text
              className="fill-orange-700 text-xs font-black"
              x={mappedPoint.x + 9}
              y={mappedPoint.y - 9}
            >
              ({point.x}; {point.y})
            </text>
          </g>
        )
      })}
    </>
  )
}

function Feedback({
  children,
  isCorrect,
}: {
  readonly children: ReactNode
  readonly isCorrect: boolean
}) {
  return (
    <p
      className={classNames(
        'rounded-2xl border px-4 py-3 font-semibold',
        isCorrect
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
          : 'border-red-200 bg-red-50 text-red-800',
      )}
    >
      {children}
    </p>
  )
}

function buildSliderExplanation(k: number, b: number) {
  const direction =
    k > 0
      ? 'Прямая растет (идет снизу вверх). Процесс увеличивается.'
      : k < 0
        ? 'Прямая убывает (идет сверху вниз). Процесс уменьшается.'
        : 'Прямая горизонтальна. Процесс стабилен, изменений нет.'

  const speed =
    Math.abs(k) > 2
      ? 'График очень крутой, изменения происходят быстро.'
      : Math.abs(k) > 0 && Math.abs(k) <= 1
        ? 'График пологий, изменения происходят медленно и плавно.'
        : k === 0
          ? 'Скорости изменения нет: y не зависит от x.'
          : 'График имеет умеренный наклон.'

  const start =
    b > 0
      ? `График пересекает ось y выше начала координат в точке (0; ${b}).`
      : b < 0
        ? `График пересекает ось y ниже начала координат в точке (0; ${b}).`
        : 'График проходит ровно через центр (0; 0). Это прямая пропорциональность.'

  return [direction, speed, start]
}

function formatLinearFunction(k: number, b: number) {
  const kPart =
    k === 0 ? '' : k === 1 ? 'x' : k === -1 ? '−x' : `${formatNumber(k)}x`
  const bPart =
    b === 0
      ? ''
      : `${b > 0 && k !== 0 ? ' + ' : b < 0 && k !== 0 ? ' − ' : ''}${formatNumber(Math.abs(b))}`

  return `y = ${kPart}${bPart || (k === 0 ? formatNumber(b) : '')}`
}

function formatNumber(value: number) {
  return Number.isInteger(value) ? String(value) : String(value)
}

function mapPoint(point: Point) {
  return {
    x: graphCenter + point.x * gridStep,
    y: graphCenter - point.y * gridStep,
  }
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}
