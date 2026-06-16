# Vera Docs

Отдельный статический сайт с документацией Vera для GitHub Pages.

## Файлы

- `index.html` — главная страница документации
- `styles.css` — оформление сайта
- `script.js` — кнопки копирования для кодовых блоков
- `vera.svg` — логотип
- `readme.html` — автоматически сгенерированная HTML-версия README основного репозитория
- `upstream-readme.md` — последняя синхронизированная копия README из `tripleguard/Vera`

## Публикация через GitHub Pages

1. В `Settings -> Pages` выберите `Deploy from a branch`.
2. Укажите branch `main` и папку `/ (root)`.
3. После публикации добавьте custom domain `docs.agentvera.ru`, когда DNS будет готов.

## Синхронизация README

Workflow `.github/workflows/sync-readme.yml` раз в 6 часов и вручную запускает
`scripts/sync-readme.mjs`: он подтягивает актуальный README из `tripleguard/Vera`,
обновляет счётчик тестов в `index.html`, сохраняет `upstream-readme.md` и
генерирует `readme.html` как зеркальную HTML-версию README.
