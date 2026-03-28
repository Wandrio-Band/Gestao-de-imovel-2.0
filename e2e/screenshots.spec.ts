import { test, expect } from '@playwright/test';

const WAIT_MS = 2000;

// Helper: navigate and screenshot
async function screenshotPage(page: any, url: string, name: string, opts?: { fullPage?: boolean }) {
    await page.goto(url);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(WAIT_MS);

    // Check for error state
    const hasError = await page.getByText('Algo deu errado').isVisible().catch(() => false);
    if (hasError) {
        await page.screenshot({ path: `e2e/screenshots/${name}-ERROR.png`, fullPage: true });
    }

    await page.screenshot({
        path: `e2e/screenshots/${name}.png`,
        fullPage: opts?.fullPage ?? true,
    });

    return !hasError;
}

test.describe('Sistema Completo — Screenshots E2E', () => {

    // ═══════════════════════════════════════════════════
    // MÓDULO: Principal
    // ═══════════════════════════════════════════════════

    test('01 — Dashboard', async ({ page }) => {
        const ok = await screenshotPage(page, '/dashboard', '01-dashboard');
        expect(ok).toBe(true);
    });

    test('02 — Ativos (lista)', async ({ page }) => {
        const ok = await screenshotPage(page, '/assets', '02-ativos-lista');
        expect(ok).toBe(true);
    });

    test('03 — Ativos (valores)', async ({ page }) => {
        const ok = await screenshotPage(page, '/assets/values', '03-ativos-valores');
        expect(ok).toBe(true);
    });

    // ═══════════════════════════════════════════════════
    // MÓDULO: Financeiro
    // ═══════════════════════════════════════════════════

    test('04 — Gestão Financeira (Visão Geral)', async ({ page }) => {
        const ok = await screenshotPage(page, '/financial', '04-gestao-financeira');
        expect(ok).toBe(true);
    });

    test('05 — Cronograma Financeiro (com expansão de anos)', async ({ page }) => {
        test.setTimeout(60000);

        await page.goto('/financial/schedule');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(WAIT_MS);

        const hasError = await page.getByText('Algo deu errado').isVisible().catch(() => false);
        expect(hasError).toBe(false);

        // Screenshot viewport
        await page.screenshot({
            path: 'e2e/screenshots/05-cronograma-viewport.png',
        });

        // Screenshot full page
        await page.screenshot({
            path: 'e2e/screenshots/05-cronograma-full.png',
            fullPage: true,
        });

        // Check for bank financing indicators
        const hasBancoLabel = await page.getByText('Banco').first().isVisible().catch(() => false);
        const hasFinanciamentoBadge = await page.getByText('Financiamento').first().isVisible().catch(() => false);
        const hasSACLabel = await page.locator('text=SAC').first().isVisible().catch(() => false);
        const hasLegend = await page.getByText('Financiamento Bancário (Fase 2)').isVisible().catch(() => false);

        console.log(`[Cronograma] Banco: ${hasBancoLabel}, Badge: ${hasFinanciamentoBadge}, SAC: ${hasSACLabel}, Legend: ${hasLegend}`);

        // Scroll down to see more years
        await page.evaluate(() => window.scrollBy(0, 600));
        await page.waitForTimeout(500);

        await page.screenshot({
            path: 'e2e/screenshots/05-cronograma-scrolled.png',
            fullPage: true,
        });
    });

    test('06 — Gestão de Dívida', async ({ page }) => {
        const ok = await screenshotPage(page, '/financial/debt', '06-gestao-divida');
        expect(ok).toBe(true);
    });

    test('07 — Detalhes da Dívida (via clique no ativo)', async ({ page }) => {
        await page.goto('/financial/debt');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(WAIT_MS);

        // Click on the first asset row in the table
        const assetRow = page.locator('tbody tr').first();
        if (await assetRow.isVisible()) {
            await assetRow.click();
            await page.waitForURL('**/financial/debt/details**', { timeout: 5000 }).catch(() => {});
            await page.waitForLoadState('networkidle');
            await page.waitForTimeout(WAIT_MS);

            const hasError = await page.getByText('Algo deu errado').isVisible().catch(() => false);
            expect(hasError).toBe(false);

            await page.screenshot({
                path: 'e2e/screenshots/07-detalhes-divida.png',
                fullPage: true,
            });

            // Try clicking "Painel de Pagamentos"
            const painelBtn = page.getByText('Painel de Pagamentos');
            if (await painelBtn.isVisible().catch(() => false)) {
                await painelBtn.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(WAIT_MS);

                await page.screenshot({
                    path: 'e2e/screenshots/07b-painel-pagamentos.png',
                    fullPage: true,
                });
            }
        }
    });

    test('08 — Financiamento (detalhes/edição + cronograma projetado)', async ({ page }) => {
        test.setTimeout(60000);

        // This page requires selectedAsset, so navigate via debt page first
        await page.goto('/financial/debt');
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(1500);

        // Find the row for Apto 905 (has bank financing data)
        const assetRow = page.locator('tbody tr', { hasText: '905' }).first();
        const fallbackRow = page.locator('tbody tr').first();
        const targetRow = await assetRow.isVisible().catch(() => false) ? assetRow : fallbackRow;
        if (await targetRow.isVisible()) {
            // Click the edit calendar button to go to /financial/details
            const editBtn = targetRow.locator('[title="Ver Cronograma & Edição"]');
            if (await editBtn.isVisible().catch(() => false)) {
                await editBtn.click();
                await page.waitForLoadState('networkidle');
                await page.waitForTimeout(WAIT_MS);

                // Screenshot Modo Edição (default tab)
                await page.screenshot({
                    path: 'e2e/screenshots/08a-financiamento-modo-edicao.png',
                    fullPage: true,
                });

                // Check saldo devedor is not R$ 0,00
                const saldoText = await page.getByText('SALDO DEVEDOR (CONST.)').isVisible().catch(() => false);
                console.log(`[FinDetails] Saldo Devedor label visible: ${saldoText}`);

                // Click "Cronograma Projetado (Desembolso)" tab
                const projTab = page.getByText('Cronograma Projetado (Desembolso)');
                if (await projTab.isVisible().catch(() => false)) {
                    await projTab.click();
                    await page.waitForTimeout(WAIT_MS);

                    // Screenshot Cronograma Projetado
                    await page.screenshot({
                        path: 'e2e/screenshots/08b-cronograma-projetado.png',
                        fullPage: true,
                    });

                    // Check for bank financing indicators
                    const hasBancoLabel = await page.getByText('BANCO').first().isVisible().catch(() => false);
                    const hasBankLegend = await page.getByText('Financiamento Bancário (Fase 2)').isVisible().catch(() => false);
                    const hasSACInfo = await page.locator('text=SAC').first().isVisible().catch(() => false);

                    console.log(`[CronoProjetado] Banco: ${hasBancoLabel}, Legend: ${hasBankLegend}, SAC: ${hasSACInfo}`);

                    // Scroll down to see the table rows with data
                    const tableEl = page.locator('table').first();
                    if (await tableEl.isVisible().catch(() => false)) {
                        await tableEl.scrollIntoViewIfNeeded();
                        await page.waitForTimeout(500);
                    }

                    await page.screenshot({
                        path: 'e2e/screenshots/08c-cronograma-projetado-scrolled.png',
                    });
                }
            }
        }
    });

    // ═══════════════════════════════════════════════════
    // MÓDULO: Relatórios
    // ═══════════════════════════════════════════════════

    test('09 — Central de Relatórios', async ({ page }) => {
        const ok = await screenshotPage(page, '/reports', '09-relatorios');
        expect(ok).toBe(true);
    });

    test('10 — Relatório Individual', async ({ page }) => {
        const ok = await screenshotPage(page, '/reports/individual', '10-relatorio-individual');
        expect(ok).toBe(true);
    });

    // ═══════════════════════════════════════════════════
    // MÓDULO: Operacional
    // ═══════════════════════════════════════════════════

    test('11 — Conciliação Bancária', async ({ page }) => {
        const ok = await screenshotPage(page, '/conciliacao', '11-conciliacao');
        expect(ok).toBe(true);
    });

    test('12 — Reajustes de Aluguel', async ({ page }) => {
        const ok = await screenshotPage(page, '/adjustments', '12-reajustes');
        expect(ok).toBe(true);
    });

    test('13 — Notas Fiscais', async ({ page }) => {
        const ok = await screenshotPage(page, '/invoices', '13-notas-fiscais');
        expect(ok).toBe(true);
    });

    test('14 — Inquilinos', async ({ page }) => {
        const ok = await screenshotPage(page, '/tenants', '14-inquilinos');
        expect(ok).toBe(true);
    });

    test('15 — Contratos', async ({ page }) => {
        const ok = await screenshotPage(page, '/contracts', '15-contratos');
        expect(ok).toBe(true);
    });

    test('16 — Sócios & Cotas', async ({ page }) => {
        const ok = await screenshotPage(page, '/partners', '16-socios-cotas');
        expect(ok).toBe(true);
    });

    // ═══════════════════════════════════════════════════
    // MÓDULO: IA e Outros
    // ═══════════════════════════════════════════════════

    test('17 — Assistente IA', async ({ page }) => {
        const ok = await screenshotPage(page, '/ai-assistant', '17-assistente-ia');
        expect(ok).toBe(true);
    });

    test('18 — Simulações', async ({ page }) => {
        const ok = await screenshotPage(page, '/simulations', '18-simulacoes');
        expect(ok).toBe(true);
    });

    test('19 — Documentos', async ({ page }) => {
        const ok = await screenshotPage(page, '/documents', '19-documentos');
        expect(ok).toBe(true);
    });

    test('20 — Logs de Auditoria', async ({ page }) => {
        const ok = await screenshotPage(page, '/system-audit', '20-auditoria');
        expect(ok).toBe(true);
    });
});
