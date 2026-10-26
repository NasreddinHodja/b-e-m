import { expect, test, type Page } from '@playwright/test';

// The production build on the local backend: signed in from the start, data in localStorage.

const VIEWS = [
  ['acordes', 'Acorde atual'],
  ['intervalos', 'Intervalo atual'],
  ['ditado', 'Configuração'],
  ['contraponto', 'Conferidor de contraponto'],
  ['regua', 'RÉGUA DE'],
  ['harmonia-3d', 'Harmonia Geométrica'],
  ['apreciacao', 'Playlist'],
  ['afinador', 'Afinador Cromático'],
  ['pratica', 'Os 10 Pilares'],
  ['metronomo', 'Metrônomo'],
  ['manifesto', 'Manifesto'],
  ['historico', 'Histórico completo']
] as const;

/** Collect console errors, uncaught exceptions and failed responses. */
function watchErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('response', (r) => {
    if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
  });
  page.on('console', (m) => {
    const url = m.location().url;
    // The Spotify embed's own errors aren't the app's, and the app has no favicon (nor had the
    // legacy page): Chromium's request for one 404s.
    if (m.type() !== 'error' || url.includes('spotify') || url.endsWith('/favicon.ico')) return;
    errors.push(`${m.text()} ${url}`);
  });
  return errors;
}

const sidebar = (page: Page) => page.locator('aside');
const badge = (page: Page, label: string) =>
  sidebar(page)
    .getByRole('link', { name: new RegExp(label) })
    .locator('span')
    .last();

test('every view opens without errors', async ({ page }) => {
  const errors = watchErrors(page);
  await page.goto('/');
  await expect(page).toHaveURL(/\/acordes$/);
  for (const [path, text] of VIEWS) {
    await sidebar(page).locator(`a[href$="/${path}"]`).click();
    await expect(page).toHaveURL(new RegExp(`/${path}$`));
    await expect(page.locator('main')).toContainText(text, { ignoreCase: true });
  }
  expect(errors).toEqual([]);
});

test('Acordes scores a guess and a function', async ({ page }) => {
  await page.goto('/acordes');
  const guess = page.locator('main .grid').filter({ hasText: 'Bb' }).first().getByRole('button');
  await guess.first().click();
  await expect(page.locator('main')).toContainText(/Acorde correto!|Era /);
  await expect(badge(page, 'Acordes')).toHaveText(/^[01]\/1$/);

  await page.getByRole('button', { name: 'b3', exact: true }).click();
  await page.getByRole('button', { name: 'Verificar função' }).click();
  await expect(page.locator('main')).toContainText(/Correto!|Errado\./);
  await expect(badge(page, 'Acordes')).toHaveText(/^[012]\/2$/);
  await expect(sidebar(page)).toContainText(/acertos/i);
});

test('Ditado scores a pick and unblurs the staff', async ({ page }) => {
  await page.goto('/ditado');
  await expect(page.getByText('ouça e adivinhe')).toBeVisible();
  await page.locator('main button', { hasText: /^1 – / }).first().click();
  await expect(badge(page, 'Ditado')).toHaveText(/^[01]\/1$/);
  await expect(page.getByText('ouça e adivinhe')).toBeHidden();
  await expect(page.locator('.bg-paper svg')).toBeVisible();
});

test('Contraponto flags a bad note', async ({ page }) => {
  await page.goto('/contraponto');
  await page.getByLabel('Notas de Voz 2').fill('A4 D5 X9');
  await expect(page.locator('main')).toContainText('Notas não reconhecidas: Voz 2 (X9)');
});

test('the journal adds, keeps and deletes an entry', async ({ page }) => {
  await page.goto('/pratica');
  await page.getByPlaceholder('O que eu estudei hoje?').fill('Escalas em Ré');
  await page.getByPlaceholder('Como foi meu estudo hoje?').fill('<b>sem</b> HTML');
  await page.getByRole('button', { name: 'Registrar' }).click();
  await expect(page.locator('main')).toContainText('Escalas em Ré');
  await expect(page.locator('main')).toContainText('<b>sem</b> HTML');

  await page.reload();
  await expect(page.locator('main')).toContainText('Escalas em Ré');
  await page.getByRole('button', { name: 'Apagar registro' }).first().click();
  await expect(page.locator('main')).toContainText('Nenhum registro ainda.');
});

test('signing out goes to the login, signing in comes back', async ({ page }) => {
  await page.goto('/acordes');
  await sidebar(page)
    .getByRole('button', { name: /Sair do App/ })
    .click();
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel('E-mail').fill('aluno@example.com');
  await page.getByLabel('Senha').fill('qualquer');
  await page.getByRole('button', { name: 'Entrar no Sistema' }).click();
  await expect(page).toHaveURL(/\/acordes$/);
});

test('the language toggle switches to English and back, keeping the session', async ({ page }) => {
  await page.goto('/intervalos');
  await page.getByRole('button', { name: /^5ª J\s*7st$/ }).click();
  await page.getByRole('button', { name: 'Verificar', exact: true }).click();
  await expect(badge(page, 'Intervalos')).toHaveText(/^[01]\/1$/);

  await sidebar(page).getByRole('button', { name: 'EN', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(sidebar(page)).toContainText('Intervals');
  await expect(page.locator('main')).toContainText('Current interval');
  await expect(page.locator('main')).toContainText(/✓ Correct!|✗ It was a /);
  // The score survived the switch: no reload.
  await expect(badge(page, 'Intervals')).toHaveText(/^[01]\/1$/);

  await page.reload();
  await expect(sidebar(page)).toContainText('Intervals');

  await sidebar(page).getByRole('button', { name: 'PT', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'pt-BR');
  await expect(page.locator('main')).toContainText('Intervalo atual');
});
