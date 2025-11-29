/**
 * gcloud CLI wrapper utilities
 */

import { execSync, exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export interface GcloudStatus {
  authenticated: boolean;
  account?: string;
  project?: string;
  database?: string;
}

export interface BackupInfo {
  name: string;
  path: string;
  size?: string;
  created?: string;
  location?: string;
}

export interface RestoreOperation {
  name: string;
  done: boolean;
  operationType?: string;
  startTime?: string;
  endTime?: string;
  error?: any;
}

/**
 * Check if gcloud CLI is installed
 */
export function isGcloudInstalled(): boolean {
  try {
    execSync("gcloud --version", { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get gcloud authentication status
 */
export async function getGcloudStatus(): Promise<GcloudStatus> {
  try {
    const accountOutput = execSync("gcloud auth list --filter=status:ACTIVE --format=value(account)", {
      encoding: "utf-8",
      stdio: "pipe",
    }).trim();

    const projectOutput = execSync("gcloud config get-value project", {
      encoding: "utf-8",
      stdio: "pipe",
    }).trim();

    return {
      authenticated: accountOutput.length > 0,
      account: accountOutput || undefined,
      project: projectOutput || undefined,
    };
  } catch {
    return {
      authenticated: false,
    };
  }
}

/**
 * Get list of projects
 */
export async function listProjects(): Promise<string[]> {
  try {
    const output = execSync("gcloud projects list --format=value(projectId)", {
      encoding: "utf-8",
    });
    return output
      .trim()
      .split("\n")
      .filter((p) => p.length > 0);
  } catch {
    return [];
  }
}

/**
 * Get list of Firestore databases
 */
export async function listDatabases(projectId: string): Promise<string[]> {
  try {
    const output = execSync(
      `gcloud firestore databases list --project=${projectId} --format=value(name)`,
      {
        encoding: "utf-8",
      }
    );
    return output
      .trim()
      .split("\n")
      .map((db) => {
        // Extract database ID from full path
        const match = db.match(/\/databases\/(.+)$/);
        return match ? match[1] : "(default)";
      })
      .filter((db) => db.length > 0);
  } catch {
    return ["(default)"];
  }
}

/**
 * List backups in Firebase Storage
 */
export async function listBackups(projectId: string): Promise<BackupInfo[]> {
  try {
    const bucket = `${projectId}.firebasestorage.app`;
    const output = execSync(`gsutil ls gs://${bucket}/`, {
      encoding: "utf-8",
      stdio: "pipe",
    });

    const lines = output
      .trim()
      .split("\n")
      .filter((line) => line.startsWith("gs://") && line.endsWith("/"));

    return lines.map((line) => {
      const match = line.match(/gs:\/\/.+\/(.+)\/$/);
      const name = match ? match[1] : line;
      return {
        name,
        path: line,
      };
    });
  } catch {
    return [];
  }
}

/**
 * Start restore operation
 */
export async function startRestore(
  backupPath: string,
  projectId: string,
  databaseId: string
): Promise<RestoreOperation> {
  try {
    const command = `gcloud firestore import ${backupPath} --database=${databaseId} --project=${projectId} --async`;
    const { stdout } = await execAsync(command);
    
    // Parse operation name from output
    const match = stdout.match(/name:\s*(.+)/);
    const operationName = match ? match[1].trim() : "";

    return {
      name: operationName,
      done: false,
      operationType: "IMPORT",
    };
  } catch (error: any) {
    throw new Error(error.message || "Failed to start restore");
  }
}

/**
 * Get restore operation status
 */
export async function getRestoreStatus(
  operationName: string,
  projectId: string,
  databaseId: string
): Promise<RestoreOperation> {
  try {
    const command = `gcloud firestore operations describe ${operationName} --database=${databaseId} --project=${projectId} --format=json`;
    const { stdout } = await execAsync(command);
    const operation = JSON.parse(stdout);

    return {
      name: operation.name,
      done: operation.done || false,
      operationType: operation.metadata?.operationType,
      startTime: operation.metadata?.startTime,
      endTime: operation.metadata?.endTime,
      error: operation.error || null,
    };
  } catch (error: any) {
    throw new Error(error.message || "Failed to get operation status");
  }
}

/**
 * List recent restore operations
 */
export async function listOperations(
  projectId: string,
  databaseId: string,
  limit: number = 10
): Promise<RestoreOperation[]> {
  try {
    const command = `gcloud firestore operations list --database=${databaseId} --project=${projectId} --limit=${limit} --format=json`;
    const { stdout } = await execAsync(command);
    const operations = JSON.parse(stdout);

    return operations.map((op: any) => ({
      name: op.name,
      done: op.done || false,
      operationType: op.metadata?.operationType,
      startTime: op.metadata?.startTime,
      endTime: op.metadata?.endTime,
      error: op.error || null,
    }));
  } catch {
    return [];
  }
}

