// Browser walk: promises E1-E5 from plan/PLAN.md.
// Builds nothing; run `npm run build` first. Starts `vite preview`, stubs /api/wombat,
// and walks a full crossing as a stranger would, at phone and laptop size.
// SHOTS=dir saves a screenshot of every page.
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { chromium, devices } = require('playwright');

const PORT = 4173;
const BASE = `http://127.0.0.1:${PORT}`;
const SHOTS = process.env.SHOTS || '';
if (SHOTS) mkdirSync(SHOTS, { recursive: true });

const CANNED = {
    customs: 'Customs found: one person who wants to be thanked, wrapped in a complaint about plates.',
    xray: 'Reading: 8/10. Mostly clean. One “but” trying to sneak through in the side pocket.',
    inspection: 'FINDINGS\nBoth steelmans were honest.\nTHE REAL DISPUTE\nNobody says thank you.\nOFFICER’S RECOMMENDATION\nA sticky note on the dishwasher.',
    wager: 'I bet on Alternate nights at 3 to 1. Paper plates is a surrender, not a plan.',
    brainstorm: '1. Alternate nights.\n2. Pan rack.\n3. Thank-you tax.\n4. Timer.\n5. Takeout Fridays.',
    incident: 'Put the phone face down and both drink a glass of water. Nobody has ever won a fight while thirsty.'
};

const fails = [];
const check = (ok, what) => {
    if (!ok) fails.push(what);
    console.log(`${ok ? 'PASS' : 'FAIL'}  ${what}`);
};

async function waitForServer() {
    for (let i = 0; i < 50; i++) {
        try {
            const r = await fetch(BASE);
            if (r.ok) return;
        } catch {
            /* not up yet */
        }
        await new Promise((r) => setTimeout(r, 200));
    }
    throw new Error('preview server never came up');
}

