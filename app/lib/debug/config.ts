/**
 * Debug Configuration - SSR-safe
 */

export enum LogLevel {
  NONE = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
}

export enum LogCategory {
  API = 'API',
  QUERY = 'QUERY',
  MUTATION = 'MUTATION',
  COMPONENT = 'COMPONENT',
  ANALYSIS = 'ANALYSIS',
  UPLOAD = 'UPLOAD',
}

interface DebugConfig {
  enabled: boolean
  level: LogLevel
  categories: Set<LogCategory>
}

const isBrowser = typeof window !== 'undefined'

class DebugConfiguration {
  private config: DebugConfig

  constructor() {
    const isDev = process.env.NODE_ENV === 'development'

    this.config = {
      enabled: isDev,
      level: isDev ? LogLevel.DEBUG : LogLevel.WARN,
      categories: new Set(Object.values(LogCategory)),
    }

    if (isBrowser) {
      (window as any).__HELIX_DEBUG__ = {
        enable: () => this.enable(),
        disable: () => this.disable(),
        setLevel: (level: LogLevel) => this.setLevel(level),
        getConfig: () => ({ ...this.config, categories: Array.from(this.config.categories) }),
      }
    }
  }

  isEnabled(): boolean {
    return this.config.enabled
  }

  getLevel(): LogLevel {
    return this.config.level
  }

  isCategoryEnabled(category: LogCategory): boolean {
    return this.config.categories.has(category)
  }

  enable(): void {
    this.config.enabled = true
  }

  disable(): void {
    this.config.enabled = false
  }

  setLevel(level: LogLevel): void {
    this.config.level = level
  }
}

export const debugConfig = new DebugConfiguration()
