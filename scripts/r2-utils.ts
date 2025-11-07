import { $, S3Client } from "bun";

export interface R2Config {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
}

export function getR2Config(): R2Config {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
  const bucketName = process.env.R2_BUCKET_NAME;

  if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
    console.error("❌ Missing R2 configuration in environment variables");
    console.error(
      "Required: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME",
    );
    process.exit(1);
  }

  return { accountId, accessKeyId, secretAccessKey, bucketName };
}

export function getR2Endpoint(accountId: string): string {
  return `https://${accountId}.r2.cloudflarestorage.com`;
}

export function createS3Client(config: R2Config): S3Client {
  return new S3Client({
    endpoint: getR2Endpoint(config.accountId),
    accessKeyId: config.accessKeyId,
    secretAccessKey: config.secretAccessKey,
    bucket: config.bucketName,
  });
}

export async function getCurrentBranch(): Promise<string> {
  const result = await $`git branch --show-current`.text();
  return result.trim();
}

export async function getLocalAndRemoteBranches(): Promise<Set<string>> {
  const branches = new Set<string>();

  // Get local branches
  const localBranches = await $`git branch --format=%(refname:short)`.text();
  for (const branch of localBranches.split("\n")) {
    const trimmed = branch.trim();
    if (trimmed) branches.add(trimmed);
  }

  // Get remote branches (strip "origin/" prefix)
  const remoteBranches =
    await $`git branch -r --format=%(refname:short)`.text();
  for (const branch of remoteBranches.split("\n")) {
    const trimmed = branch.trim();
    if (trimmed?.startsWith("origin/")) {
      branches.add(trimmed.replace("origin/", ""));
    }
  }

  return branches;
}
