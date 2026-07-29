import {
  type DragEvent,
  type MouseEvent,
  type ReactNode,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Link } from 'react-router-dom'

import { routes } from '@/shared/config/routes'
import { classNames } from '@/shared/lib/classNames'
import { Button } from '@/shared/ui'

type QuizOption = {
  readonly id: string
  readonly label: ReactNode
  readonly isCorrect: boolean
  readonly explanation?: string
}

type MatchingChoice = {
  readonly id: string
  readonly label: ReactNode
}

type MatchingSituation = {
  readonly id: string
  readonly text: ReactNode
  readonly correctChoiceId: string
}

type TrainerTask = {
  readonly id: string
  readonly formula: ReactNode
  readonly k: number
  readonly b: number
}

type CatchPoint = Point & {
  readonly id: string
  readonly label: string
  readonly isCorrect: boolean
}

type PointCatchTask = TrainerTask & {
  readonly points: readonly CatchPoint[]
}

type ParallelLinesTask = {
  readonly id: string
  readonly fixedK: number
  readonly fixedB: number
  readonly targetPoint: Point
  readonly initialK: number
  readonly initialB: number
}

type Point = {
  readonly x: number
  readonly y: number
}

type SortingColumn = 'linear' | 'other'
type SortingLocation = SortingColumn | 'pool'

const linearExamples = [
  { id: '3x-plus-5', formula: 'y = 3x + 5', k: '3', b: '5' },
  { id: '2x-minus-3', formula: 'y = 2x − 3', k: '2', b: '−3' },
  { id: 'minus-2x-minus-7', formula: 'y = −2x − 7', k: '−2', b: '−7' },
  { id: '2x', formula: 'y = 2x', k: '2', b: '0' },
  { id: 'minus-3', formula: 'y = −3', k: '0', b: '−3' },
  {
    id: 'fraction-expression',
    formula: (
      <>
        y = <Fraction numerator="6x − 4" denominator="2" />
      </>
    ),
    k: (
      <>
        <Fraction numerator="6" denominator="2" /> = 3
      </>
    ),
    b: (
      <>
        <Fraction numerator="−4" denominator="2" /> = −2
      </>
    ),
  },
  { id: '5-minus-3x', formula: 'y = 5 − 3x', k: '−3', b: '5' },
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
  {
    id: 'fraction-coefficient',
    label: (
      <>
        y = <Fraction numerator="1" denominator="3" />x
      </>
    ),
    isCorrect: false,
  },
  {
    id: 'division-by-x',
    label: (
      <>
        y = <Fraction numerator="3" denominator="x" />
      </>
    ),
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
    label: (
      <>
        y = <Fraction numerator="x" denominator="5" />
      </>
    ),
    isCorrect: true,
    explanation: 'Да, это дробный коэффициент, где k = 0.2, b = 0.',
  },
  {
    id: 'five-over-x',
    label: (
      <>
        y = <Fraction numerator="5" denominator="x" />
      </>
    ),
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
    text: (
      <>
        Улитка ползет по вертикальной стене со скоростью{' '}
        <Fraction numerator="1" denominator="5" /> метра в минуту.
      </>
    ),
    correctChoiceId: 'positive-fraction',
  },
] as const

const matchingChoices: readonly MatchingChoice[] = [
  {
    id: 'negative',
    label: (
      <ChoiceFormulaLabel
        description="k < 0: процесс убывает. Функция:"
        formula="y = −10x + 120"
      />
    ),
  },
  {
    id: 'positive-fraction',
    label: (
      <ChoiceFormulaLabel
        description="k > 0 и дробный: медленный рост. Функция:"
        formula={
          <>
            y = <Fraction numerator="1" denominator="5" />x
          </>
        }
      />
    ),
  },
  {
    id: 'positive-fast',
    label: (
      <ChoiceFormulaLabel
        description="k > 0: процесс увеличивается. Функция:"
        formula="y = 50x + 500"
      />
    ),
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
    equation: (
      <>
        В) y = <Fraction numerator="1" denominator="2" />x
      </>
    ),
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

const signConstancyTasks = [
  {
    id: 'positive-2x-10',
    prompt: (
      <>
        Найдите, при каких значениях x функция{' '}
        <span className="whitespace-nowrap">y = 2x − 10</span> принимает
        положительные значения.
      </>
    ),
    expected: ['x>5'],
    answer: 'x > 5',
  },
  {
    id: 'negative-3x-12',
    prompt: (
      <>
        Найдите, при каких значениях x функция{' '}
        <span className="whitespace-nowrap">y = 3x + 12</span> принимает
        отрицательные значения.
      </>
    ),
    expected: ['x<-4'],
    answer: 'x < −4',
  },
  {
    id: 'non-positive-5x-15',
    prompt: (
      <>
        Найдите, при каких значениях x функция{' '}
        <span className="whitespace-nowrap">y = 5x − 15</span> принимает
        неположительные значения.
      </>
    ),
    expected: ['x<=3', 'x≤3'],
    answer: 'x ≤ 3',
  },
  {
    id: 'non-negative-8-2x',
    prompt: (
      <>
        Найдите, при каких значениях x функция{' '}
        <span className="whitespace-nowrap">y = 8 − 2x</span> принимает
        неотрицательные значения.
      </>
    ),
    expected: ['x<=4', 'x≤4'],
    answer: 'x ≤ 4',
  },
] as const

const inequalitySymbols = ['<', '>', '≤', '≥'] as const

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
  {
    id: 'half-x-plus-one',
    formula: (
      <>
        y = <Fraction numerator="1" denominator="2" />x + 1
      </>
    ),
    k: 0.5,
    b: 1,
  },
  {
    id: 'minus-third-x-minus-two',
    formula: (
      <>
        y = −<Fraction numerator="1" denominator="3" />x − 2
      </>
    ),
    k: -1 / 3,
    b: -2,
  },
] as const

