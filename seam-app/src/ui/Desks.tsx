import { useEffect, useState } from 'react';
import type { Action, Crossing, Finding, Side } from '../../contracts/crossing';
import { latestVisa, other, whoIsUp } from '../core/rules';
import { FindingSlip, FormField, Stamp, fmtDate } from './bits';

export interface DeskProps {
    c: Crossing;
    act: (a: Action) => string | null;
    runAi: (kind: 'inspection' | 'wager' | 'brainstorm' | 'customsA' | 'customsB') => void;
    xray: (side: Side, text: string) => Promise<Finding>;
    busy: Set<string>;
}

const DECLARE_ITEMS = [
    'Grievances older than 30 days',
    '“I’m fine” (a lie)',
    'Receipts',
    'Your mother’s opinion',
    'Something a friend said about them',
    'A score you are keeping',
    'Undisclosed tiredness',
    'A screenshot'
];

function ErrorLine({ msg }: { msg: string | null }) {
    return msg ? (
        <p className="refused" role="alert">
            <Stamp kind="denied" small tilt={-3}>
                REFUSED
            </Stamp>{' '}
            {msg}
        </p>
    ) : null;
}

function DisputeBox({ c }: { c: Crossing }) {
    return (
        <div className="dispute-box">
            <span className="tag">The dispute on record</span>
            <p>{c.dispute.text}</p>
        </div>
    );
}

/** Page 01: both travellers agree on one neutral sentence. */
export function DisputeDesk({ c, act }: DeskProps) {
    const [draft, setDraft] = useState(c.dispute.text);
    const [err, setErr] = useState<string | null>(null);
    useEffect(() => setDraft(c.dispute.text), [c.dispute.text]);
    const changed = draft.trim() !== c.dispute.text;
    return (
        <>
            <p className="officer-line">
                “One sentence. Neutral. Written like a boring robot filed it. If either of you changes a word, the
                other one has to agree again.”
            </p>
            <FormField id="dispute" label="The dispute, as filed" value={draft} onChange={setDraft} rows={3} />
            <div className="two-col">
                {(['A', 'B'] as const).map((s) => (
                    <div className="sign-box" key={s}>
                        <span className="tag">{c.names[s]}</span>
                        {c.dispute.agreed[s] && !changed ? (
                            <Stamp kind="admitted" small>
                                AGREED
                            </Stamp>
                        ) : changed ? (
                            <button
                                type="button"
                                className="btn"
                                onClick={() => setErr(act({ type: 'EDIT_DISPUTE', by: s, text: draft }))}
                            >
                                File this wording as {c.names[s]}
                            </button>
                        ) : (
                            <button type="button" className="btn" onClick={() => setErr(act({ type: 'AGREE_DISPUTE', by: s }))}>
                                {c.names[s]} agrees
                            </button>
                        )}
                    </div>
                ))}
            </div>
            <ErrorLine msg={err} />
        </>
    );
}

/** Page 04: private customs declaration, one traveller at a time, only after your visa was admitted. */
export function DeclareDesk({ c, act, runAi }: DeskProps) {
    const me = whoIsUp(c) as Side;
    const [text, setText] = useState('');
    const [items, setItems] = useState<string[]>([]);
    const [err, setErr] = useState<string | null>(null);
    const toggle = (i: string) => setItems((xs) => (xs.includes(i) ? xs.filter((x) => x !== i) : [...xs, i]));
    return (
        <>
            <DisputeBox c={c} />
            <div className="admitted-banner">
                <Stamp kind="admitted" small tilt={-7}>
                    ADMITTED
                </Stamp>
                <span>Entry granted by {c.names[other(me)]}. Your bag is released.</span>
            </div>
            <p className="officer-line">
                “{c.names[me]}, {c.names[other(me)]} stamped your visa, so you’ve earned this: your own side. This form is
                private. {c.names[other(me)]} never sees it. Say it the way you’d say it to your best friend in the car.”
            </p>
            <fieldset className="checks">
                <legend>Do you have anything to declare?</legend>
                {DECLARE_ITEMS.map((i) => (
                    <label key={i} className="check">
                        <input type="checkbox" checked={items.includes(i)} onChange={() => toggle(i)} />
                        <span>{i}</span>
                    </label>
                ))}
            </fieldset>
            <FormField
                id="declaration"
                label={`Declaration of ${c.names[me]}`}
                hint="Your side, unfiltered. It stays sealed."
                value={text}
                onChange={setText}
                rows={6}
            />
            <button
                type="button"
                className="btn btn-big"
                onClick={() => {
                    const e = act({ type: 'DECLARE', by: me, text, items });
                    setErr(e);
                    if (!e) runAi(me === 'A' ? 'customsA' : 'customsB');
                }}
            >
                Seal declaration
            </button>
            <ErrorLine msg={err} />
        </>
    );
}

