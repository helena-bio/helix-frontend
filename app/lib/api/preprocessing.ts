/**
 * Preprocessing API Client
 *
 * Calls variant-analysis-service (port 9001) for reference database
 * status, updates, and task management.
 */
import { tokenUtils } from '@/lib/auth/token'

const VA_API_URL = process.env.NEXT_PUBLIC_VA_API_URL || 'http://localhost:9001'

function authHeaders(): Record<string, string> {
  const token = tokenUtils.get()
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

// =========================================================================
// Types
// =========================================================================

export interface SourceStatus {
  exists: boolean
  path: string
  files_found: number
  files_expected: number
  total_size_bytes: number
  total_size_human: string
  oldest_file_modified: string | null
  newest_file_modified: string | null
}

export interface ConversionMetadata {
  start_time: string | null
  elapsed_seconds: number | null
  elapsed_human: string | null
  successful_chromosomes: number | null
  failed_chromosomes: number | null
}

export interface ParquetStatus {
  exists: boolean
  path: string
  partitions: number
  partitions_expected: number
  total_size_bytes: number
  total_size_human: string
  last_modified: string | null
  row_count: number | null
  conversion_metadata: ConversionMetadata | null
}

export interface ReferenceDBTable {
  loaded: boolean
  table_name: string
  row_count: number | null
  column_count: number | null
}

export interface FreshnessStatus {
  status: 'current' | 'stale' | 'not_loaded' | 'not_converted' | 'missing'
  message: string
  source_age_days: number | null
  parquet_age_days: number | null
  cache_ttl_days: number | null
  is_within_ttl: boolean | null
  suggested_action: string | null
}

export interface ValidationStatus {
  passed: boolean
  checks: Record<string, unknown>
}

export interface DatabaseStatus {
  name: string
  display_name: string
  version: string | null
  description: string | null
  priority: number
  enabled: boolean
  license_required: boolean
  vep_required: boolean
  source_url: string | null
  source: SourceStatus
  parquet: ParquetStatus
  reference_db: ReferenceDBTable
  freshness: FreshnessStatus
  validation: ValidationStatus
}

export interface ReferenceDBSummary {
  exists: boolean
  file_path: string
  file_size_bytes: number
  file_size_human: string
  last_modified: string | null
  tables: string[]
  total_rows: number
}

export interface AllDatabasesResponse {
  reference_db: ReferenceDBSummary
  databases: DatabaseStatus[]
}

export interface DatabaseDetailResponse extends DatabaseStatus {
  detail?: {
    columns?: string[]
    sample_rows?: Record<string, unknown>[]
    chromosomes?: Record<string, unknown>
    conversion_metadata_raw?: Record<string, unknown>
  }
}

export interface TaskStatus {
  task_id: string
  status: string
  started_at: string | null
  completed_at: string | null
  elapsed_seconds: number | null
  databases: Record<string, unknown>
  current_database: string | null
  current_step: string | null
  log_tail: string[]
  successful: number | null
  failed: number | null
  message?: string
}

export interface TaskListResponse {
  tasks: TaskStatus[]
  total: number
  running: number
}

export interface TaskCreatedResponse {
  task_id: string
  status: string
  databases: string[] | null
  status_url: string
  message: string | null
  warning: string | null
}

// =========================================================================
// API Functions
// =========================================================================

export const preprocessingApi = {

  async getDatabases(): Promise<AllDatabasesResponse> {
    const res = await fetch(`${VA_API_URL}/preprocessing/databases`, {
      headers: authHeaders(),
    })
    if (!res.ok) throw new Error(`Failed to fetch databases (${res.status})`)
    return res.json()
  },

  async getDatabase(dbName: string): Promise<DatabaseDetailResponse> {
    const res = await fetch(`${VA_API_URL}/preprocessing/databases/${dbName}`, {
      headers: authHeaders(),
    })
    if (!res.ok) throw new Error(`Failed to fetch database (${res.status})`)
    return res.json()
  },

  async updateDatabase(dbName: string, force: boolean = false): Promise<TaskCreatedResponse> {
    const res = await fetch(`${VA_API_URL}/preprocessing/databases/${dbName}/update`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ steps: ['download', 'convert', 'load'], force }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => null)
      throw new Error(err?.detail || `Failed to start update (${res.status})`)
    }
    return res.json()
  },

  async updateAll(force: boolean = false): Promise<TaskCreatedResponse> {
    const res = await fetch(`${VA_API_URL}/preprocessing/update-all`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ databases: null, force }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => null)
      throw new Error(err?.detail || `Failed to start update all (${res.status})`)
    }
    return res.json()
  },

  async rebuildReferenceDB(): Promise<TaskCreatedResponse> {
    const res = await fetch(`${VA_API_URL}/preprocessing/rebuild-reference-db`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify({ confirm: true }),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => null)
      throw new Error(err?.detail || `Failed to start rebuild (${res.status})`)
    }
    return res.json()
  },

  async getTask(taskId: string): Promise<TaskStatus> {
    const res = await fetch(`${VA_API_URL}/preprocessing/tasks/${taskId}`, {
      headers: authHeaders(),
    })
    if (!res.ok) throw new Error(`Failed to fetch task (${res.status})`)
    return res.json()
  },

  async getTasks(): Promise<TaskListResponse> {
    const res = await fetch(`${VA_API_URL}/preprocessing/tasks`, {
      headers: authHeaders(),
    })
    if (!res.ok) throw new Error(`Failed to fetch tasks (${res.status})`)
    return res.json()
  },
}