const pointCatchTasks: readonly PointCatchTask[] = [
  {
    id: 'catch-two-minus-three',
    formula: 'y = 2x − 3',
    k: 2,
    b: -3,
    points: [
      { id: 'a', label: 'A', x: 0, y: -3, isCorrect: true },
      { id: 'b', label: 'B', x: 2, y: 1, isCorrect: true },
      { id: 'c', label: 'C', x: -1, y: -5, isCorrect: true },
      { id: 'd', label: 'D', x: 3, y: 5, isCorrect: false },
      { id: 'e', label: 'E', x: 1, y: 0, isCorrect: false },
    ],
  },
  {
    id: 'catch-minus-x-plus-five',
    formula: 'y = −x + 5',
    k: -1,
    b: 5,
    points: [
      { id: 'a', label: 'A', x: 1, y: 4, isCorrect: true },
      { id: 'b', label: 'B', x: 5, y: 0, isCorrect: true },
      { id: 'c', label: 'C', x: -2, y: 7, isCorrect: true },
      { id: 'd', label: 'D', x: 0, y: 3, isCorrect: false },
      { id: 'e', label: 'E', x: 3, y: 1, isCorrect: false },
    ],
  },
  {
    id: 'catch-three-x-plus-one',
    formula: 'y = 3x + 1',
    k: 3,
    b: 1,
    points: [
      { id: 'a', label: 'A', x: 0, y: 1, isCorrect: true },
      { id: 'b', label: 'B', x: 1, y: 4, isCorrect: true },
      { id: 'c', label: 'C', x: -1, y: -2, isCorrect: true },
      { id: 'd', label: 'D', x: 2, y: 6, isCorrect: false },
      { id: 'e', label: 'E', x: -2, y: -4, isCorrect: false },
    ],
  },
  {
    id: 'catch-minus-two-x-plus-four',
    formula: 'y = −2x + 4',
    k: -2,
    b: 4,
    points: [
      { id: 'a', label: 'A', x: 0, y: 4, isCorrect: true },
      { id: 'b', label: 'B', x: 2, y: 0, isCorrect: true },
      { id: 'c', label: 'C', x: 3, y: -2, isCorrect: true },
      { id: 'd', label: 'D', x: 1, y: 3, isCorrect: false },
      { id: 'e', label: 'E', x: -1, y: 5, isCorrect: false },
    ],
  },
  {
    id: 'catch-x-minus-four',
    formula: 'y = x − 4',
    k: 1,
    b: -4,
    points: [
      { id: 'a', label: 'A', x: 4, y: 0, isCorrect: true },
      { id: 'b', label: 'B', x: 0, y: -4, isCorrect: true },
      { id: 'c', label: 'C', x: 5, y: 1, isCorrect: true },
      { id: 'd', label: 'D', x: 2, y: 2, isCorrect: false },
      { id: 'e', label: 'E', x: -1, y: -3, isCorrect: false },
    ],
  },
] as const

const parallelLinesTasks: readonly ParallelLinesTask[] = [
  {
    id: 'parallel-two-x',
    fixedK: 2,
    fixedB: 3,
    targetPoint: { x: 0, y: 4 },
    initialK: 1,
    initialB: 0,
  },
  {
    id: 'parallel-minus-four-x',
    fixedK: -4,
    fixedB: 1,
    targetPoint: { x: 0, y: -2 },
    initialK: -2,
    initialB: 1,
  },
  {
    id: 'parallel-half-x',
    fixedK: 0.5,
    fixedB: -6,
    targetPoint: { x: 0, y: 3 },
    initialK: 1.5,
    initialB: -1,
  },
  {
    id: 'parallel-five-x',
    fixedK: 5,
    fixedB: 0,
    targetPoint: { x: 0, y: -7 },
    initialK: 3,
    initialB: 0,
  },
  {
    id: 'parallel-constant',
    fixedK: 0,
    fixedB: -3,
    targetPoint: { x: 0, y: 6 },
    initialK: 1,
    initialB: 2,
  },
] as const

