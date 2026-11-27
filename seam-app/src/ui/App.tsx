import { Component, useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import type { Action, Crossing, Finding, Phase, Side } from '../../contracts/crossing';
import type { WombatRequest } from '../../contracts/wombat';
import { apply, newCrossing, RuleError, whoIsUp } from '../core/rules';
import { loadCrossings, saveCrossing, type KeyValue } from '../core/storage';
import { askWombat } from '../core/wombatClient';
import { FindingSlip, Page, Stamp, fmtDate } from './bits';
import {
    DeclareDesk,
    DisputeDesk,
    FindingsDesk,
    InspectionDesk,
    ProposeDesk,
    RatifiedDesk,
    ReadbackDesk,
    StampDesk,
    TreatyDesk,
    VisaDesk,
    WagerDesk,
    type DeskProps
} from './Desks';

const PRIVATE: Phase[] = ['declare', 'visa', 'stamp', 'propose', 'readback'];

const DESKS: Record<Phase, { no: string; title: string; Desk: (p: DeskProps) => ReactNode }> = {
    dispute: { no: '01', title: 'Statement of Dispute', Desk: DisputeDesk },
    declare: { no: '02', title: 'Customs Declaration', Desk: DeclareDesk },
    findings: { no: '03', title: 'Customs Findings', Desk: FindingsDesk },
    visa: { no: '04', title: 'Visa Application', Desk: VisaDesk },
    stamp: { no: '05', title: 'Entry Decision', Desk: StampDesk },
    inspection: { no: '06', title: 'Inspection Report', Desk: InspectionDesk },
    propose: { no: '07', title: 'Treaty Proposals', Desk: ProposeDesk },
    readback: { no: '08', title: 'Read-Back', Desk: ReadbackDesk },
    wager: { no: '09', title: 'The Officer’s Wager', Desk: WagerDesk },
    treaty: { no: '10', title: 'Treaty Drafting', Desk: TreatyDesk },
    ratified: { no: '11', title: 'Ratified Treaty', Desk: RatifiedDesk }
};

const STATUS: Record<Phase, string> = {
    dispute: 'AT THE BORDER',
    declare: 'IN CUSTOMS',
    findings: 'IN CUSTOMS',
    visa: 'VISA PENDING',
    stamp: 'VISA PENDING',
    inspection: 'ADMITTED',
    propose: 'IN TALKS',
    readback: 'IN TALKS',
    wager: 'IN TALKS',
    treaty: 'IN TALKS',
    ratified: 'RATIFIED'
};

function browserStore(): KeyValue {
    try {
        return window.localStorage;
    } catch {
        return {
            getItem: () => {
                throw new Error('no storage');
            },
            setItem: () => {
                throw new Error('no storage');
            }
        };
    }
}

function wombatRequest(c: Crossing, kind: 'inspection' | 'wager' | 'brainstorm' | 'customsA' | 'customsB'): WombatRequest | null {
    switch (kind) {
        case 'customsA':
        case 'customsB': {
            const d = c.declarations[kind === 'customsA' ? 'A' : 'B'];
            return d ? { task: 'customs', dispute: c.dispute.text, declaration: d.text, items: d.items } : null;
        }
        case 'inspection': {
            const a = c.visas.A.at(-1);
            const b = c.visas.B.at(-1);
            if (!c.declarations.A || !c.declarations.B || !a || !b) return null;
            return {
                task: 'inspection',
                dispute: c.dispute.text,
                names: c.names,
                declarations: { A: c.declarations.A.text, B: c.declarations.B.text },
                steelmans: { A: a.text, B: b.text }
            };
        }
        case 'wager':
            if (!c.proposals.A || !c.proposals.B || !c.readbacks.A || !c.readbacks.B) return null;
            return {
                task: 'wager',
                dispute: c.dispute.text,
                names: c.names,
                proposals: { A: c.proposals.A, B: c.proposals.B },
                readbacks: { A: c.readbacks.A, B: c.readbacks.B }
            };
        case 'brainstorm':
            return {
                task: 'brainstorm',
                dispute: c.dispute.text,
                proposals: { A: c.proposals.A ?? '', B: c.proposals.B ?? '' },
                wager: c.wager?.status === 'ok' ? c.wager.text : 'none'
            };
    }
}

export class LostLuggage extends Component<{ children: ReactNode }, { broken: boolean }> {
    state = { broken: false };
    static getDerivedStateFromError() {
        return { broken: true };
    }
    componentDidCatch(error: unknown) {
        console.warn('[lost luggage]', error);
    }
    render() {
        if (!this.state.broken) return this.props.children;
        return (
            <main className="desk-floor">
                <Page no="—" title="Lost Luggage" names={null} code="LOST<AND<FOUND">
                    <Stamp kind="denied">PAGE TORN</Stamp>
                    <p className="officer-line">
                        “Something in this passport tore. Your crossings are saved on this device. Go back to the
                        front desk and reopen it.”
                    </p>
                    <button type="button" className="btn btn-big" onClick={() => (window.location.href = '/')}>
                        Back to the front desk
                    </button>
                </Page>
            </main>
        );
    }
}

export default function App() {
    const store = useRef<KeyValue>(browserStore());
    const [loaded] = useState(() => loadCrossings(store.current));
    const [crossings, setCrossings] = useState<Crossing[]>(loaded.crossings);
    const [openId, setOpenId] = useState<string | null>(() => {
        try {
            return sessionStorage.getItem('wombat-border:open');
        } catch {
            return null;
        }
    });
    const [holder, setHolder] = useState<Side | null>(null);
    const [busy, setBusy] = useState<Set<string>>(new Set());
    const [hotline, setHotline] = useState<{ open: boolean; finding?: Finding; loading: boolean }>({
        open: false,
        loading: false
    });
    const [saveOk, setSaveOk] = useState(loaded.ok);
    const latest = useRef(crossings);
    latest.current = crossings;

    const current = crossings.find((c) => c.id === openId) ?? null;

    useEffect(() => {
        try {
            if (openId) sessionStorage.setItem('wombat-border:open', openId);
            else sessionStorage.removeItem('wombat-border:open');
        } catch {
            /* private mode: resume just won't work */
        }
        window.scrollTo(0, 0);
    }, [openId]);

    const commit = useCallback((next: Crossing) => {
        setSaveOk(saveCrossing(store.current, next).ok);
        latest.current = [next, ...latest.current.filter((x) => x.id !== next.id)];
        setCrossings(latest.current);
    }, []);

    const actOn = useCallback(
        (id: string, a: Action): string | null => {
            const c = latest.current.find((x) => x.id === id);
            if (!c) return 'That crossing is gone.';
            try {
                commit(apply(c, a, new Date()));
                return null;
            } catch (e) {
                if (e instanceof RuleError) return e.message;
                throw e;
            }
        },
        [commit]
    );

    const runAi = useCallback(
        async (id: string, kind: 'inspection' | 'wager' | 'brainstorm' | 'customsA' | 'customsB') => {
            const c = latest.current.find((x) => x.id === id);
            if (!c) return;
            const req = wombatRequest(c, kind);
            if (!req) return;
            setBusy((b) => new Set(b).add(kind));
            const finding = await askWombat(req);
            setBusy((b) => {
                const n = new Set(b);
                n.delete(kind);
                return n;
            });
            const action: Action =
                kind === 'customsA' || kind === 'customsB'
                    ? { type: 'SET_DECLARATION_FINDING', by: kind === 'customsA' ? 'A' : 'B', finding }
                    : kind === 'inspection'
                      ? { type: 'SET_INSPECTION', finding }
                      : kind === 'wager'
                        ? { type: 'SET_WAGER', finding }
                        : { type: 'SET_BRAINSTORM', finding };
            actOn(id, action);
        },
        [actOn]
    );

    const callHotline = async () => {
        setHotline({ open: true, loading: true });
        const finding = await askWombat({ task: 'incident', dispute: current?.dispute.text });
        setHotline({ open: true, loading: false, finding });
    };

    const up = current ? whoIsUp(current) : 'both';
    const needsCurtain = current && PRIVATE.includes(current.phase) && up !== 'both' && holder !== up;

    useEffect(() => {
        if (!current || !PRIVATE.includes(current.phase)) setHolder(null);
    }, [current?.phase, current]);

    let body: ReactNode;
    if (!current) {
        body = (
            <FrontDesk
                crossings={crossings}
                dropped={loaded.dropped}
                saveOk={saveOk}
                onOpen={(id) => {
                    setHolder(null);
                    setOpenId(id);
                }}
                onCreate={(c) => {
                    commit(c);
                    setHolder(null);
                    setOpenId(c.id);
                }}
            />
        );
    } else if (needsCurtain) {
        const who = up as Side;
        const away = who === 'A' ? 'B' : 'A';
        body = (
            <section className="curtain" aria-labelledby="curtain-title">
                <div className="hazard" aria-hidden="true" />
                <p className="curtain-kicker">Now serving</p>
                <h1 id="curtain-title" className="curtain-name">
                    {current.names[who]}
                </h1>
                <p className="curtain-line">
                    Hand the phone to <b>{current.names[who]}</b>. {current.names[away]}, please wait behind the
                    yellow line. This desk is private.
                </p>
                <button type="button" className="btn btn-big btn-curtain" onClick={() => setHolder(who)}>
                    I am {current.names[who]}. Step forward.
                </button>
                <div className="hazard" aria-hidden="true" />
            </section>
        );
    } else {
        const { no, title, Desk } = DESKS[current.phase];
        const props: DeskProps = {
            c: current,
            act: (a) => actOn(current.id, a),
            runAi: (k) => void runAi(current.id, k),
            xray: (side, text) =>
                askWombat({
                    task: 'xray',
                    dispute: current.dispute.text,
                    steelman: text,
                    about: current.names[side === 'A' ? 'B' : 'A']
                }),
            busy
        };
        body = (
            <Page no={no} title={title} names={current.names} code={`${current.id}<${current.phase}`} tone={current.phase === 'ratified' ? 'treaty' : undefined}>
                <Desk key={`${current.id}-${current.phase}-${up}-${current.visas.A.length}-${current.visas.B.length}`} {...props} />
            </Page>
        );
    }

    return (
        <div className="desk-floor">
            <nav className="topbar no-print" aria-label="Border control">
                <button type="button" className="brand" onClick={() => setOpenId(null)}>
                    <img src="/officer.jpg" alt="" width={28} height={28} />
                    <span>Wombat Border Control</span>
                </button>
                <button type="button" className="hotline-btn" onClick={callHotline}>
                    Diplomatic incident
                </button>
            </nav>
            {current && (
                <ol className="visa-track no-print" aria-label="Progress">
                    {(Object.keys(DESKS) as Phase[]).map((p) => {
                        const idx = Object.keys(DESKS).indexOf(p);
                        const at = Object.keys(DESKS).indexOf(current.phase);
                        return (
                            <li key={p} className={idx < at ? 'done' : idx === at ? 'here' : ''} title={DESKS[p].title}>
                                {DESKS[p].no}
                            </li>
                        );
                    })}
                </ol>
            )}
            <main>{body}</main>
            {hotline.open && (
                <div className="modal" role="dialog" aria-modal="true" aria-labelledby="hotline-title">
                    <div className="modal-card">
                        <p className="tag">Diplomatic incident hotline</p>
                        <h2 id="hotline-title">Officer on the line</h2>
                        <FindingSlip label="Advice for the next five minutes" finding={hotline.finding} loading={hotline.loading} />
                        <p className="small">
                            If anyone is scared for their safety, this is not a game: call your local emergency number
                            or a domestic violence hotline.
                        </p>
                        <button type="button" className="btn" onClick={() => setHotline({ open: false, loading: false })}>
                            Hang up
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

function FrontDesk({
    crossings,
    dropped,
    saveOk,
    onOpen,
    onCreate
}: {
    crossings: Crossing[];
    dropped: number;
    saveOk: boolean;
    onOpen: (id: string) => void;
    onCreate: (c: Crossing) => void;
}) {
    const [a, setA] = useState('');
    const [b, setB] = useState('');
    const [dispute, setDispute] = useState('');
    const [err, setErr] = useState<string | null>(null);
    return (
        <>
            <section className="cover" aria-label="Passport cover">
                <p className="cover-top">Republic of the Other Side</p>
                <svg className="crest" viewBox="0 0 120 120" aria-hidden="true">
                    <circle cx="60" cy="60" r="54" fill="none" stroke="currentColor" strokeWidth="3" />
                    <circle cx="60" cy="60" r="46" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="2 4" />
                    <path
                        d="M30 72c0-20 13-34 30-34s30 14 30 34c0 6-5 10-12 10H42c-7 0-12-4-12-10z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                    />
                    <circle cx="48" cy="58" r="3" fill="currentColor" />
                    <circle cx="72" cy="58" r="3" fill="currentColor" />
                    <path d="M40 40l-6-10M80 40l6-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                    <ellipse cx="60" cy="70" rx="7" ry="5" fill="currentColor" />
                    <path d="M53 78q7 5 14 0" fill="none" stroke="currentColor" strokeWidth="2" />
                </svg>
                <p className="cover-word">Passport</p>
                <p className="cover-sub">
                    You don’t get into their side of the argument
                    <br />
                    until they stamp your visa.
                </p>
            </section>

            <Page no="ii" title="Officer on Duty" names={null} code="WOMBAT<W<BADGE<0001">
                <div className="id-page">
                    <img className="id-photo" src="/officer.jpg" alt="The Skeptical Wombat, unimpressed" width={180} height={188} />
                    <dl className="id-fields">
                        <dt>Surname</dt>
                        <dd>OMBAT</dd>
                        <dt>Given name</dt>
                        <dd>W.</dd>
                        <dt>Rank</dt>
                        <dd>Senior Customs Officer, Skeptical Wombat</dd>
                        <dt>Allergies</dt>
                        <dd>“I’m fine”, therapy-speak, “you always”</dd>
                    </dl>
                </div>
                <ol className="rules">
                    <li>Agree on what you’re actually fighting about. One boring sentence.</li>
                    <li>Each of you declares your side, privately. Customs says what it really means.</li>
                    <li>
                        Apply for a visa: state <i>their</i> side well enough that <i>they</i> stamp it. Only they can.
                    </li>
                    <li>Table one proposal each, read the other’s back, hear the officer’s bet.</li>
                    <li>Sign one treaty. Come back in seven days and say if it held.</li>
                </ol>
                <p className="small">One phone, two people, same room. Private desks hand the phone over. Nothing leaves this device except what the officer is asked to read.</p>
            </Page>

            <Page no="iii" title="Open a Crossing" names={null} code="NEW<CROSSING">
                <form
                    className="new-crossing"
                    onSubmit={(e) => {
                        e.preventDefault();
                        try {
                            onCreate(newCrossing({ A: a, B: b }, dispute, new Date()));
                        } catch (x) {
                            if (x instanceof RuleError) setErr(x.message);
                            else throw x;
                        }
                    }}
                >
                    <div className="two-col">
                        <div className="field">
                            <label htmlFor="name-a">Traveller one</label>
                            <input id="name-a" value={a} maxLength={40} onChange={(e) => setA(e.target.value)} autoComplete="off" />
                        </div>
                        <div className="field">
                            <label htmlFor="name-b">Traveller two</label>
                            <input id="name-b" value={b} maxLength={40} onChange={(e) => setB(e.target.value)} autoComplete="off" />
                        </div>
                    </div>
                    <div className="field">
                        <label htmlFor="new-dispute">The dispute, as traveller one would file it</label>
                        <p className="hint">Traveller two gets to amend it on the next page.</p>
                        <textarea id="new-dispute" rows={3} maxLength={2000} value={dispute} onChange={(e) => setDispute(e.target.value)} placeholder="Who loads the dishwasher, and whether rinsing counts." />
                    </div>
                    <button type="submit" className="btn btn-big">
                        Approach the border
                    </button>
                    {err && (
                        <p className="refused" role="alert">
                            <Stamp kind="denied" small tilt={-3}>
                                REFUSED
                            </Stamp>{' '}
                            {err}
                        </p>
                    )}
                </form>
            </Page>

            <Page no="iv" title="Previous Crossings" names={null} code="ARCHIVE">
                {!saveOk && (
                    <p className="refused">This browser won’t let us save (private mode?). Crossings vanish when you close the tab.</p>
                )}
                {dropped > 0 && <p className="small">{dropped} damaged record(s) could not be read and were left out.</p>}
                {crossings.length === 0 ? (
                    <p className="empty">No stamps yet. Every passport starts blank.</p>
                ) : (
                    <ul className="archive">
                        {crossings.map((c) => (
                            <li key={c.id}>
                                <button type="button" className="archive-row" onClick={() => onOpen(c.id)}>
                                    <span className="archive-names">
                                        {c.names.A} &amp; {c.names.B}
                                    </span>
                                    <span className="archive-dispute">{c.dispute.text}</span>
                                    <span className="archive-meta">
                                        {fmtDate(c.createdAt)}
                                        <Stamp kind={c.phase === 'ratified' ? 'admitted' : 'pending'} small tilt={-5}>
                                            {STATUS[c.phase]}
                                        </Stamp>
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </Page>
        </>
    );
}
