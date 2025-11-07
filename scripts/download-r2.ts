#!/usr/bin/env bun

import { mkdir } from "node:fs/promises";
import { join } from "node:path";
import {
	createS3Client,
	getCurrentBranch,
	getR2Config,
} from "./r2-utils";

type S3ListResponse = {
	Contents?: Array<{ Key?: string }>;
};

async function downloadExamples(branch: string): Promise<void> {
  const config = getR2Config();
  console.log(`📥 Downloading examples from R2 for branch: ${branch}`);

  const s3 = createS3Client(config);
  const examplesDir = join(import.meta.dir, "..", "examples");

  // Ensure examples directory exists
  await mkdir(examplesDir, { recursive: true });

  try {
    // List all objects with the branch prefix
    const response = await s3.list({ prefix: `${branch}/` });
    const contents = response as unknown as S3ListResponse;

    let downloadedCount = 0;

    if (contents.Contents) {
      for (const object of contents.Contents) {
        if (!object.Key) continue;

        // Extract filename from key (remove branch prefix)
        const filename = object.Key.replace(`${branch}/`, "");
        if (!filename) continue;

        const filePath = join(examplesDir, filename);

        try {
          // Download file using s3.file() method
          const file = s3.file(object.Key);
          const fileData = await file.arrayBuffer();
          await Bun.write(filePath, fileData);
          console.log(`✓ ${filename}`);
          downloadedCount++;
        } catch (error) {
          console.error(`❌ Failed to download ${filename}:`, error);
        }
      }
    }

    if (downloadedCount === 0) {
      console.log(`\n⚠️  No examples found for branch: ${branch}`);
    } else {
      console.log(`\n✅ Downloaded ${downloadedCount} file(s)`);
    }
  } catch (error) {
    console.error("❌ Failed to download examples:", error);
    process.exit(1);
  }
}

// Main execution
async function main() {
  const branchArg = process.argv[2];
  const branch = branchArg || (await getCurrentBranch());
  await downloadExamples(branch);
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