const additionalExercises = [
  { href: 'https://learningapps.org/display?v=pcs4dm2dc26' },
  { href: 'https://learningapps.org/display?v=pf5aemoba26' },
  { href: 'https://learningapps.org/display?v=puzh444yt26' },
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
                    <tr key={example.id} className="even:bg-slate-50">
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
            <MultiSelectQuiz
              title="Какие функции НЕ являются линейными?"
              options={nonLinearQuizOptions}
            />
            {coefficientQuizzes.map((quiz) => (
              <SingleChoiceQuiz
                key={quiz.title}
                title={quiz.title}
                options={quiz.options}
              />
            ))}
          </div>
          <FunctionSortingExercise />
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
              График пологий, изменения идут медленно: например, y ={' '}
              <Fraction numerator="1" denominator="2" />
              x.
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
              <div className="grid gap-4">
                <p>
                  Графиком линейной функции всегда является{' '}
                  <strong className="font-black text-slate-950">
                    прямая линия
                  </strong>
                  .
                </p>
                <p>
                  Вспомни геометрию: через любые две точки на плоскости можно
                  провести прямую, и притом только одну. Зачем считать таблицу
                  из 10 значений, если достаточно найти всего две точки,
                  отметить их и приложить линейку?
                </p>
                <p>
                  <strong className="font-black text-slate-950">
                    Важный лайфхак:
                  </strong>{' '}
                  чтобы график получился точным, всегда выбирай такие значения
                  x, чтобы y получался целым числом.
                </p>
                <p>
                  Когда мы изучили формулу{' '}
                  <strong className="font-black text-slate-950">
                    y = kx + b
                  </strong>
                  , самое время заглянуть в «паспорт» нашей функции и изучить ее
                  главные математические свойства. Для наглядности продолжим
                  использовать пример с TikTok-аккаунтом:{' '}
                  <strong className="font-black text-slate-950">
                    y = 10x + 50
                  </strong>
                  , где x — это дни, а y — подписчики.
                </p>
              </div>
            </InfoCard>
            <div className="grid gap-4 md:grid-cols-2">
              <InfoCard title="Область определения D(y)">
                <div className="grid gap-4">
                  <p>
                    <strong className="font-black text-slate-950">
                      Что это такое простыми словами:
                    </strong>{' '}
                    это все значения x, которые мы в принципе имеем право
                    подставить в формулу.
                  </p>
                  <ul className="grid list-disc gap-2 pl-5">
                    <li>
                      <strong className="font-black text-slate-950">
                        В математике:
                      </strong>{' '}
                      в формуле{' '}
                      <strong className="font-black text-slate-950">
                        y = kx + b
                      </strong>{' '}
                      можно умножать коэффициент k на абсолютно любое число.
                      Никаких запрещенных действий, например деления на ноль,
                      здесь нет. Поэтому область определения линейной функции —
                      <strong className="font-black text-slate-950">
                        {' '}
                        абсолютно все числа
                      </strong>
                      .
                    </li>
                    <li>
                      <strong className="font-black text-slate-950">
                        Запись:
                      </strong>{' '}
                      D(y): все числа.
                    </li>
                    <li>
                      <strong className="font-black text-slate-950">
                        В реальной жизни:
                      </strong>{' '}
                      если x — это дни ведения блога, мы обычно считаем от 0 и
                      дальше. Но математически можно подставить и x = −3:
                      получится, что 3 дня назад было 50 + 10 · (−3) = 20
                      подписчиков.
                    </li>
                  </ul>
                </div>
              </InfoCard>
              <InfoCard title="Множество значений E(y)">
                <div className="grid gap-4">
                  <p>
                    <strong className="font-black text-slate-950">
                      Что это такое простыми словами:
                    </strong>{' '}
                    это все результаты y, которые мы можем получить на выходе
                    после расчетов.
                  </p>
                  <ul className="grid list-disc gap-2 pl-5">
                    <li>
                      <strong className="font-black text-slate-950">
                        В математике:
                      </strong>{' '}
                      если{' '}
                      <strong className="font-black text-slate-950">
                        k ≠ 0
                      </strong>
                      , прямая линия бесконечно уходит вверх и вниз, поэтому
                      способна достичь любой высоты на оси y. Множество значений
                      линейной функции — тоже{' '}
                      <strong className="font-black text-slate-950">
                        любые числа
                      </strong>
                      .
                    </li>
                    <li>
                      <strong className="font-black text-slate-950">
                        Запись:
                      </strong>{' '}
                      E(y): все числа, при k ≠ 0.
                    </li>
                    <li>
                      <strong className="font-black text-slate-950">
                        Исключение:
                      </strong>{' '}
                      если скорость изменений равна нулю, то k = 0 и функция
                      становится постоянной. Например,{' '}
                      <strong className="font-black text-slate-950">
                        y = 50
                      </strong>
                      . Тогда множество значений состоит из одного числа:
                      <strong className="font-black text-slate-950">
                        {' '}
                        E(y) = {'{50}'}
                      </strong>
                      .
                    </li>
                  </ul>
                </div>
              </InfoCard>
              <InfoCard title="Нули функции">
                <div className="grid gap-4">
                  <p>
                    <strong className="font-black text-slate-950">
                      Что это такое простыми словами:
                    </strong>{' '}
                    это момент, когда процесс «обнуляется». На графике это
                    точка, где прямая пересекает горизонтальную ось x.
                  </p>
                  <ul className="grid list-disc gap-2 pl-5">
                    <li>
                      <strong className="font-black text-slate-950">
                        Главное условие:
                      </strong>{' '}
                      в этой точке высота y всегда равна нулю, то есть{' '}
                      <strong className="font-black text-slate-950">
                        y = 0
                      </strong>
                      .
                    </li>
                    <li>
                      <strong className="font-black text-slate-950">
                        Как найти математически:
                      </strong>{' '}
                      нужно вместо y подставить 0 и решить уравнение{' '}
                      <strong className="font-black text-slate-950">
                        kx + b = 0
                      </strong>
                      . Отсюда{' '}
                      <strong className="font-black text-slate-950">
                        x = −<Fraction numerator="b" denominator="k" />
                      </strong>
                      .
                    </li>
                    <li>
                      <strong className="font-black text-slate-950">
                        Пример из жизни:
                      </strong>{' '}
                      на балансе телефона было 300 рублей, и каждый день
                      списывается по 30 рублей. Формула:{' '}
                      <strong className="font-black text-slate-950">
                        y = −30x + 300
                      </strong>
                      .
                    </li>
                  </ul>
                  <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 font-semibold text-slate-900">
                    <p>−30x + 300 = 0</p>
                    <p>30x = 300</p>
                    <p>x = 10 дней</p>
                  </div>
                  <p>
                    <strong className="font-black text-slate-950">
                      Вывод:
                    </strong>{' '}
                    ровно на 10-й день деньги на телефоне закончатся, а точка на
                    графике будет{' '}
                    <strong className="font-black text-slate-950">
                      (10; 0)
                    </strong>
                    .
                  </p>
                </div>
              </InfoCard>
              <InfoCard title="Знакопостоянство">
                <div className="grid gap-4">
                  <p>
                    <strong className="font-black text-slate-950">
                      Что это такое простыми словами:
                    </strong>{' '}
                    это периоды, когда процесс находится «в плюсе» или «в
                    минусе».
                  </p>
                  <p>
                    Нуль функции делит весь график на две части — положительную
                    и отрицательную.
                  </p>
                  <ul className="grid list-disc gap-2 pl-5">
                    <li>
                      <strong className="font-black text-slate-950">
                        Функция положительна, y {'>'} 0:
                      </strong>{' '}
                      график находится выше оси x.
                    </li>
                    <li>
                      <strong className="font-black text-slate-950">
                        Функция отрицательна, y {'<'} 0:
                      </strong>{' '}
                      график находится ниже оси x.
                    </li>
                    <li>
                      <strong className="font-black text-slate-950">
                        Пример:
                      </strong>{' '}
                      для баланса телефона{' '}
                      <strong className="font-black text-slate-950">
                        y = −30x + 300
                      </strong>{' '}
                      нуль функции наступает при x = 10.
                    </li>
                  </ul>
                  <div className="grid gap-2 rounded-2xl border border-slate-200 bg-white p-4">
                    <p>
                      Если дней прошло{' '}
                      <strong className="font-black text-slate-950">
                        меньше 10
                      </strong>
                      , баланс положительный: y {'>'} 0.
                    </p>
                    <p>
                      В момент{' '}
                      <strong className="font-black text-slate-950">
                        x = 10
                      </strong>{' '}
                      наступает нуль функции: баланс равен 0.
                    </p>
                    <p>
                      Если дней прошло{' '}
                      <strong className="font-black text-slate-950">
                        больше 10
                      </strong>
                      , баланс уходит в минус: y {'<'} 0.
                    </p>
                  </div>
                </div>
              </InfoCard>
            </div>
            <article className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <p>
                Чтобы найти промежутки знакопостоянства функции (то есть
                интервалы, где функция положительная или отрицательная,
                неположительная, неотрицательная), нужно решить соответствующее
                неравенство.
              </p>
              <div className="grid gap-3">
                <h3 className="text-lg font-black text-slate-950">
                  Основное правило
                </h3>
                <ul className="grid list-disc gap-2 pl-5">
                  <li>
                    <strong className="font-black text-slate-950">
                      Положительные значения{' '}
                      <span className="whitespace-nowrap">(y {'>'} 0)</span>:
                    </strong>{' '}
                    нужно составить и решить неравенство{' '}
                    <span className="whitespace-nowrap">f(x) {'>'} 0</span>.
                    График в этих точках лежит выше оси Ox.
                  </li>
                  <li>
                    <strong className="font-black text-slate-950">
                      Отрицательные значения{' '}
                      <span className="whitespace-nowrap">(y {'<'} 0)</span>:
                    </strong>{' '}
                    нужно составить и решить неравенство{' '}
                    <span className="whitespace-nowrap">f(x) {'<'} 0</span>.
                    График в этих точках лежит ниже оси Ox.
                  </li>
                  <li>
                    <strong className="font-black text-slate-950">
                      Неположительные значения{' '}
                      <span className="whitespace-nowrap">(y ≤ 0)</span>
                    </strong>{' '}
                    — подходят все отрицательные значения и ноль: нужно
                    составить и решить неравенство{' '}
                    <span className="whitespace-nowrap">f(x) ≤ 0</span>.
                  </li>
                  <li>
                    <strong className="font-black text-slate-950">
                      Неотрицательные значения{' '}
                      <span className="whitespace-nowrap">(y ≥ 0)</span>
                    </strong>{' '}
                    — подходят все положительные значения и ноль: нужно
                    составить и решить неравенство{' '}
                    <span className="whitespace-nowrap">f(x) ≥ 0</span>.
                  </li>
                </ul>
              </div>
              <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                <p>
                  <strong className="font-black text-slate-950">Пример:</strong>{' '}
                  Найдите, при каких значениях x функция{' '}
                  <span className="whitespace-nowrap">y = 2x − 8</span> принимает
                  положительные значения.
                </p>
                <ol className="grid list-decimal gap-2 pl-5">
                  <li>
                    Составляем неравенство:{' '}
                    <span className="whitespace-nowrap">2x − 8 {'>'} 0</span>
                  </li>
                  <li>
                    Переносим число:{' '}
                    <span className="whitespace-nowrap">2x {'>'} 8</span>
                  </li>
                  <li>
                    Делим на 2:{' '}
                    <span className="whitespace-nowrap">x {'>'} 4</span>
                  </li>
                </ol>
                <p>
                  <strong className="font-black text-slate-950">Ответ:</strong>{' '}
                  Функция положительна при{' '}
                  <span className="whitespace-nowrap">x {'>'} 4</span>.
                </p>
              </div>
            </article>
            <SignConstancyExercise />
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

        <Section title="Тренажер 3: поймай точку">
          <PointCatchTrainer />
        </Section>

        <Section title="Тренажер 4: параллельные прямые">
          <div className="grid gap-5">
            <ParallelLinesTrainer />
            <ParallelCoefficientQuestion />
          </div>
        </Section>

        <Section title="Дополнительные упражнения">
          <div className="grid gap-5">
            <p className="text-lg text-slate-700">
              Если ты справился со всеми заданиями, можешь выполнить
              дополнительные упражнения и закрепить полученные знания.
            </p>
            <div className="grid gap-3 md:grid-cols-3">
              {additionalExercises.map((exercise, index) => (
                <a
                  key={exercise.href}
                  className="rounded-3xl border border-blue-100 bg-blue-50 p-5 font-black text-blue-800 transition hover:-translate-y-1 hover:border-blue-300 hover:bg-blue-100 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-blue-100"
                  href={exercise.href}
                  rel="noreferrer"
                  target="_blank"
                >
                  Упражнение {index + 1}
                </a>
              ))}
            </div>
          </div>
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

function ChoiceFormulaLabel({
  description,
  formula,
}: {
  readonly description: ReactNode
  readonly formula: ReactNode
}) {
  return (
    <>
      {description}
      <br />
      <span className="whitespace-nowrap">{formula}</span>
    </>
  )
}

function InlineFormula({ children }: { readonly children: ReactNode }) {
  return (
    <span className="mx-1 rounded-xl bg-slate-100 px-2 py-1 font-black text-slate-950">
      {children}
    </span>
  )
}

function Fraction({
  denominator,
  numerator,
}: {
  readonly denominator: ReactNode
  readonly numerator: ReactNode
}) {
  return (
    <span className="mx-0.5 inline-grid translate-y-[0.18em] grid-rows-[auto_auto] place-items-center align-middle leading-none">
      <span className="border-b border-current px-1 pb-0.5 text-[0.82em]">
        {numerator}
      </span>
      <span className="px-1 pt-0.5 text-[0.82em]">{denominator}</span>
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
      <div className="text-slate-700">{children}</div>
    </article>
  )
}

function SingleChoiceQuiz({
  options,
  title,
}: {
  readonly options: readonly QuizOption[]
  readonly title: string
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selectedOption = options.find((option) => option.id === selectedId)

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
              onClick={() => setSelectedId(option.id)}
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
  const [isChecked, setIsChecked] = useState(false)

  function toggleOption(optionId: string) {
    setIsChecked(false)
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
                isChecked &&
                  isSelected &&
                  option.isCorrect &&
                  'border-emerald-300 bg-emerald-50 text-emerald-800',
                isChecked &&
                  isSelected &&
                  !option.isCorrect &&
                  'border-red-300 bg-red-50 text-red-800',
                isSelected &&
                  !isChecked &&
                  'border-blue-300 bg-blue-50 text-blue-800',
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
      <Button
        className="w-fit"
        disabled={selectedIds.length === 0}
        onClick={() => setIsChecked(true)}
      >
        Проверить
      </Button>
    </article>
  )
}

function FunctionSortingExercise() {
  const [locations, setLocations] = useState<Record<string, SortingLocation>>(
    () =>
      sortingOptions.reduce<Record<string, SortingLocation>>(
        (currentLocations, option) => ({
          ...currentLocations,
          [option.id]: 'pool',
        }),
        {},
      ),
  )
  const [isChecked, setIsChecked] = useState(false)

  function moveCard(optionId: string, location: SortingLocation) {
    setIsChecked(false)
    setLocations((currentLocations) => ({
      ...currentLocations,
      [optionId]: location,
    }))
  }

  function handleDragStart(event: DragEvent<HTMLElement>, optionId: string) {
    event.dataTransfer.setData('text/plain', optionId)
    event.dataTransfer.effectAllowed = 'move'
  }

  function handleDrop(
    event: DragEvent<HTMLElement>,
    location: SortingLocation,
  ) {
    event.preventDefault()

    const optionId = event.dataTransfer.getData('text/plain')
    const hasOption = sortingOptions.some((option) => option.id === optionId)

    if (hasOption) {
      moveCard(optionId, location)
    }
  }

  function getOptionsByLocation(location: SortingLocation) {
    return sortingOptions.filter((option) => locations[option.id] === location)
  }

  return (
    <article className="grid gap-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <div className="grid gap-2">
        <h3 className="text-xl font-black text-slate-950">
          Отсортируй функции
        </h3>
        <p className="text-slate-700">
          Перетащи каждую функцию в одну из колонок: линейные функции или другие
          функции.
        </p>
      </div>

      <SortingDropZone
        isChecked={isChecked}
        location="pool"
        options={getOptionsByLocation('pool')}
        onDrop={handleDrop}
        onDragStart={handleDragStart}
      />

      <div className="grid gap-4 md:grid-cols-2">
        <SortingDropZone
          isChecked={isChecked}
          location="linear"
          options={getOptionsByLocation('linear')}
          title="Линейные функции"
          onDrop={handleDrop}
          onDragStart={handleDragStart}
        />
        <SortingDropZone
          isChecked={isChecked}
          location="other"
          options={getOptionsByLocation('other')}
          title="Другие функции"
          onDrop={handleDrop}
          onDragStart={handleDragStart}
        />
      </div>

      <Button
        className="w-fit"
        disabled={Object.values(locations).some(
          (location) => location === 'pool',
        )}
        onClick={() => setIsChecked(true)}
      >
        Проверить
      </Button>
    </article>
  )
}

function SortingDropZone({
  isChecked,
  location,
  onDragStart,
  onDrop,
  options,
  title,
}: {
  readonly isChecked: boolean
  readonly location: SortingLocation
  readonly onDragStart: (
    event: DragEvent<HTMLElement>,
    optionId: string,
  ) => void
  readonly onDrop: (
    event: DragEvent<HTMLElement>,
    location: SortingLocation,
  ) => void
  readonly options: readonly QuizOption[]
  readonly title?: string
}) {
  return (
    <section
      className={classNames(
        'grid min-h-36 content-start gap-3 rounded-3xl border-2 border-dashed bg-white p-4 transition',
        location === 'pool' ? 'border-slate-200' : 'border-blue-200',
      )}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => onDrop(event, location)}
    >
      {title ? (
        <h4 className="rounded-2xl bg-blue-50 px-4 py-3 text-base font-black text-blue-800">
          {title}
        </h4>
      ) : null}
      <div className="grid gap-2">
        {options.length > 0 ? (
          options.map((option) => (
            <SortingFunctionCard
              key={option.id}
              isChecked={isChecked}
              location={location}
              option={option}
              onDragStart={onDragStart}
            />
          ))
        ) : (
          <p className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-500">
            Перетащи сюда функции
          </p>
        )}
      </div>
    </section>
  )
}

function SortingFunctionCard({
  isChecked,
  location,
  onDragStart,
  option,
}: {
  readonly isChecked: boolean
  readonly location: SortingLocation
  readonly onDragStart: (
    event: DragEvent<HTMLElement>,
    optionId: string,
  ) => void
  readonly option: QuizOption
}) {
  const isPlaced = location !== 'pool'
  const isCorrectLocation =
    (option.isCorrect && location === 'linear') ||
    (!option.isCorrect && location === 'other')

  return (
    <article
      className={classNames(
        'cursor-grab rounded-2xl border px-4 py-3 font-semibold text-slate-900 shadow-sm transition active:cursor-grabbing',
        isChecked &&
          isPlaced &&
          isCorrectLocation &&
          'border-emerald-300 bg-emerald-50 text-emerald-800',
        isChecked &&
          isPlaced &&
          !isCorrectLocation &&
          'border-red-300 bg-red-50 text-red-800',
        (!isChecked || !isPlaced) && 'border-slate-200 bg-white',
      )}
      draggable
      onDragStart={(event) => onDragStart(event, option.id)}
    >
      {option.label}
    </article>
  )
}

function MatchingExercise() {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isChecked, setIsChecked] = useState(false)

  function assignAnswer(situationId: string, choiceId: string) {
    setIsChecked(false)
    setAnswers((currentAnswers) => {
      const nextAnswers = Object.fromEntries(
        Object.entries(currentAnswers).filter(
          ([currentSituationId, currentChoiceId]) =>
            currentSituationId === situationId || currentChoiceId !== choiceId,
        ),
      )

      return {
        ...nextAnswers,
        [situationId]: choiceId,
      }
    })
  }

  function handleAnswerDragStart(
    event: DragEvent<HTMLElement>,
    choiceId: string,
  ) {
    event.dataTransfer.setData('text/plain', choiceId)
    event.dataTransfer.effectAllowed = 'move'
  }

  function handleSituationDrop(
    event: DragEvent<HTMLElement>,
    situationId: string,
  ) {
    event.preventDefault()

    const choiceId = event.dataTransfer.getData('text/plain')
    const hasChoice = matchingChoices.some((choice) => choice.id === choiceId)

    if (hasChoice) {
      assignAnswer(situationId, choiceId)
    }
  }

  return (
    <article className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <h3 className="text-xl font-black text-slate-950">
        Задание: соотнеси ситуацию и коэффициент k
      </h3>

      <div className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <h4 className="font-black text-slate-950">Варианты ответов</h4>
        <div className="grid gap-2 md:grid-cols-3">
          {matchingChoices.map((choice) => (
            <article
              key={choice.id}
              className="cursor-grab rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-300 active:cursor-grabbing"
              draggable
              onDragStart={(event) => handleAnswerDragStart(event, choice.id)}
            >
              {choice.label}
            </article>
          ))}
        </div>
      </div>

      <div className="grid gap-4">
        {matchingSituations.map((situation) => {
          const selectedId = answers[situation.id]
          const selectedChoice = matchingChoices.find(
            (choice) => choice.id === selectedId,
          )
          const isCorrect = selectedId === situation.correctChoiceId

          return (
            <section
              key={situation.id}
              className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 md:grid-cols-[1fr_minmax(260px,420px)] md:items-center"
            >
              <p className="font-semibold text-slate-900">{situation.text}</p>
              <div
                className={classNames(
                  'grid min-h-20 place-items-center rounded-2xl border-2 border-dashed px-4 py-3 text-sm font-semibold transition',
                  isChecked &&
                    selectedChoice &&
                    isCorrect &&
                    'border-emerald-300 bg-emerald-50 text-emerald-800',
                  isChecked &&
                    selectedChoice &&
                    !isCorrect &&
                    'border-red-300 bg-red-50 text-red-800',
                  (!isChecked || !selectedChoice) &&
                    'border-blue-200 bg-blue-50/40 text-slate-500',
                )}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => handleSituationDrop(event, situation.id)}
              >
                {selectedChoice ? (
                  <article
                    className="w-full cursor-grab rounded-2xl border border-current bg-white/70 px-4 py-3 active:cursor-grabbing"
                    draggable
                    onDragStart={(event) =>
                      handleAnswerDragStart(event, selectedChoice.id)
                    }
                  >
                    {selectedChoice.label}
                  </article>
                ) : (
                  'Перетащи сюда один ответ'
                )}
              </div>
            </section>
          )
        })}
      </div>

      <Button
        className="w-fit"
        disabled={matchingSituations.some(
          (situation) => answers[situation.id] === undefined,
        )}
        onClick={() => setIsChecked(true)}
      >
        Проверить
      </Button>
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

function SignConstancyExercise() {
  const [taskIndex, setTaskIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [isChecked, setIsChecked] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const task = signConstancyTasks[taskIndex]
  const isCorrect = isSignConstancyAnswerCorrect(answer, task.expected)

  function insertSymbol(symbol: (typeof inequalitySymbols)[number]) {
    const input = inputRef.current
    const selectionStart = input?.selectionStart ?? answer.length
    const selectionEnd = input?.selectionEnd ?? answer.length
    const nextAnswer =
      answer.slice(0, selectionStart) + symbol + answer.slice(selectionEnd)

    setIsChecked(false)
    setAnswer(nextAnswer)

    requestAnimationFrame(() => {
      const nextPosition = selectionStart + symbol.length
      input?.focus()
      input?.setSelectionRange(nextPosition, nextPosition)
    })
  }

  function nextTask() {
    setTaskIndex((currentIndex) => (currentIndex + 1) % signConstancyTasks.length)
    setAnswer('')
    setIsChecked(false)
  }

  return (
    <article className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <div className="grid gap-2">
        <h3 className="text-xl font-black text-slate-950">
          Задание: промежутки знакопостоянства
        </h3>
        <p className="font-semibold text-blue-800">
          Вычисления выполняй в тетради!
        </p>
        <p className="text-slate-700">
          Задание {taskIndex + 1} из {signConstancyTasks.length}. Введи ответ в
          виде неравенства, например{' '}
          <span className="whitespace-nowrap">x {'>'} 4</span>. Знаки можно
          вставить кнопками.
        </p>
      </div>

      <p className="text-lg font-black text-slate-950">{task.prompt}</p>

      <div className="flex flex-wrap gap-2">
        {inequalitySymbols.map((symbol) => (
          <button
            key={symbol}
            className="min-h-11 min-w-11 rounded-full border border-slate-200 bg-white text-lg font-black text-slate-950 transition hover:border-blue-300 hover:text-blue-700 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-blue-100"
            type="button"
            onClick={() => insertSymbol(symbol)}
          >
            {symbol}
          </button>
        ))}
      </div>

      <input
        ref={inputRef}
        className={classNames(
          'rounded-2xl border bg-white px-4 py-3 text-slate-950 transition outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100',
          isChecked && isCorrect && 'border-emerald-300 bg-emerald-50',
          isChecked && !isCorrect && 'border-red-300 bg-red-50',
          !isChecked && 'border-slate-200',
        )}
        placeholder="Например: x > 8"
        value={answer}
        onChange={(event) => {
          setIsChecked(false)
          setAnswer(event.target.value)
        }}
      />

      <div className="flex flex-wrap gap-3">
        <Button
          disabled={!answer.trim()}
          onClick={() => setIsChecked(true)}
        >
          Проверить
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setAnswer('')
            setIsChecked(false)
            inputRef.current?.focus()
          }}
        >
          Сбросить
        </Button>
        <Button variant="secondary" onClick={nextTask}>
          Следующее задание
        </Button>
      </div>

      {isChecked ? (
        <Feedback isCorrect={isCorrect}>
          {isCorrect
            ? 'Верно!'
            : `Пока неверно. Правильный ответ: ${task.answer}.`}
        </Feedback>
      ) : null}
    </article>
  )
}

