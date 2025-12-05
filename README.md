# Firestore Backup Restore GUI

User-friendly web interface for restoring Firestore database backups. This tool simplifies the process of restoring Firebase Firestore backups with an intuitive step-by-step wizard.

📦 **Available on npm:** [`@agb-npm/firestore-backup-restore-gui`](https://www.npmjs.com/package/@agb-npm/firestore-backup-restore-gui)

![Firestore Restore GUI](https://img.shields.io/badge/Firestore-Restore-pink?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)
![License](https://img.shields.io/badge/License-MIT-pink?style=for-the-badge)
![npm](https://img.shields.io/npm/v/@agb-npm/firestore-backup-restore-gui?style=for-the-badge&logo=npm)

## Why This Tool?

### The Location Mismatch Problem

When trying to restore Firestore backups, you might encounter this frustrating error:

```
INVALID_ARGUMENT: Bucket your-project.firebasestorage.app is in location us-central1. 
This database can only operate on buckets spanning location asia or asia-northeast1.
```

**The Problem:**
- Firestore databases are region-specific (e.g., `asia-northeast1`)
- Backup files stored in Firebase Storage may be in a different region (e.g., `us-central1`)
- Firestore import operations require the backup bucket to be in a compatible region
- The `gcloud firestore import` command fails if there's a location mismatch

**Why This Tool Was Created:**
This tool was specifically developed to solve the location mismatch issue. It provides:
- Clear visibility of the problem with error messages
- Step-by-step wizard to guide you through the restore process
- Automatic handling of location compatibility
- Real-time monitoring of restore operations
- User-friendly interface instead of complex command-line operations

Instead of manually copying buckets, dealing with gcloud CLI commands, and troubleshooting location errors, this GUI simplifies the entire process into an intuitive, step-by-step workflow.

## Features

<img width="913" height="915" alt="image" src="https://github.com/user-attachments/assets/c281b1ef-1e59-4f90-b181-f90eae35b9ac" />

- **gcloud Authentication** - Easy Google Cloud authentication
- **Backup Selection** - Browse and select backups from Firebase Storage
- **Restore Wizard** - Step-by-step restore process with progress tracking
- **Real-time Status** - Monitor restore operations in real-time
- **Detailed Logs** - See exactly what's happening during restore
- **Fast & Efficient** - Optimized for quick restore operations

## Quick Start

### Prerequisites

- Node.js 18+ installed
- gcloud CLI installed (or will be installed automatically)
- Google Cloud account with Firestore access

### Installation

#### Option 1: Install from npm (Recommended)

```bash
# Install the package globally
npm install -g @agb-npm/firestore-backup-restore-gui

# Or install locally in your project
npm install @agb-npm/firestore-backup-restore-gui
```

If installed globally, you can run:
```bash
# Navigate to the installed package directory
cd $(npm root -g)/@agb-npm/firestore-backup-restore-gui

# Start the development server
npm run dev
```

#### Option 2: Clone from GitHub

```bash
# Clone the repository
git clone https://github.com/agb/firestore-restore-gui.git
cd firestore-restore-gui

# Install dependencies
npm install
# or
pnpm install
# or
yarn install

# Start development server
npm run dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### npm Package

📦 **Package:** [`@agb-npm/firestore-backup-restore-gui`](https://www.npmjs.com/package/@agb-npm/firestore-backup-restore-gui)

```bash
npm install @agb-npm/firestore-backup-restore-gui
```

## Usage Guide

### Step 1: Authentication

The GUI automatically checks if gcloud CLI is installed and if you're authenticated.

1. If gcloud CLI is not installed, follow the installation instructions shown
2. Run `gcloud auth login` in your terminal
3. Refresh the GUI page
4. You should see "Authenticated!" with your account info

### Step 2: Select Database

Choose the target Firestore database:
- **Select Project**: Choose from dropdown or use current project
- **Select Database**: Choose database ID (default: `(default)` or custom like `miraku-jp`)

### Step 3: Choose Backup Source

**Option A: Browse Backups**
- Click "Browse Backups" tab
- Available backups from Firebase Storage are listed
- Click on a backup to select it

**Option B: Manual Path**
- Click "Manual Path" tab
- Enter Google Cloud Storage path manually
- Format: `gs://bucket-name/folder-name`
- Example: `gs://my-project.firebasestorage.app/2025-11-29T17:04:03_93838`

### Step 4: Review & Confirm

Review your restore configuration:
- Project ID
- Database ID
- Backup path
- Warning about data overwriting

### Step 5: Start Restore

- Click "Start Restore" button
- Operation starts in background
- Automatically moves to progress monitoring

### Step 6: Monitor Progress

- Real-time status updates (checks every 3 seconds)
- Operation ID displayed
- Start/completion timestamps
- Success/error notifications

## Features in Detail

### Backup Browser

- List all backups in Firebase Storage
- Quick selection with visual feedback
- Backup path display

### Restore Wizard

Step-by-step process:
1. Authentication
2. Database Selection
3. Backup Selection
4. Review Configuration
5. Restore Execution
6. Completion

### Status Monitoring

- Operation status tracking
- Real-time updates (polling every 3 seconds)
- Error handling
- Success notifications

## Configuration

### Environment Variables

Create a `.env.local` file (optional):

```env
# Optional: Default project ID
NEXT_PUBLIC_DEFAULT_PROJECT_ID=your-project-id

# Optional: Default database ID
NEXT_PUBLIC_DEFAULT_DATABASE_ID=(default)
```

### gcloud CLI

The GUI uses gcloud CLI for operations. If not installed:

- The GUI will show installation instructions
- Or install manually: https://cloud.google.com/sdk/docs/install

## Project Structure

```
firestore-restore-gui/
├── app/                 # Next.js app directory
│   ├── api/            # API routes
│   │   ├── auth/       # Authentication endpoints
│   │   ├── backups/    # Backup listing endpoints
│   │   ├── databases/  # Database listing endpoints
│   │   ├── projects/   # Project listing endpoints
│   │   └── restore/    # Restore operation endpoints
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Main page
├── components/         # React components
│   └── RestoreWizard.tsx  # Main wizard component
├── lib/               # Utility functions
│   └── gcloud.ts      # gcloud CLI wrapper
└── public/            # Static assets
```

## API Endpoints

### `/api/auth/status`
Check authentication status

### `/api/projects`
List all available Google Cloud projects

### `/api/databases?projectId=PROJECT_ID`
List all databases in a project

### `/api/backups?projectId=PROJECT_ID`
List available backups in Firebase Storage for a project

### `/api/restore/start`
Start restore operation (POST with body: `{backupPath, projectId, databaseId}`)

### `/api/restore/status?operationName=OP_NAME&projectId=PROJECT_ID&databaseId=DB_ID`
Get restore operation status

## Troubleshooting

### gcloud CLI Not Found

```bash
# Install via snap (Linux)
sudo snap install google-cloud-cli

# Or install manually
curl https://sdk.cloud.google.com | bash
```

### Authentication Issues

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### Permission Errors

Ensure your Google Cloud account has:
- Firestore Admin permissions
- Storage Admin permissions

### Location Mismatch Error

**Common Error:**
```
INVALID_ARGUMENT: Bucket PROJECT_ID.firebasestorage.app is in location us-central1. 
This database can only operate on buckets spanning location asia or asia-northeast1.
```

**What This Means:**
Your Firestore database is in one region (e.g., `asia-northeast1`), but your backup is stored in a different region (e.g., `us-central1`). Firestore import operations require the backup bucket to be in a compatible location.

**Solution:**
1. **Check your database location:**
   - Go to Firebase Console → Firestore Database
   - Check the region shown (e.g., `asia-northeast1`)

2. **Check your backup bucket location:**
   - Go to Firebase Console → Storage
   - Check the bucket region

3. **If locations don't match:**
   - Create a new Storage bucket in the same region as your Firestore database
   - Copy the backup files to the new bucket
   - Use the new bucket path for restore

4. **Alternative:** Use this GUI tool, which guides you through the process and helps identify location mismatches early.

### Database Not Found

- Verify database ID is correct (not always `(default)`)
- Check database exists in Firebase Console
- Ensure you have proper permissions

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for details.

## License

MIT License - See [LICENSE](LICENSE) for details.

## Acknowledgments

- Built with Next.js 14
- UI inspired by Sakura theme
- Powered by Google Cloud Platform
- Icons from Lucide React

## Support

For issues or questions:
1. Check the Troubleshooting section
2. Open an issue on GitHub
3. Review the detailed logs in the GUI

---

Made for the Firebase community