async function walk(browser, label, ctxOpts, mode) {
    const ctx = await browser.newContext({ ...ctxOpts, serviceWorkers: 'block' });
    const page = await ctx.newPage();
    page.setDefaultTimeout(8000);
    const errors = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.route('**/api/wombat', async (route) => {
        if (mode === 'closed') return route.fulfill({ status: 200, contentType: 'application/json', body: '{"closed":"off_duty"}' });
        const body = JSON.parse(route.request().postData() || '{}');
        await new Promise((r) => setTimeout(r, 150));
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ text: CANNED[body.task] }) });
    });
    let n = 0;
    const shot = async (name) => {
        if (SHOTS) await page.screenshot({ path: `${SHOTS}/${label}-${String(++n).padStart(2, '0')}-${name}.png`, fullPage: true });
    };
    const noSideScroll = async (where) => {
        const w = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        check(w <= 1, `[${label}] no sideways scroll on ${where} (${w}px)`);
    };
    const click = (name) => page.getByRole('button', { name, exact: false }).first().click();
    const step = async (who) => {
        await page.getByRole('button', { name: `I am ${who}. Step forward.` }).click();
    };

    try {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await shot('front-desk');
    await noSideScroll('front desk');
    check(await page.getByText('No stamps yet').isVisible(), `[${label}] empty archive says so`);

    // refusal: blank names
    await click('Approach the border');
    check(await page.getByText('REFUSED').first().isVisible(), `[${label}] blank form is refused in-world`);

    await page.fill('#name-a', 'Ana');
    await page.fill('#name-b', 'Jordan');
    await page.fill('#new-dispute', 'Who does the dishes, and whether rinsing counts.');
    await click('Approach the border');

    // 01 dispute: Jordan amends, Ana re-agrees
    await page.getByRole('heading', { name: 'Statement of Dispute' }).waitFor();
    await page.fill('#dispute', 'Who does the dishes on weeknights.');
    await click('File this wording as Jordan');
    await shot('dispute');
    await click('Ana agrees');

    // 02 declare, private, with a sniffer hit
    await page.getByText('Now serving').waitFor();
    await shot('curtain');
    await noSideScroll('curtain');
    await step('Ana');
    await page.getByLabel('Receipts').check();
    await page.fill('#declaration', "You always leave the pans. I'm just saying.");
    check(await page.getByText('K-9 unit alerted (2)').isVisible(), `[${label}] sniffer dog flags two phrases offline`);
    await shot('declare');
    await noSideScroll('declare');
    await click('Seal declaration');
    await step('Jordan');
    await page.fill('#declaration', 'I cook every night and my back hurts by the time the pans are dirty.');
    await click('Seal declaration');

    // 03 findings
    await page.getByRole('heading', { name: 'Customs Findings' }).waitFor();
    if (mode === 'closed') {
        await page.getByText('CUSTOMS CLOSED').first().waitFor();
        check(true, `[${label}] closed customs says so honestly`);
    } else {
        await page.getByText('Customs found: one person').first().waitFor();
        check(!(await page.getByText('You always leave the pans').isVisible()), `[${label}] raw declarations stay sealed`);
    }
    await shot('findings');
    await click('Proceed to visa applications');

    // 04 visas, Ana x-rays first
    await step('Ana');
    await page.fill('#visa', 'I cook every night and by the time the pans are dirty my back is done. I want that counted.');
    await click('X-ray it first');
    await page.getByText(mode === 'closed' ? 'CUSTOMS CLOSED' : 'Reading: 8/10').first().waitFor();
    await shot('visa');
    await noSideScroll('visa');
    await click('Submit application');
    await step('Jordan');
    await page.fill('#visa', 'You never notice me.');
    await click('Submit application');

    // 05 stamps: Jordan admits Ana; Ana denies Jordan (needs a note)
    // Jordan still holds the phone after writing, so no hand-over here.
    await page.getByRole("heading", { name: "Entry Decision" }).waitFor();
    if (mode !== 'closed') check(await page.getByText('Customs X-ray:').isVisible(), `[${label}] the judge sees the X-ray reading`);
    await shot('stamp');
    await click('ADMIT');
    await step('Ana');
    await click('DENY');
    await click('Stamp DENIED');
    check(await page.getByText('A denial needs a reason').isVisible(), `[${label}] a denial without a reason is refused`);
    await page.fill('#deny-note', 'That is your complaint, not my side. I want to be thanked, not noticed.');
    await click('Stamp DENIED');
    await page.getByText('is refused entry').waitFor();
    await shot('slam-denied');

    // rewrite
    await step('Jordan');
    check(await page.getByText('ENTRY DENIED').isVisible(), `[${label}] the denied writer sees the stamp and the note`);
    await shot('denied');
    await page.fill('#visa', 'I do the dishes most nights and nobody says thank you. I want it noticed out loud.');
    await click('Submit application');
    await step('Ana');
    await click('ADMIT');

    // E3: reload mid-crossing resumes
    await page.getByRole('heading', { name: 'Inspection Report' }).waitFor();
    await page.reload();
    await page.getByRole('heading', { name: 'Inspection Report' }).waitFor();
    check(true, `[${label}] a reload resumes on the same page`);
    await page.getByText(mode === 'closed' ? 'CUSTOMS CLOSED' : 'THE REAL DISPUTE').first().waitFor();
    await shot('inspection');
    await click('Open treaty talks');

    // 07 propose, 08 readback
    await step('Ana');
    await page.fill('#proposal', 'Alternate nights. Whoever cooks does not wash.');
    await click('Table it');
    await step('Jordan');
    await page.fill('#proposal', 'Paper plates on weeknights.');
    await click('Table it');
    await step('Ana');
    await page.fill('#readback', 'Jordan wants weeknights to cost zero effort.');
    await click('File read-back');
    await step('Jordan');
    await page.fill('#readback', 'Ana wants the cook excused from washing.');
    await shot('readback');
    await click('File read-back');

    // 09 wager
    await page.getByRole('heading', { name: 'The Officer’s Wager' }).waitFor();
    await page.getByText(mode === 'closed' ? 'CUSTOMS CLOSED' : '3 to 1').first().waitFor();
    await shot('wager');
    await click('Draft the treaty');

    // 10 treaty
    await click('Stuck? Ask the officer');
    await page.getByText(mode === 'closed' ? 'CUSTOMS CLOSED' : 'Thank-you tax').first().waitFor();
    await page.fill('#treaty', '1. Alternate nights.\n2. The cook never washes.\n3. Say thank you out loud.');
    await click('File & sign as Ana');
    await click('Sign as Jordan');

    // 11 ratified
    await page.getByRole('heading', { name: 'Ratified Treaty' }).waitFor();
    check(await page.getByText('Ana: 1 try, Jordan: 2 tries').isVisible(), `[${label}] treaty records the visa attempts`);
    check(await page.getByText('Opens').isVisible(), `[${label}] treaty review shows its opening date`);
    await shot('ratified');
    await noSideScroll('treaty');

    // hotline
    await click('Diplomatic incident');
    await page.getByText(mode === 'closed' ? 'CUSTOMS CLOSED' : 'glass of water').first().waitFor();
    await shot('hotline');
    await click('Hang up');

    // archive
    await page.getByRole('button', { name: /Border Control/ }).click();
    check(await page.getByText('RATIFIED').first().isVisible(), `[${label}] archive lists the ratified crossing`);
    await shot('archive');

    } catch (e) {
        await page.screenshot({ path: `${SHOTS || '.'}/${label}-FAILED.png`, fullPage: true });
        check(false, `[${label}] walk stopped: ${String(e).split('\n')[0]}`);
    }
    check(errors.length === 0, `[${label}] no console errors${errors.length ? ': ' + errors.join(' | ') : ''}`);
    await ctx.close();
}

const VITE_BIN = fileURLToPath(new URL('../../node_modules/vite/bin/vite.js', import.meta.url));
const server = spawn(process.execPath, [VITE_BIN, 'preview', '--port', String(PORT), '--strictPort', '--host', '127.0.0.1'], {
    stdio: 'ignore'
});
try {
    await waitForServer();
    const browser = await chromium.launch();
    await walk(browser, 'laptop', { viewport: { width: 1280, height: 860 } }, 'open');
    await walk(browser, 'phone', { ...devices['iPhone 13'] }, 'open');
    await walk(browser, 'closed', { viewport: { width: 1280, height: 860 } }, 'closed');
    await browser.close();
} finally {
    server.kill();
}
console.log(fails.length ? `\n${fails.length} FAILED` : '\nALL PASSED');
process.exit(fails.length ? 1 : 0);