function isSignConstancyAnswerCorrect(
  value: string,
  expected: readonly string[],
) {
  const normalized = normalizeSignConstancyAnswer(value)

  return expected.some(
    (variant) => normalizeSignConstancyAnswer(variant) === normalized,
  )
}

function normalizeSignConstancyAnswer(value: string) {
  return value
    .replaceAll(' ', '')
    .replaceAll('−', '-')
    .replaceAll('–', '-')
    .replaceAll('≤', '<=')
    .replaceAll('≥', '>=')
    .toLowerCase()
}

function BCoefficientExercise() {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [checkedAnswers, setCheckedAnswers] = useState<Record<string, boolean>>(
    {},
  )

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
          const isChecked = checkedAnswers[task.id] === true

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
                placeholder="Например: b = 1, (0; 1)"
                value={answers[task.id] ?? ''}
                onChange={(event) => {
                  setCheckedAnswers((currentCheckedAnswers) => ({
                    ...currentCheckedAnswers,
                    [task.id]: false,
                  }))
                  setAnswers((currentAnswers) => ({
                    ...currentAnswers,
                    [task.id]: event.target.value,
                  }))
                }}
              />
              <Button
                className="w-fit"
                disabled={!answers[task.id]?.trim()}
                onClick={() =>
                  setCheckedAnswers((currentCheckedAnswers) => ({
                    ...currentCheckedAnswers,
                    [task.id]: true,
                  }))
                }
              >
                Проверить
              </Button>
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
          {explanation.map((line, index) => (
            <p key={index}>{line}</p>
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
          Кликни по сетке и поставь две точки{' '}
          <strong className="font-black text-slate-950">
            с целыми координатами
          </strong>
          . Затем нажми «Проверить».
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

function PointCatchTrainer() {
  const [taskIndex, setTaskIndex] = useState(0)
  const [selectedPointIds, setSelectedPointIds] = useState<readonly string[]>(
    [],
  )
  const [isChecked, setIsChecked] = useState(false)
  const task = pointCatchTasks[taskIndex]
  const correctPointIds = task.points
    .filter((point) => point.isCorrect)
    .map((point) => point.id)
  const isSuccess =
    selectedPointIds.length === correctPointIds.length &&
    selectedPointIds.every((pointId) => correctPointIds.includes(pointId))

  function togglePoint(pointId: string) {
    setIsChecked(false)
    setSelectedPointIds((currentPointIds) =>
      currentPointIds.includes(pointId)
        ? currentPointIds.filter((currentPointId) => currentPointId !== pointId)
        : [...currentPointIds, pointId],
    )
  }

  function nextTask() {
    setTaskIndex((currentIndex) => (currentIndex + 1) % pointCatchTasks.length)
    setSelectedPointIds([])
    setIsChecked(false)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,440px)]">
      <div className="grid gap-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <div className="grid gap-2">
          <p className="text-lg font-black text-slate-950">
            Найди точки для функции: {task.formula}
          </p>
          <p className="text-slate-700">
            Отметь все точки, через которые проходит график данной функции. В
            случае успеха на экране появится прямая.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-4 font-semibold text-slate-800">
          Выбранные точки:{' '}
          {selectedPointIds.length > 0
            ? task.points
                .filter((point) => selectedPointIds.includes(point.id))
                .map((point) => point.label)
                .join(', ')
            : 'пока нет'}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setIsChecked(true)}>Проверить</Button>
          <Button
            variant="secondary"
            onClick={() => {
              setSelectedPointIds([])
              setIsChecked(false)
            }}
          >
            Сбросить выбор
          </Button>
          <Button variant="secondary" onClick={nextTask}>
            Следующая функция
          </Button>
        </div>

        {isChecked ? (
          <Feedback isCorrect={isSuccess}>
            {isSuccess
              ? 'Верно! Все отмеченные точки лежат на графике, поэтому прямая появилась.'
              : 'Пока неверно. Отметь все правильные точки и убери лишние.'}
          </Feedback>
        ) : null}
      </div>

      <PointCatchGraph
        isChecked={isChecked}
        isSuccess={isChecked && isSuccess}
        points={task.points}
        selectedPointIds={selectedPointIds}
        task={task}
        onPointClick={togglePoint}
      />
    </div>
  )
}

function PointCatchGraph({
  isChecked,
  isSuccess,
  onPointClick,
  points,
  selectedPointIds,
  task,
}: {
  readonly isChecked: boolean
  readonly isSuccess: boolean
  readonly onPointClick: (pointId: string) => void
  readonly points: readonly CatchPoint[]
  readonly selectedPointIds: readonly string[]
  readonly task: PointCatchTask
}) {
  const start = mapPoint({ x: -axisRange, y: task.k * -axisRange + task.b })
  const end = mapPoint({ x: axisRange, y: task.k * axisRange + task.b })

  return (
    <GraphShell>
      <GraphGrid />
      {isSuccess ? (
        <line
          className="stroke-emerald-600"
          strokeLinecap="round"
          strokeWidth={4}
          x1={start.x}
          x2={end.x}
          y1={start.y}
          y2={end.y}
        />
      ) : null}
      {points.map((point) => {
        const mappedPoint = mapPoint(point)
        const isSelected = selectedPointIds.includes(point.id)
        const pointColor =
          isChecked && isSelected && point.isCorrect
            ? 'fill-emerald-500 stroke-emerald-100'
            : isChecked && isSelected && !point.isCorrect
              ? 'fill-red-500 stroke-red-100'
              : isSelected
                ? 'fill-blue-600 stroke-blue-100'
                : 'fill-white stroke-blue-500'

        return (
          <g
            key={point.id}
            className="cursor-pointer"
            role="button"
            tabIndex={0}
            onClick={() => onPointClick(point.id)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                onPointClick(point.id)
              }
            }}
          >
            <circle
              className={pointColor}
              cx={mappedPoint.x}
              cy={mappedPoint.y}
              r={10}
              strokeWidth={4}
            />
            <text
              className={classNames(
                'pointer-events-none text-xs font-black',
                isSelected ? 'fill-white' : 'fill-blue-700',
              )}
              textAnchor="middle"
              x={mappedPoint.x}
              y={mappedPoint.y + 4}
            >
              {point.label}
            </text>
            <text
              className="pointer-events-none fill-slate-500 text-[10px] font-semibold"
              textAnchor="middle"
              x={mappedPoint.x}
              y={mappedPoint.y - 14}
            >
              ({point.x}; {point.y})
            </text>
          </g>
        )
      })}
    </GraphShell>
  )
}

