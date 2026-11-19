# Lexware OBX Importer

This software allows you to import pCon OBX files as lexware office quotations.

## CloudFlare R2 Test File Sync

This project uses CloudFlare R2 to store and sync test example files across branches.
Test files in the `examples/` directory are automatically synced to R2 with branch-based versioning.

### Configuration

Add the following R2 configuration to your `.envrc` file:

```bash
export R2_ACCOUNT_ID="your_account_id"
export R2_ACCESS_KEY_ID="your_access_key_id"
export R2_SECRET_ACCESS_KEY="your_secret_access_key"
export R2_BUCKET_NAME="your_bucket_name"
```

### Usage

#### Manual Sync to R2

Upload the current branch's example files to R2:

```bash
bun run sync:r2
```

This will:

- Get the current git branch name
- Upload all files from `examples/` to R2 under the branch prefix
- Skip files that haven't changed (based on MD5 hash comparison)

Pass a branch name to upload under a different prefix, e.g. `bun run sync:r2 main`.

#### Merging Pull Requests

When a pull request is merged, the test workflow on `main` uploads the pull request branch's examples to `main` before downloading them.
Syncing to `main` before merging is not needed.
Files are only added or overwritten, so examples deleted on the branch stay on `main`.
If `main` changed an example after the branch last synced, the branch version overwrites it.

#### Download Examples from R2

Download example files for a specific branch:

```bash
# Download for current branch
bun run download:r2

# Download for a specific branch
bun run download:r2 main
```

#### Regenerate Expected Outputs

Rewrite the expected `lineItems` of every JSON file in `examples/` after an intended change to the generated quotations:

```bash
bun run regenerate:examples
```

Review the diff of the regenerated files, then upload them with `bun run sync:r2`.

#### Cleanup Old Branches

Remove test files for branches that no longer exist locally or on the remote:

```bash
bun run sync:r2:cleanup
```

This will:

1. List all branch prefixes in R2
2. Compare with local and remote git branches
3. Identify orphaned branches with files older than 7 days
4. Prompt for confirmation before deletion

**Note:** You must type "yes" to confirm deletion.

#### GitHub Secrets Setup

Add the following secrets to your GitHub repository (Settings → Secrets and variables → Actions):

- `R2_ACCOUNT_ID`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`

These credentials are required for both the test and sync workflows to access CloudFlare R2.

### R2 Path Structure

Files are organized by branch in R2:

```
bucket/
├── main/
│   ├── 01.obx
│   ├── 01-long.json
│   ├── 01-short.json
│   └── ...
├── feature-branch/
│   └── ...
└── add-to-existing-quotation/
    └── ...
```