/** Page 05: what customs found in both bags. The raw declarations stay sealed. */
export function FindingsDesk({ c, act, runAi, busy }: DeskProps) {
    return (
        <>
            <DisputeBox c={c} />
            <p className="officer-line">“Both bags went through. I don’t show anyone the contents. I show what I found.”</p>
            <div className="two-col">
                {(['A', 'B'] as const).map((s) => (
                    <div key={s} className="bag">
                        <div className="bag-tag">
                            <span>Bag of {c.names[s]}</span>
                            <Stamp kind="customs" small tilt={6}>
                                SEALED
                            </Stamp>
                        </div>
                        {(c.declarations[s]?.items.length ?? 0) > 0 && (
                            <p className="declared">Declared: {c.declarations[s]!.items.join(' · ')}</p>
                        )}
                        <FindingSlip
                            label="Customs found"
                            finding={c.declarations[s]?.finding}
                            loading={busy.has(s === 'A' ? 'customsA' : 'customsB')}
                            onRetry={() => runAi(s === 'A' ? 'customsA' : 'customsB')}
                        />
                    </div>
                ))}
            </div>
            <button type="button" className="btn btn-big" onClick={() => act({ type: 'ADVANCE', from: 'findings' })}>
                Proceed to inspection
            </button>
        </>
    );
}

/** Page 02: the steelman, before you have said a word of your own side. Apply for entry to the other side by stating their case. */
export function VisaDesk({ c, act, xray }: DeskProps) {
    const me = whoIsUp(c) as Side;
    const them = other(me);
    const prev = latestVisa(c, me);
    const [text, setText] = useState('');
    const [scan, setScan] = useState<Finding | undefined>();
    const [scanning, setScanning] = useState(false);
    const [scannedText, setScannedText] = useState('');
    const [err, setErr] = useState<string | null>(null);
    return (
        <>
            <DisputeBox c={c} />
            <p className="officer-line">
                “{c.names[me]}, you want into the Republic of {c.names[them]}. Entry requires one thing: state{' '}
                {c.names[them]}’s side so well that {c.names[them]} would sign it. Not agree with it. Sign it.”
            </p>
            {!prev && (
                <div className="held-tag">
                    <Stamp kind="pending" small tilt={-5}>
                        HELD
                    </Stamp>
                    <p>
                        <b>Your own side waits.</b> Your bag stays at the border. Customs won’t take your declaration
                        until {c.names[them]} admits you.
                    </p>
                </div>
            )}
            {prev?.verdict === 'denied' && (
                <div className="denied-card">
                    <Stamp kind="denied" tilt={-6}>
                        ENTRY DENIED
                    </Stamp>
                    <p>
                        <b>{c.names[them]} wrote:</b> “{prev.note}”
                    </p>
                    <p className="small">Application {c.visas[me].length} was refused. Try again with that in mind.</p>
                </div>
            )}
            <FormField
                id="visa"
                label={`Visa application: the case for ${c.names[them]}`}
                hint={`Write it as ${c.names[them]}’s best lawyer. First person helps: “I feel…”, “What I need is…”.`}
                value={text}
                onChange={setText}
                rows={7}
                placeholder={`If I were ${c.names[them]}, I’d say…`}
            />
            {(scanning || scan) && (
                <FindingSlip label="X-ray: smuggled complaints" finding={scan} loading={scanning} />
            )}
            {scan && scannedText !== text && <p className="small">You changed it since the X-ray. The scan is for the old text.</p>}
            <div className="row">
                <button
                    type="button"
                    className="btn btn-ghost"
                    disabled={scanning || !text.trim()}
                    onClick={async () => {
                        setScanning(true);
                        setScannedText(text);
                        setScan(await xray(me, text));
                        setScanning(false);
                    }}
                >
                    {scanning ? 'Scanning…' : 'X-ray it first'}
                </button>
                <button
                    type="button"
                    className="btn btn-big"
                    onClick={() => {
                        const e = act({ type: 'SUBMIT_VISA', by: me, text });
                        setErr(e);
                        if (!e && scan && scannedText === text) act({ type: 'SET_XRAY', by: me, finding: scan });
                    }}
                >
                    Submit application
                </button>
            </div>
            <ErrorLine msg={err} />
        </>
    );
}