function ParallelLinesTrainer() {
  const [taskIndex, setTaskIndex] = useState(0)
  const task = parallelLinesTasks[taskIndex]
  const [studentK, setStudentK] = useState(task.initialK)
  const [studentB, setStudentB] = useState(task.initialB)
  const [isChecked, setIsChecked] = useState(false)
  const isParallel = studentK === task.fixedK
  const passesThroughPoint =
    studentK * task.targetPoint.x + studentB === task.targetPoint.y
  const isCorrect = isParallel && passesThroughPoint

  function nextTask() {
    const nextIndex = (taskIndex + 1) % parallelLinesTasks.length
    const nextTaskValue = parallelLinesTasks[nextIndex]

    setTaskIndex(nextIndex)
    setStudentK(nextTaskValue.initialK)
    setStudentB(nextTaskValue.initialB)
    setIsChecked(false)
  }

  function updateStudentK(value: number) {
    setStudentK(value)
    setIsChecked(false)
  }

  function updateStudentB(value: number) {
    setStudentB(value)
    setIsChecked(false)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,440px)]">
      <div className="grid gap-5 rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <div className="grid gap-2">
          <p className="text-lg font-black text-slate-950">
            Неподвижная прямая: {formatLinearFunction(task.fixedK, task.fixedB)}
          </p>
          <p className="text-slate-700">
            Измени числовые коэффициенты во второй прямой так, чтобы она была
            параллельна первой и прошла через точку{' '}
            <strong className="font-black text-slate-950">
              ({task.targetPoint.x}; {task.targetPoint.y})
            </strong>
            .
          </p>
        </div>

        <FormulaCard>
          <p className="text-xl font-black text-slate-950">
            Твоя прямая: {formatLinearFunction(studentK, studentB)}
          </p>
        </FormulaCard>

        <div className="grid gap-4 md:grid-cols-2">
          <NumberControl
            label="k"
            max={6}
            min={-6}
            step={0.5}
            value={studentK}
            onChange={updateStudentK}
          />
          <NumberControl
            label="b"
            max={10}
            min={-10}
            step={1}
            value={studentB}
            onChange={updateStudentB}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={() => setIsChecked(true)}>Проверить</Button>
          <Button variant="secondary" onClick={nextTask}>
            Следующая пара
          </Button>
        </div>

        {isChecked ? (
          <Feedback isCorrect={isCorrect}>
            {isCorrect
              ? 'Верно! Коэффициенты k равны, а твоя прямая проходит через заданную точку.'
              : 'Пока неверно. Для параллельности нужен такой же k, а b должен привести прямую в заданную точку.'}
          </Feedback>
        ) : null}
      </div>

      <ParallelLinesGraph
        fixedB={task.fixedB}
        fixedK={task.fixedK}
        isCorrect={isChecked && isCorrect}
        studentB={studentB}
        studentK={studentK}
        targetPoint={task.targetPoint}
      />
    </div>
  )
}

