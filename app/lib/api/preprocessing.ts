/**
 * Preprocessing API Client
 *
 * Uses the shared API client (same base URL, auth, error handling).
 * Endpoints hit variant-analysis-service via nginx proxy.
 */
import { get, post } from './client'

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
    return get<AllDatabasesResponse>('/preprocessing/databases')
  },

  async getDatabase(dbName: string): Promise<DatabaseDetailResponse> {
    return get<DatabaseDetailResponse>('/preprocessing/databases/' + dbName)
  },

  async updateDatabase(dbName: string, force: boolean = false): Promise<TaskCreatedResponse> {
    return post<TaskCreatedResponse>('/preprocessing/databases/' + dbName + '/update', {
      steps: ['download', 'convert', 'load'],
      force,
    })
  },

  async updateAll(force: boolean = false): Promise<TaskCreatedResponse> {
    return post<TaskCreatedResponse>('/preprocessing/update-all', {
      databases: null,
      force,
    })
  },

  async rebuildReferenceDB(): Promise<TaskCreatedResponse> {
    return post<TaskCreatedResponse>('/preprocessing/rebuild-reference-db', {
      confirm: true,
    })
  },

  async getTask(taskId: string): Promise<TaskStatus> {
    return get<TaskStatus>('/preprocessing/tasks/' + taskId)
  },

  async getTasks(): Promise<TaskListResponse> {
    return get<TaskListResponse>('/preprocessing/tasks')
  },
}
