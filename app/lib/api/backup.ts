/**
 * Backup API Client
 *
 * Uses the shared API client (same base URL, auth, error handling).
 * Endpoints hit variant-analysis-service via nginx proxy.
 */
import { get, post, del } from './client'

// =========================================================================
// Types
// =========================================================================

export type BackupLevel = 'quick' | 'full' | 'complete'

export interface StartBackupResponse {
  backup_id: string
  status: string
}

export interface BackupStatusResponse {
  backup_id: string
  status: 'started' | 'running' | 'completed' | 'failed'
  progress: number
  current_step: string
  error: string | null
}

export interface BackupSummary {
  backup_id: string
  level: string
  status: string
  created_at: string | null
  completed_at: string | null
  duration_seconds: number | null
  total_size_bytes: number
}

export interface BackupListResponse {
  backups: BackupSummary[]
  total: number
}

export interface DeleteBackupResponse {
  backup_id: string
  deleted: boolean
}

// =========================================================================
// API
// =========================================================================

export const backupApi = {
  async startBackup(level: BackupLevel): Promise<StartBackupResponse> {
    return post<StartBackupResponse>('/api/v1/admin/backup', { level })
  },

  async getStatus(backupId: string): Promise<BackupStatusResponse> {
    return get<BackupStatusResponse>(`/api/v1/admin/backup/status/${backupId}`)
  },

  async listBackups(): Promise<BackupListResponse> {
    return get<BackupListResponse>('/api/v1/admin/backups')
  },

  async deleteBackup(backupId: string): Promise<DeleteBackupResponse> {
    return del<DeleteBackupResponse>(`/api/v1/admin/backup/${backupId}`)
  },
}
