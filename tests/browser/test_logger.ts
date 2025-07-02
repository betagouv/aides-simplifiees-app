/**
 * Test logging utility for browser tests
 */

export interface TestLoggerOptions {
  timestamp?: boolean
  prefix?: string
  tabs?: number // Number of tabs for indentation
}

export class TestLogger {
  protected options: TestLoggerOptions

  constructor(options: TestLoggerOptions = {}) {
    this.options = {
      timestamp: true,
      ...options,
    }
  }

  protected colors = {
    reset: '\x1B[0m',
    bright: '\x1B[1m',
    dim: '\x1B[2m',
    pass: '\x1B[32m', // Green
    info: '\x1B[36m', // Cyan
    warn: '\x1B[33m', // Yellow
    error: '\x1B[31m', // Red
    debug: '\x1B[90m', // Gray
    gray: '\x1B[90m', // Gray
  }

  protected levelColors = {
    PASS: this.colors.pass,
    INFO: this.colors.info,
    WARN: this.colors.warn,
    ERROR: this.colors.error,
    DEBUG: this.colors.gray,
  }

  protected symbols = {
    PASS: '✓',
    INFO: 'ℹ',
    WARN: '⚠',
    ERROR: '✗',
    DEBUG: '•',
  }

  protected formatMessage(level: string, message: string): string {
    const reset = this.colors.reset
    const levelColor = this.levelColors[level as keyof typeof this.levelColors] || ''
    const symbol = this.symbols[level as keyof typeof this.symbols] || ''

    // Format timestamp if enabled
    const timestamp = this.options.timestamp
      ? `${this.colors.gray}[${new Date().toLocaleTimeString()}]${reset} `
      : ''

    // Format prefix if present
    const prefix = this.options.prefix
      ? `${this.colors.gray}[${this.options.prefix}]${reset} `
      : ''

    // Calculate indentation
    const space = this.options.tabs ? '  '.repeat(this.options.tabs) : ''

    // Colorize only the symbol and level indicator
    const formattedLevel = `${levelColor}${symbol}${reset}`

    return `${space}${timestamp}${prefix}${formattedLevel} ${message}`
  }

  success(message: string): void {
    console.log(this.formatMessage('PASS', message))
  }

  info(message: string): void {
    console.log(this.formatMessage('INFO', message))
  }

  warn(message: string): void {
    console.warn(this.formatMessage('WARN', message))
  }

  error(message: string): void {
    console.error(this.formatMessage('ERROR', message))
  }

  debug(message: string): void {
    console.debug(this.formatMessage('DEBUG', message))
  }

  /**
   * Output a block of text with consistent indentation
   * Useful for displaying multi-line test results or error messages
   */
  outputBlock(text: string): void {
    if (!text)
      return

    const space = this.options.tabs ? '  '.repeat(this.options.tabs) : ''
    const lines = text.toString().trim().split('\n')

    // Add indentation to each line with a vertical pipe character
    lines.forEach((line) => {
      if (line.trim()) {
        console.log(`${space}${this.colors.gray}│  ${line}${this.colors.reset}`)
      }
    })
  }
}

class A11YLogger extends TestLogger {
  constructor(options: TestLoggerOptions = {}) {
    super({
      prefix: 'A11Y/AXE',
      timestamp: false,
      tabs: 1,
      ...options,
    })
  }

  accessibility(testName: string, violationsCount: number, criticalCount: number = 0): void {
    const testNameColored = `${this.colors.bright}${testName}${this.colors.reset}`
    const reset = this.colors.reset

    // Calculate indentation
    const space = this.options.tabs ? '  '.repeat(this.options.tabs) : ''

    // Format timestamp if enabled
    const timestamp = this.options.timestamp
      ? `${this.colors.gray}[${new Date().toLocaleTimeString()}]${reset} `
      : ''

    // Format prefix if present
    const prefix = this.options.prefix
      ? `${this.colors.gray}[${this.options.prefix}]${reset} `
      : ''

    // Build the message with custom symbol placement
    if (criticalCount > 0) {
      // Error with critical violations
      const symbol = `${this.colors.error}${this.symbols.ERROR}${reset}`
      const statusText = `${testNameColored}: ${symbol} ${this.colors.error}${violationsCount} violations${reset} (${this.colors.error}${criticalCount} critical${reset})`
      console.error(`${space}${timestamp}${prefix}${statusText}`)
    }
    else if (violationsCount > 0) {
      // Warning with non-critical violations
      const symbol = `${this.colors.warn}${this.symbols.WARN}${reset}`
      const statusText = `${testNameColored}: ${symbol} ${this.colors.warn}${violationsCount} violations${reset}`
      console.warn(`${space}${timestamp}${prefix}${statusText}`)
    }
    else {
      // Success with no violations
      const symbol = `${this.colors.pass}${this.symbols.PASS}${reset}`
      const statusText = `${testNameColored}: ${symbol} ${this.colors.pass}passed${reset}`
      console.log(`${space}${timestamp}${prefix}${statusText}`)
    }
  }

  /**
   * Log a report message with a special format
   */
  report(message: string): void {
    const reset = this.colors.reset
    const space = this.options.tabs ? '  '.repeat(this.options.tabs) : ''
    const timestamp = this.options.timestamp
      ? `${this.colors.gray}[${new Date().toLocaleTimeString()}]${reset} `
      : ''
    const prefix = this.options.prefix
      ? `${this.colors.gray}[${this.options.prefix}]${reset}` // No space after prefix
      : ''

    // Format with [REPORT SAVED] in blue
    const reportPrefix = `${this.colors.info}[REPORT SAVED]${reset}`
    console.log(`${space}${timestamp}${prefix}${reportPrefix} ${message}`)
  }
}

// Default logger instance for accessibility tests
export const accessibilityLogger = new A11YLogger()
