import { writeFile } from 'node:fs/promises';

const readmeUrl = 'https://raw.githubusercontent.com/tripleguard/Vera/main/README.md';

const response = await fetch(readmeUrl);
if (!response.ok) {
  throw new Error(`Failed to fetch README: ${response.status} ${response.statusText}`);
}

const markdown = await response.text();
const tests = markdown.match(/tests-(\d+)%20passing/i)?.[1] ?? markdown.match(/Покрытие \((\d+) тест/i)?.[1];

if (!tests) {
  throw new Error('Could not find tests count in README');
}

const html = await readText('index.html');
const assetVersion = html.match(/styles\.css\?v=(\d+)/)?.[1] ?? '1';
const nextHtml = html
  .replace(/\d+\s+tests/g, `${tests} tests`)
  .replace(/README указано \d+ тест(?:а|ов)?/g, `README указано ${tests} тестов`);

await writeFile('index.html', nextHtml);
await writeFile('upstream-readme.md', markdown);
await writeFile('readme.html', renderReadme(markdown, tests, assetVersion));

async function readText(path) {
  const { readFile } = await import('node:fs/promises');
  return readFile(path, 'utf8');
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function inlineMarkdown(value) {
  return escapeHtml(value)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer">$1</a>');
}

function renderReadme(markdownText, testsCount, assetVersion) {
  const lines = markdownText.split(/\r?\n/);
  const body = [];
  let inCode = false;
  let code = [];
  let inList = false;

  const closeList = () => {
    if (inList) {
      body.push('</ul>');
      inList = false;
    }
  };

  for (const line of lines) {
    if (line.startsWith('```')) {
      if (inCode) {
        body.push(`<div class="code-wrap"><pre class="code-block"><code>${escapeHtml(code.join('\n'))}</code></pre></div>`);
        code = [];
      } else {
        closeList();
      }
      inCode = !inCode;
      continue;
    }

    if (inCode) {
      code.push(line);
      continue;
    }

    if (!line.trim()) {
      closeList();
      continue;
    }

    if (line.startsWith('![') || line.startsWith('<a ') || line.startsWith('<picture') || line.startsWith('<source') || line.startsWith('<img') || line.startsWith('</picture') || line.startsWith('</a>')) {
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      closeList();
      const level = Math.min(heading[1].length, 3);
      body.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }

    if (line.startsWith('- ')) {
      if (!inList) {
        body.push('<ul>');
        inList = true;
      }
      body.push(`<li>${inlineMarkdown(line.slice(2))}</li>`);
      continue;
    }

    closeList();
    body.push(`<p>${inlineMarkdown(line)}</p>`);
  }

  closeList();

  return `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Vera README</title>
  <meta name="description" content="Автоматически синхронизированная HTML-версия README Vera.">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="./styles.css?v=${assetVersion}">
</head>
<body>
  <main class="docs-shell container readme-shell">
    <article class="docs-content">
      <p class="section-kicker">[ upstream README / ${testsCount} tests ]</p>
      ${body.join('\n      ')}
    </article>
  </main>
  <script src="./script.js?v=${assetVersion}"></script>
</body>
</html>
`;
}
