#!/usr/bin/env node
/**
 * Pull-request review via the xAI chat API.
 * Skips cleanly when XAI_API_KEY is unset so CI stays green before the owner
 * adds the secret. Posts or updates one Origin comment when a PR number and
 * the origin CLI are available. Prints the review and exits 0 when either is
 * missing.
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const PERSONA_LOCK_IN =
  "**Persona Lock-in:** You are The Skeptical Wombat. You are blunt, witty, and allergic to polite nonsense. You are not a therapist. You do not validate. You name the actual bug.";
const MARKER = "<!-- skeptical-wombat-ai-review -->";
const DIFF_CAP = 14_000;
// Fixed locations only. The workflow pins a PATH-provided binary onto
// /usr/local/bin/origin before this script runs. install.sh uses ~/.local/bin.
const ORIGIN_BINARIES = [
  "/usr/local/bin/origin",
  "/usr/bin/origin",
  "/root/.local/bin/origin",
  "/home/runner/.local/bin/origin",
  "/github/home/.local/bin/origin",
];

function logLine(value) {
  console.log(String(value ?? "").replace(/\r\n|[\r\n]/g, "\\n"));
}

export function reviewDecision(env) {
  if (!env.XAI_API_KEY?.trim()) return { action: "skip", reason: "XAI_API_KEY is not set" };
  return { action: "review" };
}

export function clipDiff(diff) {
  const text = diff.trim();
  if (text.length <= DIFF_CAP) return text;
  return `${text.slice(0, DIFF_CAP)}\n\n[diff truncated]`;
}

export function incompleteReviewNote(diff) {
  const text = String(diff ?? "").trim();
  if (text.length <= DIFF_CAP) return "";
  return "This review is incomplete. The diff was longer than 14000 characters, and only the start was sent.";
}

export function reviewPrompt(diff) {
  const lines = [
    PERSONA_LOCK_IN,
    "Review this pull request for The Skeptical Wombat, a web app that helps partners navigate disagreements.",
    "Comment only on real bugs, security issues (client-exposed keys, auth, data leaks), or a broken conflict-flow state.",
    "Skip style nits. Use short paragraphs. If nothing is wrong, say so in one sentence.",
  ];
  const incomplete = incompleteReviewNote(diff);
  if (incomplete) lines.push(incomplete);
  lines.push("", clipDiff(diff));
  return lines.join("\n");
}

function pullRequestNumber(env) {
  if (env.PR_NUMBER) return String(env.PR_NUMBER);
  if (!env.GITHUB_EVENT_PATH) return "";
  try {
    const event = JSON.parse(readFileSync(env.GITHUB_EVENT_PATH, "utf8"));
    return event.pull_request?.number ? String(event.pull_request.number) : "";
  } catch {
    return "";
  }
}

function safeRef(name) {
  const ref = String(name || "main");
  if (!/^[A-Za-z0-9._/-]+$/.test(ref)) return "";
  const parts = ref.split("/");
  if (parts.some((part) => part === "" || part === "." || part === "..")) return "";
  return ref;
}

function diffAgainstBase(env) {
  const base = safeRef(env.GITHUB_BASE_REF || env.BASE_REF || "main");
  if (!base) throw new Error("AI review failed: base ref is not a branch name");
  try {
    execFileSync("/usr/bin/git", ["fetch", "origin", base, "--depth", "50"], { stdio: "ignore" });
  } catch {
    // The checkout may already contain the base.
  }
  try {
    return execFileSync("/usr/bin/git", ["diff", `origin/${base}...HEAD`], {
      encoding: "utf8",
      maxBuffer: 8_000_000,
    });
  } catch {
    throw new Error(`AI review failed: could not diff origin/${base}...HEAD`);
  }
}

async function askGrok(apiKey, diff) {
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-4.5",
      max_tokens: 500,
      messages: [
        { role: "system", content: `${PERSONA_LOCK_IN} Review the diff. Be specific and brief.` },
        { role: "user", content: reviewPrompt(diff) },
      ],
    }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) throw new Error(`xAI review failed (${res.status})`);
  const body = await res.json();
  const text = body?.choices?.[0]?.message?.content?.trim();
  if (!text) throw new Error("xAI review returned an empty note");
  return text;
}

export function commentDestination(env, originOnPath = true) {
  const number = pullRequestNumber(env);
  if (!number) return "stdout";
  if (!originOnPath) return "stdout";
  return "origin";
}

function isMissingCli(error) {
  return error?.code === "ENOENT";
}

function originBinary() {
  return ORIGIN_BINARIES.find((binary) => existsSync(binary)) ?? "";
}

function runOrigin(binary, args) {
  if (binary === "/usr/local/bin/origin") {
    return execFileSync("/usr/local/bin/origin", args, { stdio: "inherit" });
  }
  if (binary === "/usr/bin/origin") {
    return execFileSync("/usr/bin/origin", args, { stdio: "inherit" });
  }
  if (binary === "/root/.local/bin/origin") {
    return execFileSync("/root/.local/bin/origin", args, { stdio: "inherit" });
  }
  if (binary === "/home/runner/.local/bin/origin") {
    return execFileSync("/home/runner/.local/bin/origin", args, { stdio: "inherit" });
  }
  return execFileSync("/github/home/.local/bin/origin", args, { stdio: "inherit" });
}

function publishOnOrigin(number, body) {
  const binary = originBinary();
  if (!binary) {
    const missing = new Error("origin CLI is not installed");
    missing.code = "ENOENT";
    throw missing;
  }
  const dir = mkdtempSync(join(tmpdir(), "ai-review-"));
  const file = join(dir, "comment.md");
  try {
    writeFileSync(file, body);
    runOrigin(binary, [
      "pr",
      "comment",
      String(number),
      "--body-file",
      file,
      "--edit-last",
      "--create-if-none",
    ]);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

async function publish(env, body) {
  const number = pullRequestNumber(env);
  if (commentDestination(env, Boolean(originBinary())) === "stdout") {
    logLine(body);
    if (!number) {
      logLine("AI review printed locally. Set PR_NUMBER to comment on the Origin pull request.");
    } else {
      logLine("AI review printed to the log. origin CLI is not installed.");
    }
    return;
  }
  try {
    publishOnOrigin(number, body);
  } catch (error) {
    logLine(body);
    if (isMissingCli(error)) {
      logLine("AI review printed to the log. origin CLI is not installed.");
      return;
    }
    logLine(error instanceof Error ? error.message : error);
    logLine("Origin comment failed. The review is in the log above.");
    throw error;
  }
}

async function main() {
  const decision = reviewDecision(process.env);
  if (decision.action === "skip") {
    logLine(`AI review skipped: ${decision.reason}`);
    return;
  }
  const diff = diffAgainstBase(process.env);
  if (!diff.trim()) {
    logLine("AI review skipped: empty diff");
    return;
  }
  const note = await askGrok(process.env.XAI_API_KEY.trim(), diff);
  const sha = String(process.env.REVIEW_SHA || "").trim();
  const shaLine = /^[0-9a-f]{7,40}$/i.test(sha) ? `\nReviewed \`${sha}\`.` : "";
  const incomplete = incompleteReviewNote(diff);
  const banner = incomplete ? `\n\n${incomplete}` : "";
  const body = `${MARKER}\n**Grok review**${shaLine}${banner}\n\n${note}`;
  await publish(process.env, body);
}

const isDirect = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isDirect) {
  main().catch((error) => {
    console.error(String(error instanceof Error ? error.message : error).replace(/\r\n|[\r\n]/g, "\\n"));
    process.exit(1);
  });
}
