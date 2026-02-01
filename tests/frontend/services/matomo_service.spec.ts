import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock the error tracker module
vi.mock('~/utils/error_tracker', () => ({
  captureMessage: vi.fn(),
  captureError: vi.fn(),
}))

/**
 * Tests for Matomo service event validation
 * Ensures only whitelisted event actions are tracked
 */
describe('matomo service - event action validation', () => {
  let mockPaq: any[]
  let consoleWarnSpy: any
  let captureMessageMock: any

  beforeEach(async () => {
    // Get mocked captureMessage
    const errorTracker = await import('~/utils/error_tracker')
    captureMessageMock = errorTracker.captureMessage as any
    vi.clearAllMocks()

    // Reset modules to get fresh state for flow sessions
    vi.resetModules()

    // Mock window object and _paq array
    mockPaq = []
    ;(globalThis as any).window = {
      _paq: mockPaq,
      location: {
        href: 'https://example.com',
      },
    }
    ;(globalThis as any).import = {
      meta: {
        env: {
          SSR: false,
          DEV: true, // Enable console.warn in dev mode
        },
      },
    }

    // Spy on console.warn
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    delete (globalThis as any).window
    delete (globalThis as any).import
  })

  describe('valid event actions', () => {
    const validActions = ['Start', 'Answer', 'Submit', 'Eligibility', 'IntermediaryResults']

    it.each(validActions)('should track valid action: %s', async (action) => {
      // Dynamically import to use the mocked window
      const { trackEvent } = await import('../../../inertia/services/matomo_service')

      trackEvent('TestCategory', action, 'test-name', 1)

      expect(mockPaq).toHaveLength(1)
      expect(mockPaq[0]).toEqual(['trackEvent', 'TestCategory', action, 'test-name', 1])
      expect(captureMessageMock).not.toHaveBeenCalled()
      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })
  })

  describe('invalid event actions (attacks)', () => {
    const attackPatterns = [
      // SQL Injection
      'Start\'/**/and(select\'1\'from/**/pg_sleep(2))::text>\'0',
      'Start\'and(select*from(select sleep(2))a/**/union/**/select 1)=\'',
      'Start\'and(select 1)>0waitfor/**/delay\'0:0:2',
      'Start\'and/**/extractvalue(1,concat(char(126),md5(...)))and\'',

      // Template Injection - using concatenation to avoid linting issues
      '#set($c=804944746 932229130)' + '${' + 'c}$c',
      '${' + '(813043097 830434709)?c}',
      '${' + '@var_dump(md5(412667510))};',
      '<%- 819283060 962660361 %>',

      // Command Injection
      'expr 805318495   806636931',
      'Start&set /A 815381304 945610728',
      'Start$(expr 887929818   922506085)',

      // XPath Injection
      'extractvalue(1,concat(char(126),md5(1214287728)))',

      // Invalid/unknown actions
      'InvalidAction',
      'CustomAction',
      '',
      'start', // case-sensitive
      'SUBMIT', // case-sensitive
    ]

    it.each(attackPatterns)('should reject invalid action: %s', async (action) => {
      const { trackEvent } = await import('../../../inertia/services/matomo_service')

      trackEvent('TestCategory', action, 'test-name', 1)

      // Event should NOT be tracked in _paq
      expect(mockPaq).toHaveLength(0)

      // Error tracker should capture security warning
      expect(captureMessageMock).toHaveBeenCalledWith(
        `[Matomo Security] Invalid event action rejected: "${action}"`,
        'warning',
      )

      // Console warning should also be logged in dev mode
      expect(consoleWarnSpy).toHaveBeenCalled()
      const warnCall = consoleWarnSpy.mock.calls[0]
      expect(warnCall[0]).toContain('[Matomo] Rejected invalid event action')
      expect(warnCall[0]).toContain(action)
    })
  })

  describe('edge cases', () => {
    it('should handle SSR environment (no tracking)', async () => {
      ;(globalThis as any).import.meta.env.SSR = true

      const { trackEvent } = await import('../../../inertia/services/matomo_service')

      trackEvent('TestCategory', 'Start', 'test-name', 1)

      expect(mockPaq).toHaveLength(0)
      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })

    it('should handle missing window._paq', async () => {
      delete (globalThis as any).window._paq

      const { trackEvent } = await import('../../../inertia/services/matomo_service')

      trackEvent('TestCategory', 'Start', 'test-name', 1)

      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })
  })
})