function ParallelCoefficientQuestion() {
  const [answer, setAnswer] = useState('')
  const [isChecked, setIsChecked] = useState(false)
  const normalizedAnswer = normalizeCoefficientName(answer)
  const isCorrect = normalizedAnswer === 'угловойкоэффициент'
  const needsNameHint = normalizedAnswer === 'k'

  return (
    <article className="grid gap-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
      <div className="grid gap-2">
        <h3 className="text-xl font-black text-slate-950">
          Открытый вопрос
        </h3>
        <p className="font-semibold text-slate-900">
          Когда графики параллельны, какие коэффициенты совпадают? (напишите, как
          называется этот коэффициент)
        </p>
      </div>

      <input
        className={classNames(
          'rounded-2xl border bg-white px-4 py-3 text-slate-950 transition outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100',
          isChecked && isCorrect && 'border-emerald-300 bg-emerald-50',
          isChecked &&
            !isCorrect &&
            !needsNameHint &&
            'border-red-300 bg-red-50',
          isChecked && needsNameHint && 'border-amber-300 bg-amber-50',
          !isChecked && 'border-slate-200',
        )}
        placeholder="Впиши название коэффициента"
        value={answer}
        onChange={(event) => {
          setIsChecked(false)
          setAnswer(event.target.value)
        }}
      />

      <Button
        className="w-fit"
        disabled={!answer.trim()}
        onClick={() => setIsChecked(true)}
      >
        Проверить
      </Button>

      {isChecked && isCorrect ? (
        <Feedback isCorrect>Верно! Это угловой коэффициент.</Feedback>
      ) : null}

      {isChecked && needsNameHint ? (
        <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 font-semibold text-amber-900">
          Ты определил верно, но вспомни как называется этот коэффициент.
        </p>
      ) : null}

      {isChecked && !isCorrect && !needsNameHint ? (
        <Feedback isCorrect={false}>
          Пока неверно, подумай еще!
        </Feedback>
      ) : null}
    </article>
  )
}

