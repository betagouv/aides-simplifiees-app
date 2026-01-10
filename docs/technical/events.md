# Application Events

This module coordinates startup validations that must complete before the application accepts HTTP requests.

## Trigger: `http:server_ready`

This event fires when the HTTP server is ready to accept connections. The application listens for this event in `start/events.ts`.

## Validation Sequence

1. **Environment Validation** (`start/env_validation.ts`)
   - Checks presence of required environment variables.
   - Verifies `APP_ENV` configuration.
   - Ensures production secrets exist.

2. **Database Validation** (`start/db_validation.ts`)
   - **Connectivity**: Executes `SELECT 1` to test connection.
   - **Schema**: Checks for existence of `adonis_schema`.
   - **Migrations**: Verifies at least one migration has run.

## Failure Behavior

If any validation step fails:
1. A descriptive error is logged to the console.
2. The process exits immediately with code `1`.
3. The HTTP server does not start accepting requests.
