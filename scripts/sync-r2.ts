#!/usr/bin/env bun

import { readdir } from "node:fs/promises";
import { join } from "node:path";
import {
  createS3Client,
  getCurrentBranch,
  getLocalAndRemoteBranches,
  getR2Config,
  type R2Config,
} from "./r2-utils";

type S3ListResponse = {
  Contents?: Array<{ Key?: string; LastModified?: string }>;
};

async function uploadExamples(branch: string): Promise<void> {
  const s3 = createS3Client(getR2Config());

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
      const hasher = new Bun.CryptoHasher("md5");
      hasher.update(await file.arrayBuffer());
      const localHash = hasher.digest("hex");

      const remoteEtag = await s3
        .stat(key)
        .then((stats) => stats.etag.replace(/"/g, ""))
        .catch(() => undefined);

      if (remoteEtag === localHash) {
        console.log(`✓ ${filename} (unchanged)`);
        skippedCount++;
        continue;
      }

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

  console.log("\n⚠️  Do you want to delete these branches from R2? (yes/no): ");
  const confirmation = prompt();

  if (confirmation?.toLowerCase() !== "yes") {
    console.log("❌ Cleanup cancelled");
    return;
  }

  const s3 = createS3Client(config);

  for (const { name } of orphanedBranches) {
    console.log(`\n🗑️  Deleting branch: ${name}`);

    try {
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