/**
 * Tests for Flow Session ID tracking
 * Ensures user journeys can be correlated across events
 */
describe('matomo service - flow session tracking', () => {
  let mockPaq: any[]
  let mockRandomUUID: ReturnType<typeof vi.fn>

  beforeEach(async () => {
    vi.resetModules()

    mockPaq = []
    ;(globalThis as any).window = {
      _paq: mockPaq,
      location: {
        href: 'https://aides.beta.numerique.gouv.fr/simulateur/test',
      },
    }

    // Mock crypto.randomUUID using vi.stubGlobal
    mockRandomUUID = vi.fn().mockReturnValue('12345678-1234-1234-1234-123456789012')
    vi.stubGlobal('crypto', {
      randomUUID: mockRandomUUID,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    delete (globalThis as any).window
  })

  describe('flow session ID generation', () => {
    it('should generate a flow session ID', async () => {
      const { getFlowSessionId } = await import('../../../inertia/services/matomo_service')

      // Get a new session ID
      const flowId = getFlowSessionId('test-simulator', true)
      expect(flowId).toBe('12345678')
      expect(mockRandomUUID).toHaveBeenCalled()
    })

    it('should reuse existing flow session ID when not starting new', async () => {
      const { getFlowSessionId } = await import('../../../inertia/services/matomo_service')

      // First call creates the session
      const flowId1 = getFlowSessionId('test-simulator', true)
      // Second call reuses it
      const flowId2 = getFlowSessionId('test-simulator', false)

      expect(flowId1).toBe('12345678')
      expect(flowId2).toBe('12345678')
      expect(mockRandomUUID).toHaveBeenCalledTimes(1)
    })

    it('should create new flow session ID when isNewSession is true', async () => {
      let callCount = 0
      mockRandomUUID.mockImplementation(() => {
        callCount++
        return callCount === 1 ? '11111111-aaaa-bbbb-cccc-dddddddddddd' : '22222222-aaaa-bbbb-cccc-dddddddddddd'
      })

      const { getFlowSessionId } = await import('../../../inertia/services/matomo_service')

      const flowId1 = getFlowSessionId('test-simulator', true)
      const flowId2 = getFlowSessionId('test-simulator', true) // New session

      expect(flowId1).toBe('11111111')
      expect(flowId2).toBe('22222222')
      expect(mockRandomUUID).toHaveBeenCalledTimes(2)
    })

    it('should track different flow sessions per simulator', async () => {
      let callCount = 0
      mockRandomUUID.mockImplementation(() => {
        callCount++
        return `${callCount}${callCount}${callCount}${callCount}${callCount}${callCount}${callCount}${callCount}-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
      })

      const { getFlowSessionId } = await import('../../../inertia/services/matomo_service')

      const flowIdA = getFlowSessionId('simulator-a', true)
      const flowIdB = getFlowSessionId('simulator-b', true)

      expect(flowIdA).toBe('11111111')
      expect(flowIdB).toBe('22222222')
    })

    it('should clear flow session', async () => {
      let callCount = 0
      mockRandomUUID.mockImplementation(() => {
        callCount++
        return `${callCount}${callCount}${callCount}${callCount}${callCount}${callCount}${callCount}${callCount}-xxxx-xxxx-xxxx-xxxxxxxxxxxx`
      })

      const { getFlowSessionId, clearFlowSession } = await import('../../../inertia/services/matomo_service')

      getFlowSessionId('test-sim', true)
      expect(getFlowSessionId('test-sim')).toBe('11111111')

      clearFlowSession('test-sim')

      // Next call creates new session
      expect(getFlowSessionId('test-sim')).toBe('22222222')
    })
  })
})
