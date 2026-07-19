import { readFile, writeFile } from 'node:fs/promises';

const readmeUrl = 'https://raw.githubusercontent.com/tripleguard/Vera/main/README.md';
const localReadmePath = process.env.VERA_README_PATH;

const markdown = localReadmePath
  ? await readFile(localReadmePath, 'utf8')
  : await fetchRemoteReadme();
const tests = markdown.match(/tests-(\d+)%20passing/i)?.[1] ?? markdown.match(/Покрытие \((\d+) тест/i)?.[1];
const coverage = markdown.match(/Покрытие \((\d+) тест(?:а|ов)?(?: и (\d+) subtests?)?/i);

if (!tests) {
  throw new Error('Could not find tests count in README');
}

const html = await readText('index.html');
const assetVersion = html.match(/styles\.css\?v=(\d+)/)?.[1] ?? '1';
const nextHtml = html
  .replace(/\d+\s+tests/g, `${tests} tests`)
  .replace(/README указано \d+ тест(?:а|ов)?/g, `README указано ${formatRussianTests(tests)}`)
  .replace(/Бейдж README показывает \d+ passing/g, `Бейдж README показывает ${tests} passing`)
  .replace(
    /\d+ тест(?:а|ов)? и \d+ subtests?/g,
    coverage ? `${formatRussianTests(coverage[1])}${coverage[2] ? ` и ${coverage[2]} subtests` : ''}` : formatRussianTests(tests),
  );

await writeFile('index.html', nextHtml);
await writeFile('upstream-readme.md', markdown);
await writeFile('readme.html', renderReadme(markdown, tests, assetVersion));

async function readText(path) {
  return readFile(path, 'utf8');
}

async function fetchRemoteReadme() {
  const response = await fetch(readmeUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch README: ${response.status} ${response.statusText}`);
  }
  return response.text();
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

function formatRussianTests(value) {
  const count = Number(value);
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${value} тест`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${value} теста`;
  return `${value} тестов`;
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

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (line.trim().startsWith('|') && isTableSeparator(lines[index + 1] ?? '')) {
      closeList();
      const headers = parseTableRow(line);
      const rows = [];
      index += 2;

      while (index < lines.length && lines[index].trim().startsWith('|')) {
        rows.push(parseTableRow(lines[index]));
        index += 1;
      }

      index -= 1;
      body.push(
        '<div class="docs-table-wrap"><table class="docs-table">',
        `<thead><tr>${headers.map((cell) => `<th>${inlineMarkdown(cell)}</th>`).join('')}</tr></thead>`,
        `<tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${inlineMarkdown(cell)}</td>`).join('')}</tr>`).join('')}</tbody>`,
        '</table></div>',
      );
      continue;
    }

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
      body.push(`<h${level} id="${headingId(heading[2])}">${inlineMarkdown(heading[2])}</h${level}>`);
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

function parseTableRow(line) {
  return line
    .trim()
    .replace(/^\|/, '')
    .replace(/\|$/, '')
    .split('|')
    .map((cell) => cell.trim());
}

function isTableSeparator(line) {
  const cells = parseTableRow(line);
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell.replaceAll(' ', '')));
}

function headingId(value) {
  return value
    .toLowerCase()
    .replace(/[`*]/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');
}
