/**
 * Centralized Logger - SSR-safe
 */

import { debugConfig, LogLevel, LogCategory } from './config'

const isBrowser = typeof window !== 'undefined'

class Logger {
  private shouldLog(level: LogLevel, category: LogCategory): boolean {
    if (!isBrowser) return false

    return (
      debugConfig.isEnabled() &&
      level <= debugConfig.getLevel() &&
      debugConfig.isCategoryEnabled(category)
    )
  }

  private getCategoryColor(category: LogCategory): string {
    const colors: Record<LogCategory, string> = {
      [LogCategory.API]: '#06b6d4',
      [LogCategory.QUERY]: '#f59e0b',
      [LogCategory.MUTATION]: '#ef4444',
      [LogCategory.COMPONENT]: '#8b5cf6',
      [LogCategory.ANALYSIS]: '#10b981',
      [LogCategory.UPLOAD]: '#3b82f6',
    }
    return colors[category] || '#6b7280'
  }

  private log(level: LogLevel, category: LogCategory, message: string, data?: any): void {
    if (!this.shouldLog(level, category)) return

    const color = this.getCategoryColor(category)
    const timestamp = new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3
    })

    const formatted = `[${timestamp}] [${category}] ${message}`

    const consoleMethod = level === LogLevel.ERROR ? console.error :
                         level === LogLevel.WARN ? console.warn :
                         console.log

    if (data !== undefined) {
      consoleMethod(`%c${formatted}`, `color: ${color}; font-weight: bold`, data)
    } else {
      consoleMethod(`%c${formatted}`, `color: ${color}; font-weight: bold`)
    }
  }

  error(category: LogCategory, message: string, data?: any): void {
    this.log(LogLevel.ERROR, category, message, data)
  }

  warn(category: LogCategory, message: string, data?: any): void {
    this.log(LogLevel.WARN, category, message, data)
  }

  info(category: LogCategory, message: string, data?: any): void {
    this.log(LogLevel.INFO, category, message, data)
  }

  debug(category: LogCategory, message: string, data?: any): void {
    this.log(LogLevel.DEBUG, category, message, data)
  }
}

export const logger = new Logger()

if (isBrowser) {
  (window as any).__HELIX_LOGGER__ = logger
}