function normalizeCoefficientName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replaceAll('ё', 'е')
    .replaceAll(/[\s-]+/g, '')
}

function NumberControl({
  label,
  max,
  min,
  onChange,
  step,
  value,
}: {
  readonly label: string
  readonly max: number
  readonly min: number
  readonly onChange: (value: number) => void
  readonly step: number
  readonly value: number
}) {
  return (
    <label className="grid gap-2">
      <span className="flex items-center justify-between font-black text-slate-950">
        <span>{label}</span>
        <span className="rounded-full bg-white px-3 py-1 text-blue-700">
          {formatSignedNumberNode(value)}
        </span>
      </span>
      <input
        className="accent-blue-600"
        max={max}
        min={min}
        step={step}
        type="range"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <input
        className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-950 transition outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
        max={max}
        min={min}
        step={step}
        type="number"
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  )
}

function ParallelLinesGraph({
  fixedB,
  fixedK,
  isCorrect,
  studentB,
  studentK,
  targetPoint,
}: {
  readonly fixedB: number
  readonly fixedK: number
  readonly isCorrect: boolean
  readonly studentB: number
  readonly studentK: number
  readonly targetPoint: Point
}) {
  const fixedStart = mapPoint({
    x: -axisRange,
    y: fixedK * -axisRange + fixedB,
  })
  const fixedEnd = mapPoint({ x: axisRange, y: fixedK * axisRange + fixedB })
  const studentStart = mapPoint({
    x: -axisRange,
    y: studentK * -axisRange + studentB,
  })
  const studentEnd = mapPoint({
    x: axisRange,
    y: studentK * axisRange + studentB,
  })
  const mappedTargetPoint = mapPoint(targetPoint)

  return (
    <GraphShell>
      <GraphGrid />
      <line
        className="stroke-blue-600"
        strokeLinecap="round"
        strokeWidth={4}
        x1={fixedStart.x}
        x2={fixedEnd.x}
        y1={fixedStart.y}
        y2={fixedEnd.y}
      />
      <line
        className={isCorrect ? 'stroke-emerald-600' : 'stroke-orange-500'}
        strokeDasharray={isCorrect ? undefined : '8 8'}
        strokeLinecap="round"
        strokeWidth={4}
        x1={studentStart.x}
        x2={studentEnd.x}
        y1={studentStart.y}
        y2={studentEnd.y}
      />
      <circle
        className="fill-red-500 stroke-white"
        cx={mappedTargetPoint.x}
        cy={mappedTargetPoint.y}
        r={8}
        strokeWidth={3}
      />
      <text
        className="fill-red-700 text-xs font-black"
        x={mappedTargetPoint.x + 10}
        y={mappedTargetPoint.y - 10}
      >
        ({targetPoint.x}; {targetPoint.y})
      </text>
    </GraphShell>
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
        x2={graphSize - 12}
        y1={graphCenter}
        y2={graphCenter}
      />
      <line
        className="stroke-slate-400"
        strokeWidth={2}
        x1={graphCenter}
        x2={graphCenter}
        y1={12}
        y2={graphSize}
      />
      <polygon
        className="fill-slate-400"
        points={`${graphSize - 4},${graphCenter} ${graphSize - 18},${graphCenter - 7} ${graphSize - 18},${graphCenter + 7}`}
      />
      <polygon
        className="fill-slate-400"
        points={`${graphCenter},4 ${graphCenter - 7},18 ${graphCenter + 7},18`}
      />
      {coordinates
        .filter(
          (coordinate) =>
            coordinate !== 0 &&
            coordinate !== -axisRange &&
            coordinate !== axisRange &&
            coordinate % 2 === 0,
        )
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
        x={graphCenter + 6}
        y={graphCenter + 15}
      >
        0
      </text>
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

function buildSliderExplanation(k: number, b: number): readonly ReactNode[] {
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
    b > 0 ? (
      <>
        График пересекает ось y выше начала координат в точке (0;{' '}
        {formatSignedNumberNode(b)}).
      </>
    ) : b < 0 ? (
      <>
        График пересекает ось y ниже начала координат в точке (0;{' '}
        {formatSignedNumberNode(b)}).
      </>
    ) : (
      'График проходит ровно через центр (0; 0). Это прямая пропорциональность.'
    )

  return [direction, speed, start]
}

function formatLinearFunction(k: number, b: number) {
  if (k === 0) {
    return <>y = {formatSignedNumberNode(b)}</>
  }

  return (
    <>
      y = {formatCoefficientNode(k)}
      {b !== 0 ? (
        <>
          {b > 0 ? ' + ' : ' − '}
          {formatUnsignedNumberNode(Math.abs(b))}
        </>
      ) : null}
    </>
  )
}

function formatCoefficientNode(value: number) {
  if (value === 1) {
    return 'x'
  }

  if (value === -1) {
    return '−x'
  }

  return (
    <>
      {value < 0 ? '−' : ''}
      {formatUnsignedNumberNode(Math.abs(value))}x
    </>
  )
}

function formatSignedNumberNode(value: number) {
  return (
    <>
      {value < 0 ? '−' : ''}
      {formatUnsignedNumberNode(Math.abs(value))}
    </>
  )
}

function formatUnsignedNumberNode(value: number) {
  if (Number.isInteger(value)) {
    return String(value)
  }

  if (Number.isInteger(value * 2)) {
    return <Fraction numerator={String(value * 2)} denominator="2" />
  }

  return String(value)
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