/** Page 03: the other traveller stamps the application. Only they can admit you. */
export function StampDesk({ c, act }: DeskProps) {
    const judge = whoIsUp(c) as Side;
    const writer = other(judge);
    const v = latestVisa(c, writer)!;
    const [note, setNote] = useState('');
    const [denying, setDenying] = useState(false);
    const [err, setErr] = useState<string | null>(null);
    return (
        <>
            <p className="officer-line">
                “{c.names[judge]}, {c.names[writer]} is trying to enter your republic. This is their statement of your
                side. You are the only one who can stamp it. Would you sign this as your own position?”
            </p>
            <div className="application">
                <span className="tag">
                    Application no. {c.visas[writer].length} from {c.names[writer]}
                </span>
                <p className="application-text">{v.text}</p>
                {v.xray?.status === 'ok' && (
                    <p className="xray-note">
                        <b>Customs X-ray:</b> {v.xray.text}
                    </p>
                )}
            </div>
            {!denying ? (
                <div className="row">
                    <button
                        type="button"
                        className="btn btn-admit"
                        onClick={() => setErr(act({ type: 'STAMP', by: judge, verdict: 'admitted' }))}
                    >
                        ADMIT: that’s my side
                    </button>
                    <button type="button" className="btn btn-deny" onClick={() => setDenying(true)}>
                        DENY: not quite
                    </button>
                </div>
            ) : (
                <>
                    <FormField
                        id="deny-note"
                        label="Reason for refusal"
                        hint={`What did ${c.names[writer]} miss or twist? They’ll see exactly this.`}
                        value={note}
                        onChange={setNote}
                        rows={3}
                    />
                    <div className="row">
                        <button type="button" className="btn btn-ghost" onClick={() => setDenying(false)}>
                            Back
                        </button>
                        <button
                            type="button"
                            className="btn btn-deny"
                            onClick={() => setErr(act({ type: 'STAMP', by: judge, verdict: 'denied', note }))}
                        >
                            Stamp DENIED
                        </button>
                    </div>
                </>
            )}
            <ErrorLine msg={err} />
        </>
    );
}

/** Page 06: the inspection report. */
export function InspectionDesk({ c, act, runAi, busy }: DeskProps) {
    useEffect(() => {
        if (!c.inspection && !busy.has('inspection')) runAi('inspection');
    }, []);
    return (
        <>
            <DisputeBox c={c} />
            <div className="two-col">
                {(['A', 'B'] as const).map((s) => (
                    <div key={s} className="sign-box">
                        <span className="tag">{c.names[s]}</span>
                        <Stamp kind="admitted" small tilt={s === 'A' ? -7 : 5}>
                            ADMITTED · TRY {c.visas[s].length}
                        </Stamp>
                    </div>
                ))}
            </div>
            <p className="officer-line">“You both got in. Now the officer files a report, whether you like it or not.”</p>
            <FindingSlip
                label="Officer’s inspection report"
                finding={c.inspection}
                loading={busy.has('inspection')}
                onRetry={() => runAi('inspection')}
            />
            <button type="button" className="btn btn-big" onClick={() => act({ type: 'ADVANCE', from: 'inspection' })}>
                Open treaty talks
            </button>
        </>
    );
}

/** Page 07: each traveller tables one proposal, privately. */
export function ProposeDesk({ c, act }: DeskProps) {
    const me = whoIsUp(c) as Side;
    const [text, setText] = useState('');
    const [err, setErr] = useState<string | null>(null);
    return (
        <>
            <DisputeBox c={c} />
            <p className="officer-line">
                “{c.names[me]}, one proposal. Concrete. Who does what, by when. ‘Communicate better’ gets you deported.”
            </p>
            <FormField id="proposal" label={`Proposal tabled by ${c.names[me]}`} value={text} onChange={setText} rows={5} />
            <button type="button" className="btn btn-big" onClick={() => setErr(act({ type: 'PROPOSE', by: me, text }))}>
                Table it
            </button>
            <ErrorLine msg={err} />
        </>
    );
}

