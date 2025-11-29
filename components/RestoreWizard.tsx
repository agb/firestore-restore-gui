"use client";

import { useState, useEffect } from "react";
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  Loader2,
  Download,
  Database,
  FolderOpen,
  Info,
} from "lucide-react";

interface Step {
  id: number;
  title: string;
  description: string;
  component: React.ReactNode;
}

interface AuthStatus {
  installed: boolean;
  authenticated: boolean;
  account?: string;
  project?: string;
}

export default function RestoreWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [projects, setProjects] = useState<string[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [databases, setDatabases] = useState<string[]>([]);
  const [selectedDatabase, setSelectedDatabase] = useState<string>("(default)");
  const [backups, setBackups] = useState<any[]>([]);
  const [selectedBackup, setSelectedBackup] = useState<string>("");
  const [manualBackupPath, setManualBackupPath] = useState<string>("");
  const [useManualPath, setUseManualPath] = useState(false);
  const [loading, setLoading] = useState(false);
  const [restoreOperation, setRestoreOperation] = useState<any>(null);
  const [restoreStatus, setRestoreStatus] = useState<any>(null);

  // Load auth status
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Load projects when authenticated
  useEffect(() => {
    if (authStatus?.authenticated) {
      loadProjects();
    }
  }, [authStatus?.authenticated]);

  // Load databases when project selected
  useEffect(() => {
    if (selectedProject) {
      loadDatabases(selectedProject);
      loadBackups(selectedProject);
    }
  }, [selectedProject]);

  // Poll restore status
  useEffect(() => {
    if (restoreOperation && !restoreStatus?.done) {
      const interval = setInterval(() => {
        checkRestoreStatus();
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [restoreOperation, restoreStatus]);

  const checkAuthStatus = async () => {
    try {
      const res = await fetch("/api/auth/status");
      const data = await res.json();
      setAuthStatus(data);
      if (data.project) {
        setSelectedProject(data.project);
      }
    } catch (error) {
      console.error("Failed to check auth status:", error);
    }
  };

  const loadProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      setProjects(data.projects || []);
    } catch (error) {
      console.error("Failed to load projects:", error);
    }
  };

  const loadDatabases = async (projectId: string) => {
    try {
      const res = await fetch(`/api/databases?projectId=${projectId}`);
      const data = await res.json();
      setDatabases(data.databases || ["(default)"]);
      if (data.databases && data.databases.length > 0) {
        setSelectedDatabase(data.databases[0]);
      }
    } catch (error) {
      console.error("Failed to load databases:", error);
    }
  };

  const loadBackups = async (projectId: string) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/backups?projectId=${projectId}`);
      const data = await res.json();
      setBackups(data.backups || []);
    } catch (error) {
      console.error("Failed to load backups:", error);
    } finally {
      setLoading(false);
    }
  };

  const startRestore = async () => {
    if (!selectedProject || !selectedDatabase) return;

    const backupPath = useManualPath ? manualBackupPath : selectedBackup;

    if (!backupPath) {
      alert("Please select a backup or enter a backup path");
      return;
    }

    try {
      setLoading(true);
      const res = await fetch("/api/restore/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          backupPath,
          projectId: selectedProject,
          databaseId: selectedDatabase,
        }),
      });

      const data = await res.json();

      if (data.error) {
        const errorMsg =
          typeof data.error === "string"
            ? data.error
            : JSON.stringify(data.error);
        // Check if it's a location mismatch error
        if (errorMsg.includes("location") && errorMsg.includes("bucket")) {
          alert(
            `Location Mismatch Error:\n\n${errorMsg}\n\nThis is the exact problem this tool was created to solve. The backup bucket is in a different region than your Firestore database. Please check the Troubleshooting section in the README for solutions.`
          );
        } else {
          alert(`Error: ${errorMsg}`);
        }
        return;
      }

      setRestoreOperation(data.operation);
      setCurrentStep(5);
      checkRestoreStatus();
    } catch (error: any) {
      alert(`Failed to start restore: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkRestoreStatus = async () => {
    if (!restoreOperation || !selectedProject || !selectedDatabase) return;

    try {
      const res = await fetch(
        `/api/restore/status?operationName=${encodeURIComponent(restoreOperation.name)}&projectId=${selectedProject}&databaseId=${selectedDatabase}`
      );
      const data = await res.json();
      setRestoreStatus(data.status);
    } catch (error) {
      console.error("Failed to check restore status:", error);
    }
  };

  const steps: Step[] = [
    {
      id: 1,
      title: "Authentication",
      description: "Connect to Google Cloud",
      component: (
        <div className="space-y-4">
          {!authStatus?.installed && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
              <AlertCircle className="w-6 h-6 text-yellow-600 mb-2" />
              <h3 className="font-semibold text-yellow-900 mb-2">
                gcloud CLI Not Installed
              </h3>
              <p className="text-yellow-700 mb-4">
                Please install gcloud CLI to continue:
              </p>
              <div className="bg-white rounded-lg p-4 font-mono text-sm">
                sudo snap install google-cloud-cli
              </div>
              <p className="text-sm text-yellow-600 mt-2">
                Or visit:{" "}
                <a
                  href="https://cloud.google.com/sdk/docs/install"
                  target="_blank"
                  className="underline"
                >
                  https://cloud.google.com/sdk/docs/install
                </a>
              </p>
            </div>
          )}

          {authStatus?.installed && !authStatus?.authenticated && (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
              <AlertCircle className="w-6 h-6 text-blue-600 mb-2" />
              <h3 className="font-semibold text-blue-900 mb-2">
                Not Authenticated
              </h3>
              <p className="text-blue-700 mb-4">
                Please authenticate with Google Cloud:
              </p>
              <div className="bg-white rounded-lg p-4 font-mono text-sm">
                gcloud auth login
              </div>
              <p className="text-sm text-blue-600 mt-2">
                Run this command in your terminal, then refresh this page.
              </p>
            </div>
          )}

          {authStatus?.authenticated && (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6">
              <CheckCircle2 className="w-6 h-6 text-green-600 mb-2" />
              <h3 className="font-semibold text-green-900 mb-2">
                Authenticated!
              </h3>
              <p className="text-green-700">
                Account: <span className="font-mono">{authStatus.account}</span>
              </p>
              {authStatus.project && (
                <p className="text-green-700 mt-1">
                  Project:{" "}
                  <span className="font-mono">{authStatus.project}</span>
                </p>
              )}
            </div>
          )}

          {authStatus?.authenticated && (
            <button
              onClick={() => setCurrentStep(2)}
              className="w-full bg-white border-2 border-pink-300 text-pink-600 px-6 py-3 rounded-xl font-semibold hover:bg-pink-50 hover:border-pink-400 transition-colors"
            >
              Continue to Database Selection
            </button>
          )}
        </div>
      ),
    },
    {
      id: 2,
      title: "Database Selection",
      description: "Choose target database",
      component: (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Project ID
            </label>
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="w-full bg-white border-2 border-pink-200/60 rounded-xl px-4 py-3 focus:ring-pink-400/50 focus:border-pink-400 transition-colors"
            >
              <option value="">Select a project...</option>
              {projects.map((project) => (
                <option key={project} value={project}>
                  {project}
                </option>
              ))}
            </select>
          </div>

          {selectedProject && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Database ID
              </label>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-pink-500 animate-spin" />
                </div>
              ) : (
                <select
                  value={selectedDatabase}
                  onChange={(e) => setSelectedDatabase(e.target.value)}
                  className="w-full bg-white border-2 border-pink-200/60 rounded-xl px-4 py-3 focus:ring-pink-400/50 focus:border-pink-400 transition-colors"
                >
                  {databases.map((db) => (
                    <option key={db} value={db}>
                      {db}
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {selectedProject && selectedDatabase && (
            <button
              onClick={() => setCurrentStep(3)}
              className="w-full bg-white border-2 border-pink-300 text-pink-600 px-6 py-3 rounded-xl font-semibold hover:bg-pink-50 hover:border-pink-400 transition-colors"
            >
              Continue to Backup Selection
            </button>
          )}
        </div>
      ),
    },
    {
      id: 3,
      title: "Backup Selection",
      description: "Choose backup to restore",
      component: (
        <div className="space-y-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => setUseManualPath(false)}
              className={`flex-1 px-4 py-2 rounded-xl font-medium transition-colors ${
                !useManualPath
                  ? "bg-white border-2 border-pink-300 text-pink-600"
                  : "bg-pink-50 border-2 border-pink-200 text-slate-600"
              }`}
            >
              <FolderOpen className="w-5 h-5 inline mr-2" />
              Browse Backups
            </button>
            <button
              onClick={() => setUseManualPath(true)}
              className={`flex-1 px-4 py-2 rounded-xl font-medium transition-colors ${
                useManualPath
                  ? "bg-white border-2 border-pink-300 text-pink-600"
                  : "bg-pink-50 border-2 border-pink-200 text-slate-600"
              }`}
            >
              <Database className="w-5 h-5 inline mr-2" />
              Manual Path
            </button>
          </div>

          {!useManualPath ? (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Available Backups
              </label>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-pink-500 animate-spin" />
                </div>
              ) : backups.length === 0 ? (
                <div className="bg-pink-50 border-2 border-pink-200 rounded-xl p-6 text-center">
                  <p className="text-slate-600">
                    No backups found in Firebase Storage
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {backups.map((backup) => (
                    <button
                      key={backup.path}
                      onClick={() => setSelectedBackup(backup.path)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
                        selectedBackup === backup.path
                          ? "bg-pink-50 border-pink-300 text-pink-600"
                          : "bg-white border-pink-200/60 hover:border-pink-300 text-slate-700"
                      }`}
                    >
                      <div className="font-medium">{backup.name}</div>
                      <div className="text-sm text-slate-500 mt-1">
                        {backup.path}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Backup Path (gs://...)
              </label>
              <input
                type="text"
                value={manualBackupPath}
                onChange={(e) => setManualBackupPath(e.target.value)}
                placeholder="gs://bucket-name/folder-name"
                className="w-full bg-white border-2 border-pink-200/60 rounded-xl px-4 py-3 focus:ring-pink-400/50 focus:border-pink-400 transition-colors font-mono text-sm"
              />
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setCurrentStep(2)}
              className="flex-1 bg-white border-2 border-pink-200 text-slate-600 px-6 py-3 rounded-xl font-semibold hover:bg-pink-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={() => setCurrentStep(4)}
              disabled={
                !selectedBackup && (!useManualPath || !manualBackupPath)
              }
              className="flex-1 bg-white border-2 border-pink-300 text-pink-600 px-6 py-3 rounded-xl font-semibold hover:bg-pink-50 hover:border-pink-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Review Configuration
            </button>
          </div>
        </div>
      ),
    },
    {
      id: 4,
      title: "Review & Confirm",
      description: "Review restore configuration",
      component: (
        <div className="space-y-4">
          <div className="bg-white border-2 border-pink-200/60 rounded-xl p-6 space-y-4">
            <div>
              <div className="text-sm text-slate-500">Project</div>
              <div className="font-mono font-semibold text-slate-900">
                {selectedProject}
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-500">Database</div>
              <div className="font-mono font-semibold text-slate-900">
                {selectedDatabase}
              </div>
            </div>
            <div>
              <div className="text-sm text-slate-500">Backup Path</div>
              <div className="font-mono text-sm text-slate-900 break-all">
                {useManualPath ? manualBackupPath : selectedBackup}
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4">
            <AlertCircle className="w-5 h-5 text-yellow-600 inline mr-2" />
            <span className="text-sm text-yellow-800">
              This will restore the backup to your database. Existing data may
              be overwritten.
            </span>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setCurrentStep(3)}
              className="flex-1 bg-white border-2 border-pink-200 text-slate-600 px-6 py-3 rounded-xl font-semibold hover:bg-pink-50 transition-colors"
            >
              Back
            </button>
            <button
              onClick={startRestore}
              disabled={loading}
              className="flex-1 bg-white border-2 border-pink-300 text-pink-600 px-6 py-3 rounded-xl font-semibold hover:bg-pink-50 hover:border-pink-400 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 inline mr-2 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 inline mr-2" />
                  Start Restore
                </>
              )}
            </button>
          </div>
        </div>
      ),
    },
    {
      id: 5,
      title: "Restore Progress",
      description: "Monitoring restore operation",
      component: (
        <div className="space-y-4">
          {restoreStatus?.done ? (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-6 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-green-900 mb-2">
                Restore Completed!
              </h3>
              <p className="text-green-700">
                Your Firestore database has been restored successfully.
              </p>
              {restoreStatus.endTime && (
                <p className="text-sm text-green-600 mt-2">
                  Completed at:{" "}
                  {new Date(restoreStatus.endTime).toLocaleString()}
                </p>
              )}
            </div>
          ) : restoreStatus?.error ? (
            <div className="space-y-4">
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6">
                <AlertCircle className="w-6 h-6 text-red-600 mb-2" />
                <h3 className="font-semibold text-red-900 mb-2">
                  Restore Failed
                </h3>
                <div className="bg-white rounded-lg p-4 font-mono text-xs text-red-700 border border-red-300 break-all">
                  {typeof restoreStatus.error === "string"
                    ? restoreStatus.error
                    : JSON.stringify(restoreStatus.error, null, 2)}
                </div>
              </div>
              {typeof restoreStatus.error === "string" &&
              restoreStatus.error.includes("location") &&
              restoreStatus.error.includes("bucket") ? (
                <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
                  <Info className="w-6 h-6 text-yellow-600 mb-2" />
                  <h3 className="font-semibold text-yellow-900 mb-2">
                    Location Mismatch Detected
                  </h3>
                  <p className="text-yellow-800 text-sm mb-3">
                    This is the exact problem this tool was created to solve.
                    Your backup bucket is in a different region than your
                    Firestore database.
                  </p>
                  <div className="bg-white rounded-lg p-4 text-sm text-yellow-900 space-y-2">
                    <p className="font-semibold">To fix this:</p>
                    <ol className="list-decimal list-inside space-y-1 ml-2">
                      <li>
                        Check your Firestore database region in Firebase Console
                      </li>
                      <li>
                        Create a new Storage bucket in the same region as your
                        database
                      </li>
                      <li>Copy your backup files to the new bucket</li>
                      <li>Try restoring again with the new bucket path</li>
                    </ol>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 text-center">
              <Loader2 className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
              <h3 className="text-xl font-bold text-blue-900 mb-2">
                Restore in Progress
              </h3>
              <p className="text-blue-700">
                Your backup is being restored. This may take several minutes.
              </p>
              {restoreStatus?.startTime && (
                <p className="text-sm text-blue-600 mt-2">
                  Started at:{" "}
                  {new Date(restoreStatus.startTime).toLocaleString()}
                </p>
              )}
            </div>
          )}

          {restoreOperation && (
            <div className="bg-white border-2 border-pink-200/60 rounded-xl p-4">
              <div className="text-sm text-slate-500 mb-1">Operation ID</div>
              <div className="font-mono text-xs text-slate-900 break-all">
                {restoreOperation.name}
              </div>
            </div>
          )}

          {restoreStatus?.done && (
            <button
              onClick={() => {
                setCurrentStep(1);
                setRestoreOperation(null);
                setRestoreStatus(null);
              }}
              className="w-full bg-white border-2 border-pink-300 text-pink-600 px-6 py-3 rounded-xl font-semibold hover:bg-pink-50 hover:border-pink-400 transition-colors"
            >
              Restore Another Backup
            </button>
          )}
        </div>
      ),
    },
  ];

  const currentStepData = steps.find((s) => s.id === currentStep) || steps[0];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl border-2 border-pink-200/60 p-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            Firestore Backup Restore
          </h1>
          <p className="text-slate-600 mb-6">
            Step-by-step wizard to restore your Firestore database backups
          </p>

          {/* Why This Tool Info Banner */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-8">
            <div className="flex items-start gap-3">
              <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-2">
                  Why This Tool Was Created
                </h3>
                <p className="text-blue-800 text-sm mb-3">
                  Firestore restore operations can fail with location mismatch
                  errors. If you see this error:
                </p>
                <div className="bg-white rounded-lg p-4 mb-3 font-mono text-xs text-red-700 border border-red-200">
                  <div className="break-all">
                    INVALID_ARGUMENT: Bucket is in location us-central1. This
                    database can only operate on buckets spanning location asia
                    or asia-northeast1.
                  </div>
                </div>
                <p className="text-blue-800 text-sm">
                  This tool was created to solve this exact problem. It guides
                  you through the restore process step-by-step, handles location
                  compatibility, and provides real-time monitoring of restore
                  operations.
                </p>
              </div>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center justify-between mb-8 pb-8 border-b-2 border-pink-100">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                      currentStep > step.id
                        ? "bg-green-500 border-green-500 text-white"
                        : currentStep === step.id
                          ? "bg-pink-500 border-pink-500 text-white"
                          : "bg-white border-pink-200 text-slate-400"
                    }`}
                  >
                    {currentStep > step.id ? (
                      <CheckCircle2 className="w-6 h-6" />
                    ) : (
                      <Circle className="w-6 h-6" />
                    )}
                  </div>
                  <div className="mt-2 text-xs text-center max-w-[100px]">
                    <div
                      className={`font-medium ${
                        currentStep >= step.id
                          ? "text-slate-900"
                          : "text-slate-400"
                      }`}
                    >
                      {step.title}
                    </div>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 ${
                      currentStep > step.id ? "bg-green-500" : "bg-pink-100"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Current Step Content */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">
              {currentStepData.title}
            </h2>
            <p className="text-slate-600 mb-6">{currentStepData.description}</p>
            {currentStepData.component}
          </div>
        </div>
      </div>
    </div>
  );
}
