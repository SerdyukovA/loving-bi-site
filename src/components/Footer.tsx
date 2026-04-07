export default function Footer() {
  return (
    <footer
      className="py-12 border-t border-gray-100"
      style={{ background: '#F7F7F5' }}
    >
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="font-bold text-gray-900 mb-1">Любовь, BI и графики</div>
            <div className="text-sm text-gray-400">
              Канал Валерии Смирновой — Senior BI-аналитика в Авито
            </div>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="https://t.me/loving_bi"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              ✈️ @loving_bi
            </a>
            <a
              href="https://t.me/mozzalerra"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
            >
              @mozzalerra
            </a>
          </div>
        </div>
        <div className="mt-8 pt-6 border-t border-gray-100 text-center text-xs text-gray-300">
          Данные постов загружены автоматически из открытого Telegram-канала
        </div>
      </div>
    </footer>
  )
}