/** Page 08: read the other proposal back, in your own words. */
export function ReadbackDesk({ c, act }: DeskProps) {
    const me = whoIsUp(c) as Side;
    const them = other(me);
    const [text, setText] = useState('');
    const [err, setErr] = useState<string | null>(null);
    return (
        <>
            <div className="application">
                <span className="tag">Proposal tabled by {c.names[them]}</span>
                <p className="application-text">{c.proposals[them]}</p>
            </div>
            <p className="officer-line">
                “{c.names[me]}, read it back. What is {c.names[them]} actually trying to get with this? What would it
                cost you? The officer will compare.”
            </p>
            <FormField
                id="readback"
                label={`${c.names[me]}’s read-back`}
                value={text}
                onChange={setText}
                rows={5}
                placeholder={`${c.names[them]} wants…`}
            />
            <button type="button" className="btn btn-big" onClick={() => setErr(act({ type: 'READBACK', by: me, text }))}>
                File read-back
            </button>
            <ErrorLine msg={err} />
        </>
    );
}

/** Page 09: the officer bets on a proposal. */
export function WagerDesk({ c, act, runAi, busy }: DeskProps) {
    useEffect(() => {
        if (!c.wager && !busy.has('wager')) runAi('wager');
    }, []);
    return (
        <>
            <div className="two-col">
                {(['A', 'B'] as const).map((s) => (
                    <div key={s} className="application">
                        <span className="tag">{c.names[s]} proposes</span>
                        <p className="application-text">{c.proposals[s]}</p>
                        <p className="small">
                            <b>{c.names[other(s)]} read it as:</b> {c.readbacks[other(s)]}
                        </p>
                    </div>
                ))}
            </div>
            <FindingSlip label="The officer’s wager" finding={c.wager} loading={busy.has('wager')} onRetry={() => runAi('wager')} />
            <button type="button" className="btn btn-big" onClick={() => act({ type: 'ADVANCE', from: 'wager' })}>
                Draft the treaty
            </button>
        </>
    );
}

/** Page 10: one treaty, both signatures. Changing a word voids the other signature. */
export function TreatyDesk({ c, act, runAi, busy }: DeskProps) {
    const [draft, setDraft] = useState(c.treaty.text);
    const [err, setErr] = useState<string | null>(null);
    useEffect(() => setDraft(c.treaty.text), [c.treaty.text]);
    const changed = draft.trim() !== c.treaty.text;
    return (
        <>
            <DisputeBox c={c} />
            <p className="officer-line">
                “Write the treaty together. Specific clauses. Whoever files a change signs it, and the other signature
                goes void until they read it again.”
            </p>
            <div className="row">
                <button
                    type="button"
                    className="btn btn-ghost"
                    disabled={busy.has('brainstorm')}
                    onClick={() => runAi('brainstorm')}
                >
                    {busy.has('brainstorm') ? 'Officer is drafting…' : 'Stuck? Ask the officer for clauses'}
                </button>
            </div>
            {(c.brainstorm || busy.has('brainstorm')) && (
                <FindingSlip label="Suggested clauses" finding={c.brainstorm} loading={busy.has('brainstorm')} />
            )}
            <FormField
                id="treaty"
                label="Treaty text"
                value={draft}
                onChange={setDraft}
                rows={6}
                placeholder="1. Ana washes, Jordan dries, on weeknights. 2. …"
            />
            <div className="two-col">
                {(['A', 'B'] as const).map((s) => (
                    <div key={s} className="sign-box">
                        <span className="tag">{c.names[s]}</span>
                        {changed ? (
                            <button
                                type="button"
                                className="btn"
                                onClick={() => setErr(act({ type: 'EDIT_TREATY', by: s, text: draft }))}
                            >
                                File &amp; sign as {c.names[s]}
                            </button>
                        ) : c.treaty.signed[s] ? (
                            <span className="signature">{c.names[s]}</span>
                        ) : (
                            <button
                                type="button"
                                className="btn"
                                disabled={!c.treaty.text}
                                onClick={() => setErr(act({ type: 'SIGN_TREATY', by: s }))}
                            >
                                Sign as {c.names[s]}
                            </button>
                        )}
                    </div>
                ))}
            </div>
            <ErrorLine msg={err} />
        </>
    );
}

