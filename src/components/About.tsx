'use client'

import { useEffect, useRef } from 'react'

const EXPERIENCE = [
  { company: 'Авито', role: 'Senior BI-аналитик', period: '2022 — сейчас', color: 'var(--purple)' },
  { company: 'Ситимобил', role: 'Аналитик данных', period: '2020 — 2021', color: 'var(--orange)' },
  { company: 'qlean.ru', role: 'Продуктовый аналитик', period: '2018 — 2019', color: 'var(--teal)' },
]

const SKILLS = [
  'Дата-визуализация', 'BI-аналитика', 'Tableau', 'Redash', 'SQL', 'Python',
  'A/B-тесты', 'Инфографика', 'Датавиз-ревью', 'Дашборды',
]

export default function About() {
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            e.target.classList.add('opacity-100', 'translate-y-0')
            e.target.classList.remove('opacity-0', 'translate-y-8')
          }
        })
      },
      { threshold: 0.1 }
    )
    const els = sectionRef.current?.querySelectorAll('.fade-in')
    els?.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <section id="about" ref={sectionRef} className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="fade-in opacity-0 translate-y-8 transition-all duration-700 mb-16">
          <div
            className="text-xs font-bold tracking-widest uppercase mb-3"
            style={{ color: 'var(--teal-dark)' }}
          >
            Об авторе
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900">
            Валерия Смирнова
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-16 items-start">
          {/* Left: bio */}
          <div className="space-y-6 fade-in opacity-0 translate-y-8 transition-all duration-700 delay-100">
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
              style={{ background: 'var(--teal-light)' }}
            >
              🥰
            </div>

            <p className="text-lg text-gray-600 leading-relaxed">
              Senior BI-аналитик в Авито, влюблённая в дата-визуализацию. Работаю с данными
              с 2018 года — прошла путь от продуктовой аналитики до специализации на BI
              и визуализации.
            </p>
            <p className="text-base text-gray-500 leading-relaxed">
              Автор канала{' '}
              <a
                href="https://t.me/loving_bi"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold hover:underline"
                style={{ color: 'var(--teal-dark)' }}
              >
                «Любовь, BI и графики»
              </a>
              , где рассказываю про реальные рабочие кейсы, объясняю принципы хорошего
              датавиза и разбираю типичные ошибки. Публикации на Хабре:{' '}
              <a
                href="https://habr.com/ru/articles/984620/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold hover:underline"
                style={{ color: 'var(--teal-dark)' }}
              >
                введение в создание дашбордов
              </a>
              {' '}и{' '}
              <a
                href="https://habr.com/ru/articles/1004298/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold hover:underline"
                style={{ color: 'var(--teal-dark)' }}
              >
                стартер-пак BI-аналитика
              </a>
              .
            </p>
            <p className="text-base text-gray-500 leading-relaxed">
              Член жюри «Прожарки дашбордов» в Авито — внутреннего проекта, который
              повышает культуру визуализации данных в компании.
            </p>

            {/* Skills */}
            <div className="flex flex-wrap gap-2 pt-2">
              {SKILLS.map(skill => (
                <span
                  key={skill}
                  className="text-xs font-medium px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-teal hover:text-teal-dark transition-colors cursor-default"
                  style={{ '--tw-border-opacity': 1 } as React.CSSProperties}
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Right: experience timeline */}
          <div className="fade-in opacity-0 translate-y-8 transition-all duration-700 delay-200">
            <div
              className="text-xs font-bold tracking-widest uppercase mb-6"
              style={{ color: 'var(--teal-dark)' }}
            >
              Опыт работы
            </div>
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-100" />

              <div className="space-y-6">
                {EXPERIENCE.map((exp, i) => (
                  <div key={i} className="flex gap-6 items-start relative">
                    {/* Dot */}
                    <div
                      className="relative z-10 w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center"
                      style={{ background: exp.color + '20', border: `2px solid ${exp.color}` }}
                    >
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ background: exp.color }}
                      />
                    </div>
                    {/* Content */}
                    <div
                      className="flex-1 bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-gray-200 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-semibold text-gray-900">{exp.company}</div>
                          <div className="text-sm text-gray-500 mt-0.5">{exp.role}</div>
                        </div>
                        <div className="text-xs text-gray-400 font-medium whitespace-nowrap">{exp.period}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Publications */}
            <div className="mt-8 fade-in opacity-0 translate-y-8 transition-all duration-700 delay-300">
              <div
                className="text-xs font-bold tracking-widest uppercase mb-4"
                style={{ color: 'var(--teal-dark)' }}
              >
                Публикации
              </div>
              <div
                className="p-4 rounded-xl border"
                style={{ background: 'var(--orange-light)', borderColor: '#F4A13540' }}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📰</span>
                  <div>
                    <div className="font-semibold text-gray-800 text-sm">Тинькофф Журнал</div>
                    <div className="text-xs text-gray-500 mt-1 leading-relaxed">
                      Статья о топ-актёрах российского кино с авторской инфографикой.
                      Разошлась по каналам об инфографике.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
