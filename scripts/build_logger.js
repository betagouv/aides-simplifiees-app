/**
 * Simple logging utility for build scripts
 * Provides consistent, colorful output without emojis
 */

// ANSI color codes
const colors = {
  reset: '\x1B[0m',
  bright: '\x1B[1m',
  dim: '\x1B[2m',
  red: '\x1B[31m',
  green: '\x1B[32m',
  yellow: '\x1B[33m',
  blue: '\x1B[34m',
  magenta: '\x1B[35m',
  cyan: '\x1B[36m',
  white: '\x1B[37m',
  gray: '\x1B[90m',
}

class BuildLogger {
  constructor(prefix = '') {
    this.prefix = prefix
  }

  formatMessage(level, message, color = colors.reset) {
    const timestamp = new Date().toLocaleTimeString('fr-FR', { hour12: false })
    const prefixPart = this.prefix ? `[${this.prefix}]` : ''
    const levelPart = `[${level.toUpperCase()}]`

    return `${colors.gray}${timestamp}${colors.reset} ${color}${prefixPart}${levelPart}${colors.reset} ${message}`
  }

  info(message) {
    console.log(this.formatMessage('info', message, colors.blue))
  }

  success(message) {
    console.log(this.formatMessage('success', message, colors.green))
  }

  warning(message) {
    console.warn(this.formatMessage('warn', message, colors.yellow))
  }

  error(message) {
    console.error(this.formatMessage('error', message, colors.red))
  }

  step(message) {
    console.log(this.formatMessage('step', message, colors.cyan))
  }

  debug(message) {
    console.log(this.formatMessage('debug', message, colors.gray))
  }

  // Method for indented output blocks
  outputBlock(text) {
    if (!text)
      return

    const lines = text.toString().trim().split('\n')
    // Add indentation to each line
    lines.forEach((line) => {
      if (line.trim()) {
        console.log(`${colors.gray}│  ${line}${colors.reset}`)
      }
    })
  }

  // Special methods for build processes
  startProcess(processName) {
    console.log(`\n${colors.bright}${colors.blue}Starting ${processName}...${colors.reset}\n`)
  }

  completeProcess(processName) {
    console.log(`\n${colors.bright}${colors.green}${processName} completed successfully!${colors.reset}\n`)
  }

  failProcess(processName, error) {
    console.error(`\n${colors.bright}${colors.red}${processName} failed!${colors.reset}`)
    if (error) {
      console.error(`${colors.red}Error: ${error}${colors.reset}\n`)
    }
  }
}

// Export a default logger and the class for custom instances
const logger = new BuildLogger()

export { BuildLogger, logger }