/** Page 11: the ratified treaty and its seven-day review. */
export function RatifiedDesk({ c, act }: DeskProps) {
    const [err, setErr] = useState<string | null>(null);
    const due = c.reviewDue ? new Date(c.reviewDue) : null;
    const open = due ? Date.now() >= due.getTime() : false;
    return (
        <>
            <div className="treaty-doc">
                <p className="treaty-kicker">Treaty of {fmtDate(c.updatedAt)}</p>
                <p className="treaty-parties">
                    between the Republic of <b>{c.names.A}</b> and the Republic of <b>{c.names.B}</b>
                </p>
                <p className="treaty-whereas">
                    <b>Whereas</b> the parties disputed “{c.dispute.text.replace(/[.!?]+$/, '')}”, and each stated the other’s side well enough
                    to be admitted ({c.names.A}: {c.visas.A.length} {c.visas.A.length === 1 ? 'try' : 'tries'},{' '}
                    {c.names.B}: {c.visas.B.length} {c.visas.B.length === 1 ? 'try' : 'tries'}),
                </p>
                <p className="treaty-agree">
                    <b>the parties agree:</b>
                </p>
                <p className="treaty-text">{c.treaty.text}</p>
                <div className="two-col">
                    {(['A', 'B'] as const).map((s) => (
                        <div key={s} className="sign-box">
                            <span className="signature">{c.names[s]}</span>
                            <span className="tag">for the Republic of {c.names[s]}</span>
                        </div>
                    ))}
                </div>
                <div className="treaty-seal">
                    <Stamp kind="customs" tilt={-12}>
                        RATIFIED
                    </Stamp>
                </div>
            </div>
            <section className="stamp-page" aria-label="Stamps in this passport">
                <span className="tag">Visa pages: every stamp this crossing earned</span>
                <div className="stamp-scatter">
                    <Stamp kind="admitted" tilt={-9}>
                        DISPUTE AGREED
                    </Stamp>
                    <Stamp kind="customs" tilt={7}>
                        CUSTOMS · 2 BAGS
                    </Stamp>
                    {(['A', 'B'] as const).flatMap((s) =>
                        c.visas[s].map((v, i) => (
                            <Stamp key={`${s}${i}`} kind={v.verdict === 'denied' ? 'denied' : 'admitted'} tilt={((i * 37 + (s === 'A' ? 11 : 23)) % 24) - 12}>
                                {v.verdict === 'denied' ? 'DENIED' : 'ADMITTED'} · {c.names[s]} → {c.names[other(s)]}
                            </Stamp>
                        ))
                    )}
                    <Stamp kind="customs" tilt={-4}>
                        RATIFIED {fmtDate(c.updatedAt)}
                    </Stamp>
                </div>
            </section>
            <div className="review">
                <span className="tag">Treaty review</span>
                {!open && due && (
                    <p>
                        Opens <b>{fmtDate(due.toISOString())}</b>. Come back then and each of you says whether it held.
                    </p>
                )}
                {open && (
                    <div className="two-col">
                        {(['A', 'B'] as const).map((s) => (
                            <div key={s} className="sign-box">
                                <span className="tag">{c.names[s]}</span>
                                {c.review[s] ? (
                                    <Stamp kind={c.review[s] === 'holding' ? 'admitted' : 'denied'} small>
                                        {c.review[s] === 'holding' ? 'HOLDING' : 'COLLAPSED'}
                                    </Stamp>
                                ) : (
                                    <div className="row">
                                        <button
                                            type="button"
                                            className="btn btn-admit"
                                            onClick={() => setErr(act({ type: 'REVIEW', by: s, verdict: 'holding' }))}
                                        >
                                            It’s holding
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-deny"
                                            onClick={() => setErr(act({ type: 'REVIEW', by: s, verdict: 'collapsed' }))}
                                        >
                                            It collapsed
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
            {(c.inspection?.status === 'ok' || c.wager?.status === 'ok') && (
                <details className="appendix">
                    <summary>Annex: the officer’s paperwork</summary>
                    {c.inspection?.status === 'ok' && <FindingSlip label="Inspection report" finding={c.inspection} />}
                    {c.wager?.status === 'ok' && <FindingSlip label="Wager" finding={c.wager} />}
                </details>
            )}
            <div className="row no-print">
                <button type="button" className="btn btn-ghost" onClick={() => window.print()}>
                    Print the treaty
                </button>
            </div>
            <ErrorLine msg={err} />
        </>
    );
}
