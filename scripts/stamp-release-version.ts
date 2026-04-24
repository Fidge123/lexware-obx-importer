#!/usr/bin/env bun

import { readFile, writeFile } from "node:fs/promises";

interface TauriConfig {
  version: string;
}

export function createStampedReleaseVersion(baseVersion: string): string {
  const [major, minor, patch] = baseVersion.split(".").map(Number);
  return `${major}.${minor}.${patch + 1}-main.${String(Date.now())}`;
}

function stampTauriConfigContent(
  rawConfig: string,
  stampedVersion: string,
): string {
  const config = JSON.parse(rawConfig) as TauriConfig;
  config.version = stampedVersion;
  return `${JSON.stringify(config, null, 2)}\n`;
}

function stampCargoTomlVersion(
  rawCargoToml: string,
  stampedVersion: string,
): string {
  return rawCargoToml.replace(
    /^(version\s*=\s*)"[^"]*"/m,
    `$1"${stampedVersion}"`,
  );
}

export async function stampReleaseVersionFiles(
  tauriConfigPath: string,
  cargoTomlPath: string,
): Promise<string> {
  const tauriRaw = await readFile(tauriConfigPath, "utf8");
  const tauriConfig = JSON.parse(tauriRaw) as TauriConfig;
  const stampedVersion = createStampedReleaseVersion(tauriConfig.version);

  const stampedTauriConfig = stampTauriConfigContent(tauriRaw, stampedVersion);
  await writeFile(tauriConfigPath, stampedTauriConfig, "utf8");

  const cargoRaw = await readFile(cargoTomlPath, "utf8");
  const stampedCargoToml = stampCargoTomlVersion(cargoRaw, stampedVersion);
  await writeFile(cargoTomlPath, stampedCargoToml, "utf8");

  return stampedVersion;
}

async function main() {
  const tauriConfigPath = "src-tauri/tauri.conf.json";
  const cargoTomlPath = "src-tauri/Cargo.toml";
  const stampedVersion = await stampReleaseVersionFiles(
    tauriConfigPath,
    cargoTomlPath,
  );

  console.log(`Stamped version: ${stampedVersion}`);

  if (process.env.GITHUB_OUTPUT) {
    await writeFile(
      process.env.GITHUB_OUTPUT,
      `stamped_version=${stampedVersion}\n`,
      { encoding: "utf8", flag: "a" },
    );
  }
}

if (import.meta.main) {
  main().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Version stamping failed: ${message}`);
    process.exit(1);
  });
}
