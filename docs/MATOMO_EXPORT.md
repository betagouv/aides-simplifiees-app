# Matomo Data Export Command

This AdonisJS Ace command exports Matomo tracking data to CSV format for analytics and data visualization purposes.

## Usage

### Basic Usage

```bash
# Export last 8 weeks of data (default)
node ace export:matomo
```

### Advanced Usage

```bash
# Export specific number of weeks
node ace export:matomo --weeks=12

# Include Answer tracking events
node ace export:matomo --include-answers

# Specify custom output file
node ace export:matomo --output=./data/matomo_analytics.csv

# Combine multiple options
node ace export:matomo --weeks=4 --include-answers --output=./data/detailed_export.csv
```

## Command Options

- `--weeks=<number>`: Number of past weeks to fetch (default: 8)
- `--output=<path>`: Output CSV file path (default: ./matomo_export.csv)
- `--include-answers`: Include 'Answer' actions in addition to Start/Submit/Eligibility
- `--help`: Show command help

## Output Format

The script generates a CSV file with the following columns:

- **simulateur_slug**: The simulator identifier (e.g., "aide-renovation-energetique")
- **simulateur_title**: The human-readable simulator title
- **period_start**: Start date of the data period (YYYY-MM-DD format)
- **period_end**: End date of the data period (YYYY-MM-DD format)
- **week**: ISO week identifier (YYYY-Www format)
- **action**: The tracked action type
  - `Start`: User started the simulator
  - `Submit`: User submitted the form
  - `Eligibility`: User reached eligibility results
  - `Answer`: User answered a question (only if `--include-answers` is used)
- **count**: Number of events for this action

## Configuration

The script requires the following environment variables to be set:

- `MATOMO_URL`: Your Matomo instance URL
- `MATOMO_TOKEN`: Your Matomo API authentication token
- `MATOMO_SITE_ID`: Your Matomo site ID

## Data Processing

The script:

1. Fetches all published simulators from the database
2. Retrieves tracking data from Matomo API for specified time periods
3. Processes and aggregates the data by simulator, time period, and action type
4. Exports the results to a CSV file in tidy data format

This tidy data format makes it easy to:
- Import into data analysis tools (R, Python pandas, etc.)
- Create visualizations with tools like Tableau, Power BI, or D3.js
- Perform statistical analyses and trend analysis
- Generate reports and dashboards

## Example Output

```csv
simulateur_slug,simulateur_title,period_start,period_end,week,action,count
aide-renovation-energetique,Aide à la rénovation énergétique,2025-01-13,2025-01-19,2025-W03,Start,145
aide-renovation-energetique,Aide à la rénovation énergétique,2025-01-13,2025-01-19,2025-W03,Submit,89
aide-renovation-energetique,Aide à la rénovation énergétique,2025-01-13,2025-01-19,2025-W03,Eligibility,76
prime-transport,Prime transport,2025-01-13,2025-01-19,2025-W03,Start,67
prime-transport,Prime transport,2025-01-13,2025-01-19,2025-W03,Submit,43
```

## Error Handling

The script includes comprehensive error handling:
- Validates Matomo configuration before starting
- Logs all API calls and responses
- Continues processing even if individual requests fail
- Provides detailed error messages and context

## Performance

The script is optimized for performance:
- Uses concurrent requests where possible
- Implements proper timeouts and retry logic
- Provides progress feedback during execution
- Handles large datasets efficiently
