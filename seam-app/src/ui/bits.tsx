import { useState, type ReactNode } from 'react';
import type { Crossing, Finding } from '../../contracts/crossing';
import { MAX_TEXT } from '../../contracts/crossing';
import { sniff } from '../core/sniffer';

/** Machine-readable zone: the two lines of chevrons at the foot of a passport page. */
export function mrz(names: { A: string; B: string } | null, line2: string): [string, string] {
    const clean = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]+/g, '<');
    const l1 = names ? `P<WMB${clean(names.A)}<<${clean(names.B)}` : 'P<WMBREPUBLIC<OF<THE<OTHER<SIDE';
    const pad = (s: string) => (s + '<'.repeat(44)).slice(0, 44);
    return [pad(l1), pad(clean(line2))];
}

export function Page({
    no,
    title,
    names,
    code,
    children,
    tone
}: {
    no: string;
    title: string;
    names: Crossing['names'] | null;
    code: string;
    children: ReactNode;
    tone?: 'treaty';
}) {
    const [l1, l2] = mrz(names, code);
    return (
        <article className={`page ${tone ?? ''}`}>
            <header className="page-head">
                <span>Republic of the Other Side</span>
                <span className="page-no">Page {no}</span>
            </header>
            <h1 className="page-title">{title}</h1>
            <div className="page-body">{children}</div>
            <footer className="mrz" aria-hidden="true">
                <div>{l1}</div>
                <div>{l2}</div>
            </footer>
        </article>
    );
}

export function Stamp({
    kind,
    children,
    small,
    tilt = -8
}: {
    kind: 'admitted' | 'denied' | 'customs' | 'void' | 'pending';
    children: ReactNode;
    small?: boolean;
    tilt?: number;
}) {
    return (
        <span className={`stamp stamp-${kind} ${small ? 'stamp-small' : ''}`} style={{ ['--tilt' as string]: `${tilt}deg` }}>
            {children}
        </span>
    );
}

const CLOSED_TEXT: Record<'off_duty' | 'busy' | 'error', [string, string]> = {
    off_duty: ['CUSTOMS CLOSED', 'The Wombat is off duty: this server has no AI key. Human inspection only. Carry on.'],
    busy: ['QUEUE FULL', 'Too many travellers at once. Give it a minute and rescan.'],
    error: ['SCANNER JAMMED', 'The Wombat could not be reached. Rescan, or carry on without it.']
};

/** Shows what the Wombat found, an X-ray in progress, or an honest "closed" notice. */
export function FindingSlip({
    finding,
    label,
    onRetry,
    loading
}: {
    finding: Finding | undefined;
    label: string;
    onRetry?: () => void;
    loading?: boolean;
}) {
    if (loading || !finding) {
        return (
            <div className="xray xray-scanning" role="status" aria-live="polite">
                <div className="xray-label">{label}</div>
                <div className="xray-scan">Your bag is in the X-ray…</div>
            </div>
        );
    }
    if (finding.status === 'closed') {
        const [head, body] = CLOSED_TEXT[finding.reason];
        return (
            <div className="xray xray-closed" role="status">
                <div className="xray-label">{label}</div>
                <Stamp kind="void" small tilt={-4}>
                    {head}
                </Stamp>
                <p>{body}</p>
                {onRetry && (
                    <button type="button" className="btn btn-ghost-dark" onClick={onRetry}>
                        Rescan
                    </button>
                )}
            </div>
        );
    }
    return (
        <div className="xray" role="status">
            <div className="xray-label">{label}</div>
            <p className="xray-text">{finding.text}</p>
        </div>
    );
}

/** Textarea with the sniffer dog underneath. The dog is free and works with no AI. */
export function FormField({
    id,
    label,
    hint,
    value,
    onChange,
    rows = 5,
    placeholder
}: {
    id: string;
    label: string;
    hint?: string;
    value: string;
    onChange: (v: string) => void;
    rows?: number;
    placeholder?: string;
}) {
    const hits = sniff(value);
    return (
        <div className="field">
            <label htmlFor={id}>{label}</label>
            {hint && <p className="hint">{hint}</p>}
            <textarea
                id={id}
                rows={rows}
                value={value}
                maxLength={MAX_TEXT}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
            />
            <div className="field-foot">
                <span className="count">
                    {value.length}/{MAX_TEXT}
                </span>
            </div>
            {hits.length > 0 && (
                <div className="dog" role="status">
                    <span className="dog-head">K-9 unit alerted ({hits.length})</span>
                    <ul>
                        {hits.slice(0, 5).map((h) => (
                            <li key={`${h.phrase}-${h.index}`}>
                                <b>“{h.phrase}”</b> {h.why}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}

export function useDraft(initial = '') {
    return useState(initial);
}

export const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
