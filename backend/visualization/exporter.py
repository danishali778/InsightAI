"""
Data exporter: converts query results to CSV format.
"""

import csv
import io


def rows_to_csv(columns: list[str], rows: list[dict]) -> str:
    """Convert query result rows to a CSV string."""
    output = io.StringIO()
    writer = csv.DictWriter(output, fieldnames=columns, extrasaction="ignore")
    writer.writeheader()
    for row in rows:
        writer.writerow(row)
    return output.getvalue()
