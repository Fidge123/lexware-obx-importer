#!/usr/bin/env bun

import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import { createS3Client, getCurrentBranch, getR2Config } from "./r2-utils";

type S3ListResponse = {
  contents?: Array<{ key?: string }>;
};

async function downloadExamplesForBranch(
  branch: string,
  examplesDir: string,
): Promise<number> {
  const config = getR2Config();
  const s3 = createS3Client(config);

  console.log(`🔍 Listing objects with prefix: ${branch}/`);
  const response = await s3.list({ prefix: `${branch}/` });
  const contents = response as unknown as S3ListResponse;

  let downloadedCount = 0;

  if (contents.contents) {
    for (const object of contents.contents) {
      if (!object.key) continue;

      const filename = object.key.replace(`${branch}/`, "");
      if (!filename) continue;

      const filePath = join(examplesDir, filename);

      try {
        const file = s3.file(object.key);
        const fileData = await file.arrayBuffer();
        await Bun.write(filePath, fileData);
        console.log(`✓ ${filename}`);
        downloadedCount++;
      } catch (error) {
        console.error(`❌ Failed to download ${filename}:`, error);
      }
    }
  }

  return downloadedCount;
}

async function downloadExamples(branch: string): Promise<void> {
  const config = getR2Config();
  console.log(`📥 Downloading examples from R2 for branch: ${branch}`);
  console.log(`🔗 R2 Endpoint: ${config.accountId}.r2.cloudflarestorage.com`);
  console.log(`🪣 Bucket: ${config.bucketName}`);

  const examplesDir = join(import.meta.dir, "..", "examples");

  // Ensure examples directory exists
  await mkdir(examplesDir, { recursive: true });

  try {
    let downloadedCount = await downloadExamplesForBranch(branch, examplesDir);

    if (downloadedCount === 0 && branch !== "main") {
      console.log(
        `\n⚠️  No examples found for branch: ${branch}, falling back to main`,
      );
      downloadedCount = await downloadExamplesForBranch("main", examplesDir);
    }

    if (downloadedCount === 0) {
      console.log(`\n⚠️  No examples found for branch: ${branch} or main`);
    } else {
      console.log(`\n✅ Downloaded ${downloadedCount} file(s)`);
    }
  } catch (error) {
    console.error("❌ Failed to download examples:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    console.error("\n💡 Troubleshooting:");
    console.error("  • Verify R2 credentials are correct");
    console.error("  • Check that the bucket name is correct");
    console.error("  • Ensure network connectivity to R2");
    process.exit(1);
  }
}

// Main execution
async function main() {
  const branchArg = process.argv[2];
  const branch = branchArg || (await getCurrentBranch());

  if (!branch) {
    console.error("❌ Could not determine branch name");
    console.error("Usage: bun run scripts/download-r2.ts [branch-name]");
    console.error("Or run from a git repository with a checked out branch");
    process.exit(1);
  }

  await downloadExamples(branch);
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
