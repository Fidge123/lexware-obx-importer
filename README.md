# Lexware OBX Importer

This software allows you to import pCon OBX files as lexware office quotations.

## Telemetry (PostHog)

The app can send opt-in error and performance events to PostHog in the EU region.
Telemetry is off until the user enables "Diagnosedaten senden" in the settings.
Events are identified by a random install ID and credentials are redacted from every message before it is stored.

| Event                 | Properties                                           |
| --------------------- | ---------------------------------------------------- |
| `operation_completed` | `operation`, `integration`, `success`, `duration_ms` |
| `error_occurred`      | `operation`, `integration`, `code`, `message`        |
| `app_started`         | `duration_ms`                                        |

Every event also carries `app`, `app_version`, `os_name` and `os_version`.

The PostHog project key is read from `VITE_POSTHOG_API_KEY` at build time.
Only the release workflow sets it, so local and CI builds send nothing.
When the variable is set for `bun test`, a live test sends one event as the distinct ID `lexware-obx-importer-integration-test`.

### Sharing one PostHog project with lkr-planner

The PostHog free plan allows only one project, so this app and lkr-planner share it.
Both apps send the same event names, so the `app` property is what keeps their data apart.

1. Create one project in the PostHog EU cloud and copy its project API key (`phc_...`) from the project settings.
2. Add that key as the repository secret `POSTHOG_API_KEY` in both GitHub repositories.
3. Filter every insight and dashboard on `app`, ideally with a dashboard-wide filter: `app = lexware-obx-importer` for this app.
4. lkr-planner does not send an `app` property, so filter its insights on `app is not set` until it adds `app = lkr-planner`.
5. Under project settings, add a test account filter for distinct IDs containing `integration-test` and enable it by default, so the CI live tests of both apps stay out of the charts.

The free monthly event allowance is shared by both apps.
On the free plan PostHog stops ingesting once the allowance is used up instead of charging, so the cost risk is losing events late in the month.
Neither app uses autocapture or session replay, so the volume stays at a few events per user action.

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

#### Download Examples from R2

Download example files for a specific branch:

```bash
# Download for current branch
bun run download:r2

# Download for a specific branch
bun run download:r2 main
```

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
