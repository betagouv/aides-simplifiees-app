# Plan: Statistics Sync Scheduler

## Date
Created: 2026-02-01

## Context

The `statistics:sync` command aggregates daily statistics from multiple sources (form_submissions, Matomo) into the `statistics_snapshots` table. This command needs to run automatically every day to keep the statistics up to date.

Currently, there is no automated scheduling mechanism. The command must be run manually.

## Objectives

- [ ] Implement automated daily execution of `statistics:sync`
- [ ] Maintain consistency with existing infrastructure patterns
- [ ] Provide visibility into sync status and errors
- [ ] Add Makefile commands for management

## Alternatives Analysis

### Option 1: Docker Service with Sleep Loop (Recommended)

**Description**: Add a dedicated Docker service that runs the sync command daily, similar to the existing `db-backup` service pattern.

**Pros**:
- Consistent with existing infrastructure (`db-backup` uses this pattern)
- Self-contained within Docker Compose
- No external dependencies (no cron on host)
- Portable across environments
- Logs accessible via `docker compose logs`
- Automatic restart on failure

**Cons**:
- Slightly more complex than simple cron
- Uses minimal resources continuously

**Implementation**:
```yaml
statistics-sync:
  image: ghcr.io/betagouv/aides-simplifiees-app:latest
  command: sh -c "while true; do node build/bin/console statistics:sync && sleep 86400; done"
```

### Option 2: Host Cron Job

**Description**: Configure crontab on the Docker host to run the command via `docker compose run`.

**Pros**:
- Simple to understand
- Native OS scheduling
- No additional container running

**Cons**:
- Breaks infrastructure-as-code principle
- Not portable (requires manual setup on each server)
- Inconsistent with existing patterns
- Harder to track/version control

**Implementation**:
```bash
0 2 * * * docker compose -f /path/to/docker-compose.prod.yml run --rm main-app node build/bin/console statistics:sync
```

### Option 3: AdonisJS Scheduler Package

**Description**: Install `@adonisjs/scheduler` or `@rlanz/adonis-scheduler` for in-app scheduling.

**Pros**:
- Elegant code-based scheduling
- Runs within the application

**Cons**:
- Requires additional dependency
- Adds complexity to the application
- Runs inside main-app (resource sharing)
- Overkill for a single daily task
- Less visibility (logs mixed with app logs)

### Option 4: Dedicated Cron Container (ofelia, supercronic)

**Description**: Use a specialized cron container like `mcuadros/ofelia` that reads schedule from Docker labels.

**Pros**:
- More flexible scheduling syntax
- Label-based configuration

**Cons**:
- Additional dependency
- Overly complex for a single task
- Not consistent with existing patterns

## Recommendation

**Option 1: Docker Service with Sleep Loop**

**Rationale**:
1. **Consistency**: The `db-backup` service already uses this exact pattern for daily tasks
2. **Portability**: No host-level configuration required
3. **Infrastructure-as-code**: Everything is defined in docker-compose files
4. **Observability**: Logs are accessible via standard Docker commands
5. **Simplicity**: No additional dependencies or packages needed

## Implementation Steps

### Phase 1: Docker Compose Services
1. [x] Add `statistics-sync` service to `docker-compose.prod.yml`
2. [x] Add `statistics-sync` service to `docker-compose.preprod.yml`
3. [x] Add resource limits anchor for the service

### Phase 2: Makefile Integration
4. [x] Add `stats-sync-logs` command
5. [x] Add `stats-sync-run` command for manual execution
6. [x] Add `stats-sync-backfill` command for historical data

### Phase 3: Documentation
7. [x] Update `docs/technical/services.md` with scheduling information

## Files Modified

- `infra/docker-compose.prod.yml`: Add statistics-sync service
- `infra/docker-compose.preprod.yml`: Add statistics-sync service
- `Makefile`: Add management commands
- `docs/technical/services.md`: Document the scheduler

## Configuration

### Timing
- **Execution time**: 02:00 UTC daily
- **Rationale**: After midnight to capture complete previous day data, before business hours

### Environment Variables (optional, for future flexibility)
- `STATS_SYNC_INTERVAL`: Interval in seconds (default: 86400 = 24h)
- `STATS_SYNC_HOUR`: Hour to run (default: 2)

## History

- 2026-02-01: Plan created, alternatives analyzed
- 2026-02-01: Implementation completed
