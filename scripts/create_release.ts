#!/usr/bin/env bun

import { exec } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import { basename } from "node:path";
import { promisify } from "node:util";

const execAsync = promisify(exec);

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const REPO_OWNER = "Fidge123";
const REPO_NAME = "lexware-obx-importer";

const PACKAGE_JSON = "./package.json";
const prefix = "./src-tauri/target/aarch64-apple-darwin/release/bundle";
const DMG_PATH_TEMPLATE = `${prefix}/dmg/lexware-obx-importer_{version}_aarch64.dmg`;
const TAR_PATH = `${prefix}/macos/lexware-obx-importer.app.tar.gz`;
const SIG_PATH = `${prefix}/macos/lexware-obx-importer.app.tar.gz.sig`;
const LATEST_JSON_PATH = "./latest.json";

async function main() {
  try {
    if (!GITHUB_TOKEN) {
      throw new Error("GITHUB_TOKEN environment variable is required");
    }

    console.log("🔍 Reading version from package.json...");
    const packageJson = JSON.parse(await readFile(PACKAGE_JSON, "utf-8"));
    const version = packageJson.version;
    console.log(`📦 Version: ${version}`);

    console.log("🔨 Building package for aarch64-apple-darwin...");
    await execAsync("bun tauri build --target aarch64-apple-darwin");
    console.log("✅ Build completed successfully");

    const tagName = `app-v${version}`;
    console.log(`🏷️ Creating git tag: ${tagName}`);
    await execAsync(`git tag -a ${tagName} -m "Release ${tagName}"`);
    console.log("✅ Git tag created successfully");

    console.log("🚀 Pushing tag to origin...");
    await execAsync(`git push origin ${tagName}`);
    console.log("✅ Tag pushed successfully");

    console.log("📝 Creating draft release on GitHub...");
    const releaseName = `App v${version}`;

    const createReleaseResponse = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases`,
      {
        method: "POST",
        headers: {
          Accept: "application/vnd.github+json",
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          "X-GitHub-Api-Version": "2022-11-28",
        },
        body: JSON.stringify({
          tag_name: tagName,
          name: releaseName,
          draft: true,
          generate_release_notes: true,
        }),
      },
    );

    if (!createReleaseResponse.ok) {
      throw new Error(
        `Failed to create release: ${await createReleaseResponse.text()}`,
      );
    }

    const releaseData = await createReleaseResponse.json();
    const releaseId = releaseData.id;
    const releaseUrl = releaseData.html_url;
    console.log(`✅ Draft release created successfully: ${releaseUrl}`);

    const dmgPath = DMG_PATH_TEMPLATE.replace("{version}", version);
    const tarFileName = basename(TAR_PATH);

    console.log("📤 Uploading DMG file...");
    await uploadAsset(releaseId, dmgPath);

    console.log("📤 Uploading TAR.GZ file...");
    await uploadAsset(releaseId, TAR_PATH);

    console.log("📤 Uploading SIG file...");
    await uploadAsset(releaseId, SIG_PATH);

    console.log("📝 Creating latest.json...");
    const sigContent = await readFile(SIG_PATH, "utf-8");

    // Create latest.json
    const latestJson = {
      version,
      notes: "See the assets to download this version and install.",
      pub_date: new Date().toISOString(),
      platforms: {
        "darwin-aarch64": {
          signature: sigContent,
          url: `https://github.com/${REPO_OWNER}/${REPO_NAME}/releases/download/${tagName}/${tarFileName}`,
        },
      },
    };

    await writeFile(
      LATEST_JSON_PATH,
      JSON.stringify(latestJson, null, 2),
      "utf-8",
    );
    console.log(`✅ Created ${LATEST_JSON_PATH}`);

    console.log("📤 Uploading latest.json...");
    await uploadAsset(releaseId, LATEST_JSON_PATH);

    console.log("🌐 Opening draft release in browser...");
    await execAsync(`open ${releaseUrl}`);

    console.log("✨ Release process completed successfully!");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

async function uploadAsset(releaseId: number, filePath: string) {
  try {
    const fileName = basename(filePath);
    const fileContent = await readFile(filePath, { encoding: "utf-8" });

    let contentType = "application/octet-stream";

    if (filePath.endsWith(".json")) {
      contentType = "application/json";
    } else if (filePath.endsWith(".dmg")) {
      contentType = "application/x-apple-diskimage";
    } else if (filePath.endsWith(".tar.gz")) {
      contentType = "application/gzip";
    }

    const uploadUrl = `https://uploads.github.com/repos/${REPO_OWNER}/${REPO_NAME}/releases/${releaseId}/assets?name=${encodeURIComponent(
      fileName,
    )}`;

    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Content-Type": contentType,
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: fileContent,
    });

    if (!response.ok) {
      throw new Error(`Failed to upload ${fileName}: ${await response.text()}`);
    }

    console.log(`✅ Uploaded ${fileName} successfully`);
  } catch (error) {
    console.error(`❌ Failed to upload ${filePath}:`, error);
    throw error;
  }
}

main();
