import { DiskSpaceCheck, HealthChecks, MemoryHeapCheck, MemoryRSSCheck } from '@adonisjs/core/health'
import { DbCheck } from '@adonisjs/lucid/database'
import db from '@adonisjs/lucid/services/db'

export const healthChecks = new HealthChecks().register([
  // System resource checks
  new DiskSpaceCheck()
    .warnWhenExceeds(80) // warn when disk usage over 80%
    .failWhenExceeds(90) // fail when disk usage over 90%
    .cacheFor('5 minutes'), // cache disk check for 5 minutes

  new MemoryHeapCheck()
    .warnWhenExceeds('300 mb') // warn when heap usage over 300MB
    .failWhenExceeds('500 mb'), // fail when heap usage over 500MB

  new MemoryRSSCheck()
    .warnWhenExceeds('400 mb') // warn when RSS usage over 400MB
    .failWhenExceeds('600 mb'), // fail when RSS usage over 600MB

  // Database connection check
  new DbCheck(db.connection())
    .cacheFor('1 minute'), // cache database check for 1 minute
])
