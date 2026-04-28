#!/usr/bin/env node

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";

const DEFAULT_BRANCHES = new Set(["main", "master"]);
const MAX_DNS_LABEL_LENGTH = 63;
const SERVICES = {
  BASE_URL: "obs-playground",
  CUSTOM_URL: "custom.obs-playground",
  TANSTACK_URL: "tanstack.obs-playground",
  EXPRESS_BASE_URL: "api.obs-playground",
  GRAPHQL_BASE_URL: "graphql.obs-playground",
};
const FALLBACK_PROXY_PORT = "1355";

function runGit(args) {
  return execFileSync("git", args, {
    encoding: "utf-8",
    stdio: ["ignore", "pipe", "ignore"],
    timeout: 5000,
  }).trim();
}

function truncateLabel(label) {
  if (label.length <= MAX_DNS_LABEL_LENGTH) return label;

  const hash = createHash("sha256").update(label).digest("hex").slice(0, 6);
  const prefix = label.slice(0, MAX_DNS_LABEL_LENGTH - 7).replace(/-+$/, "");
  return `${prefix}-${hash}`;
}

function sanitizeForHostname(name) {
  const sanitized = name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
  return truncateLabel(sanitized);
}

function branchToPrefix(branch) {
  if (!branch || branch === "HEAD" || DEFAULT_BRANCHES.has(branch)) return null;

  const lastSegment = branch.split("/").pop();
  const prefix = sanitizeForHostname(lastSegment ?? "");
  return prefix || null;
}

function detectWorktreePrefix() {
  try {
    const worktreeCount = runGit(["worktree", "list", "--porcelain"])
      .split("\n")
      .filter((line) => line.startsWith("worktree ")).length;
    if (worktreeCount <= 1) return null;

    const gitDir = runGit(["rev-parse", "--git-dir"]);
    const gitCommonDir = runGit(["rev-parse", "--git-common-dir"]);
    if (gitDir === gitCommonDir) return null;

    return branchToPrefix(runGit(["rev-parse", "--abbrev-ref", "HEAD"]));
  } catch {
    return null;
  }
}

function getPortlessOrigin() {
  const proxyState = getProxyState();
  const isHttps = proxyState.tls;
  const protocol = isHttps ? "https" : "http";
  const defaultPort = isHttps ? "443" : "80";
  const port = proxyState.port;
  const portSuffix = port === defaultPort ? "" : `:${port}`;

  return { portSuffix, protocol };
}

function readTrimmed(filePath) {
  try {
    return readFileSync(filePath, "utf-8").trim() || null;
  } catch {
    return null;
  }
}

function readProxyStateFromDir(stateDir) {
  const port = readTrimmed(join(stateDir, "proxy.port"));
  if (!port) return null;

  return {
    port,
    tls: existsSync(join(stateDir, "proxy.tls")),
  };
}

function getProxyState() {
  if (process.env.PORTLESS_PORT) {
    return {
      port: process.env.PORTLESS_PORT,
      tls: process.env.PORTLESS_HTTPS !== "0",
    };
  }

  const stateDirs = [
    process.env.PORTLESS_STATE_DIR,
    join(homedir(), ".portless"),
    join(tmpdir(), "portless"),
  ].filter(Boolean);

  for (const stateDir of stateDirs) {
    const state = readProxyStateFromDir(stateDir);
    if (state) return state;
  }

  if (process.env.PORTLESS_HTTPS === "0") {
    return { port: "80", tls: false };
  }

  return { port: FALLBACK_PROXY_PORT, tls: false };
}

function getUrls() {
  const prefix = detectWorktreePrefix();
  const { portSuffix, protocol } = getPortlessOrigin();

  return Object.fromEntries(
    Object.entries(SERVICES).map(([key, name]) => {
      const hostname = prefix
        ? `${prefix}.${name}.localhost`
        : `${name}.localhost`;
      return [key, `${protocol}://${hostname}${portSuffix}`];
    }),
  );
}

function shellQuote(value) {
  return `'${value.replaceAll("'", "'\\''")}'`;
}

const format = process.argv[2] ?? "json";
const urls = getUrls();

if (format === "shell") {
  for (const [key, value] of Object.entries(urls)) {
    console.log(`export ${key}=${shellQuote(value)}`);
  }
} else {
  console.log(JSON.stringify(urls, null, 2));
}
