#!/usr/bin/env bun

import { readdir } from "node:fs/promises";
import { join } from "node:path";
import {
	type R2Config,
	createS3Client,
	getCurrentBranch,
	getLocalAndRemoteBranches,
	getR2Config,
	getR2Endpoint,
} from "./r2-utils";

type S3ListResponse = {
	Contents?: Array<{ Key?: string; LastModified?: string }>;
};

async function uploadExamples(branch: string): Promise<void> {
  const config = getR2Config();
  const endpoint = getR2Endpoint(config.accountId);

  console.log(`📤 Syncing examples to R2 for branch: ${branch}`);

  const examplesDir = join(import.meta.dir, "..", "examples");
  const files = await readdir(examplesDir);

  let uploadedCount = 0;
  let skippedCount = 0;

  for (const filename of files) {
    const filePath = join(examplesDir, filename);
    const file = Bun.file(filePath);
    const exists = await file.exists();

    if (!exists) {
      console.log(`⚠️  Skipping ${filename} (not found)`);
      continue;
    }

    const key = `${branch}/${filename}`;

    try {
      // Read file content
      const content = await file.arrayBuffer();
      const contentBuffer = Buffer.from(content);

      // Calculate MD5 hash for comparison
      const hasher = new Bun.CryptoHasher("md5");
      hasher.update(contentBuffer);
      const localHash = hasher.digest("base64");

      // Check if file exists in R2 and compare ETags
      let shouldUpload = true;
      try {
        const headResponse = await fetch(
          `${endpoint}/${config.bucketName}/${key}`,
          {
            method: "HEAD",
            headers: {
              Authorization: `AWS4-HMAC-SHA256 Credential=${config.accessKeyId}`,
            },
          },
        );

        if (headResponse.ok) {
          const etag = headResponse.headers.get("etag")?.replace(/"/g, "");
          if (etag === localHash) {
            shouldUpload = false;
          }
        }
      } catch {
        // File doesn't exist, upload it
      }

      if (!shouldUpload) {
        console.log(`✓ ${filename} (unchanged)`);
        skippedCount++;
        continue;
      }

      // Upload to R2 using Bun's S3 support
      const s3 = createS3Client(config);
      await s3.write(key, file);
      console.log(`✓ ${filename} (uploaded)`);
      uploadedCount++;
    } catch (error) {
      console.error(`❌ Failed to upload ${filename}:`, error);
    }
  }

  console.log(
    `\n✅ Sync complete: ${uploadedCount} uploaded, ${skippedCount} skipped`,
  );
}

async function listR2Branches(): Promise<Map<string, Date>> {
  const config = getR2Config();
  const s3 = createS3Client(config);
  const branches = new Map<string, Date>();

  try {
    // List all objects
    const response = await s3.list();
    const contents = response as unknown as S3ListResponse;

    if (contents.Contents) {
      for (const object of contents.Contents) {
        if (object.Key) {
          const branchName = object.Key.split("/")[0];
          const lastModified = object.LastModified
            ? new Date(object.LastModified)
            : new Date();

          const existingDate = branches.get(branchName);
          if (!existingDate || lastModified > existingDate) {
            branches.set(branchName, lastModified);
          }
        }
      }
    }
  } catch (error) {
    console.error("❌ Failed to list R2 branches:", error);
  }

  return branches;
}

async function cleanupOldBranches(): Promise<void> {
  console.log("🔍 Checking for orphaned branches in R2...\n");

  const config = getR2Config();
  const r2Branches = await listR2Branches();
  const activeBranches = await getLocalAndRemoteBranches();

  // Find orphaned branches
  const orphanedBranches: Array<{ name: string; lastModified: Date }> = [];
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  for (const [branchName, lastModified] of Array.from(r2Branches.entries())) {
    if (!activeBranches.has(branchName) && lastModified < sevenDaysAgo) {
      orphanedBranches.push({ name: branchName, lastModified });
    }
  }

  if (orphanedBranches.length === 0) {
    console.log("✅ No orphaned branches found (older than 7 days)");
    return;
  }

  console.log(`Found ${orphanedBranches.length} orphaned branch(es):\n`);
  for (const { name, lastModified } of orphanedBranches) {
    console.log(`  • ${name} (last modified: ${lastModified.toISOString()})`);
  }

  // Prompt for confirmation
  console.log("\n⚠️  Do you want to delete these branches from R2? (yes/no): ");
  const confirmation = prompt();

  if (confirmation?.toLowerCase() !== "yes") {
    console.log("❌ Cleanup cancelled");
    return;
  }

  // Delete orphaned branches
  const s3 = createS3Client(config);

  for (const { name } of orphanedBranches) {
    console.log(`\n🗑️  Deleting branch: ${name}`);

    try {
      // List all objects with this prefix
      const response = await s3.list({ prefix: `${name}/` });
      const contents = response as unknown as S3ListResponse;

      if (contents.Contents) {
        for (const object of contents.Contents) {
          if (object.Key) {
            await s3.delete(object.Key);
            console.log(`  ✓ Deleted ${object.Key}`);
          }
        }
      }

      console.log(`✅ Branch ${name} deleted`);
    } catch (error) {
      console.error(`❌ Failed to delete branch ${name}:`, error);
    }
  }

  console.log("\n✅ Cleanup complete");
}

// Main execution
async function main() {
  const command = process.argv[2];

  if (command === "cleanup") {
    await cleanupOldBranches();
  } else {
    const branch = await getCurrentBranch();
    await uploadExamples(branch);
  }
}

main().catch((error) => {
  console.error("❌ Error:", error);
  process.exit(1);
});
