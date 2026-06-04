'use client'

import { useEffect, useRef, useState } from 'react'

const SERVICES = [
  {
    icon: '🔍',
    title: 'Аудит дашбордов',
    desc: 'Разберу существующие визуализации: найду проблемы с читаемостью, манипуляции данными и ошибки UX. Дам конкретные рекомендации по исправлению.',
    tags: ['Дашборды', 'UX', 'Ревью'],
    color: 'var(--teal)',
    bg: 'var(--teal-light)',
  },
  {
    icon: '📊',
    title: 'Проектная работа',
    desc: 'Создам датавизуализацию с нуля: инфографику, интерактивные дашборды, отчёты для презентаций. От постановки задачи до финального результата.',
    tags: ['Инфографика', 'Tableau', 'Redash'],
    color: 'var(--purple)',
    bg: 'var(--purple-light)',
  },
  {
    icon: '🎓',
    title: 'Лекции и воркшопы',
    desc: 'Провожу обучение для команд: принципы хорошего датавиза, построение дашбордов и системы отчетности.',
    tags: ['Обучение', 'A/B-тесты', 'BI-культура'],
    color: 'var(--orange)',
    bg: 'var(--orange-light)',
  },
  {
    icon: '💬',
    title: 'Консультации',
    desc: 'Помогу разобраться с конкретной задачей по визуализации данных: выбор типа графика, цветовые схемы, структура дашборда, подготовка к презентации.',
    tags: ['1:1', 'Быстро', 'Конкретно'],
    color: 'var(--pink)',
    bg: '#FEE2F8',
  },
]

const FAQ = [
  {
    q: 'Работаете ли вы с командами вне Авито?',
    a: 'Да, беру проекты на фрилансе. Пишите в Телеграм — обсудим задачу и договоримся о формате.',
  },
  {
    q: 'В каких инструментах умеете работать?',
    a: 'Tableau, Redash, Python (matplotlib, seaborn, plotly), Figma для инфографики. Могу адаптироваться под ваш стек.',
  },
  {
    q: 'Как выглядит процесс работы?',
    a: 'Созвон-бриф → предложение подхода → итерации с фидбеком → финальный результат.',
  },
]

export default function Collab() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('opacity-100', 'translate-y-0')
          e.target.classList.remove('opacity-0', 'translate-y-8')
        }
      }),
      { threshold: 0.1 }
    )
    const els = sectionRef.current?.querySelectorAll('.fade-in')
    els?.forEach(el => observer.observe(el))
    return () => observer.disconnect()
  }, [])

  return (
    <section id="collab" ref={sectionRef} className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="fade-in opacity-0 translate-y-8 transition-all duration-700 mb-16 max-w-2xl">
          <div
            className="text-xs font-bold tracking-widest uppercase mb-3"
            style={{ color: 'var(--teal-dark)' }}
          >
            Сотрудничество
          </div>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4">
            Чем могу помочь
          </h2>
          <p className="text-lg text-gray-500 leading-relaxed">
            Помогаю командам и компаниям делать данные понятными — через хорошие
            визуализации, обучение и аудит существующих дашбордов.
          </p>
        </div>

        {/* Services grid */}
        <div className="grid sm:grid-cols-2 gap-5 mb-16">
          {SERVICES.map((s, i) => (
            <div
              key={i}
              className="fade-in opacity-0 translate-y-8 transition-all duration-700 group p-6 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-lg hover:-translate-y-1 bg-white cursor-default"
              style={{ transitionDelay: `${i * 80}ms` }}
            >
              {/* Icon */}
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-4"
                style={{ background: s.bg }}
              >
                {s.icon}
              </div>

              <h3 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed mb-4">{s.desc}</p>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5">
                {s.tags.map(tag => (
                  <span
                    key={tag}
                    className="text-xs font-medium px-2.5 py-1 rounded-full"
                    style={{ background: s.bg, color: s.color }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* FAQ + CTA */}
        <div className="grid md:grid-cols-2 gap-10 items-start">
          {/* FAQ */}
          <div className="fade-in opacity-0 translate-y-8 transition-all duration-700">
            <div
              className="text-xs font-bold tracking-widest uppercase mb-5"
              style={{ color: 'var(--teal-dark)' }}
            >
              Частые вопросы
            </div>
            <div className="space-y-3">
              {FAQ.map((item, i) => (
                <div
                  key={i}
                  className="border border-gray-100 rounded-xl overflow-hidden"
                >
                  <button
                    className="w-full text-left px-5 py-4 flex items-center justify-between gap-3 hover:bg-gray-50 transition-colors"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span className="font-medium text-sm text-gray-800">{item.q}</span>
                    <span
                      className="text-gray-400 text-lg leading-none flex-shrink-0 transition-transform"
                      style={{ transform: openFaq === i ? 'rotate(45deg)' : 'none' }}
                    >
                      +
                    </span>
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-4 text-sm text-gray-500 leading-relaxed border-t border-gray-50 pt-3">
                      {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* CTA card */}
          <div
            className="fade-in opacity-0 translate-y-8 transition-all duration-700 delay-100 p-8 rounded-2xl text-white"
            style={{ background: 'linear-gradient(135deg, var(--teal-dark), #0A6663)' }}
          >
            <div className="text-3xl mb-4">✉️</div>
            <h3 className="text-xl font-bold mb-3">Обсудим вашу задачу?</h3>
            <p className="text-white/75 text-sm leading-relaxed mb-6">
              Напишите в Телеграм — расскажите, что нужно сделать.
            </p>
            <a
              href="https://t.me/mozzalerra"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-white text-sm font-bold px-6 py-3 rounded-xl hover:-translate-y-0.5 transition-all hover:shadow-lg"
              style={{ color: 'var(--teal-dark)' }}
            >
              ✈️ Написать @mozzalerra
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

