from database import connection_manager
from dashboard import store as dashboard_store
from query_history import store as query_history_store
from query_library import store as library_store


def build_analytics_overview() -> dict:
    """Return workspace-level analytics aggregated from existing in-memory stores."""
    connections = connection_manager.get_all_connections()
    history = query_history_store.get_history(limit=500)
    library_stats = library_store.get_stats()
    dashboards = dashboard_store.list_dashboards()
    dashboard_stats = dashboard_store.get_stats()

    successful = [record for record in history if record.success]
    failed = [record for record in history if not record.success]
    durations = [record.execution_time_ms for record in history if record.execution_time_ms is not None]

    connection_lookup = {conn["id"]: conn for conn in connections}
    usage_counts: dict[str, int] = {}
    for record in history:
        usage_counts[record.connection_id] = usage_counts.get(record.connection_id, 0) + 1

    top_connections = [
        {
            "connection_id": connection_id,
            "name": connection_lookup.get(connection_id, {}).get("name", "Unknown"),
            "database": connection_lookup.get(connection_id, {}).get("database", "Unknown"),
            "db_type": connection_lookup.get(connection_id, {}).get("db_type", "unknown"),
            "query_count": query_count,
        }
        for connection_id, query_count in sorted(usage_counts.items(), key=lambda item: item[1], reverse=True)[:5]
    ]

    recent_queries = [
        {
            "id": record.id,
            "connection_id": record.connection_id,
            "connection_name": connection_lookup.get(record.connection_id, {}).get("name")
            or connection_lookup.get(record.connection_id, {}).get("database")
            or "Unknown",
            "sql": record.sql,
            "success": record.success,
            "error": record.error,
            "execution_time_ms": record.execution_time_ms,
            "row_count": record.row_count,
            "timestamp": record.timestamp,
        }
        for record in history[:10]
    ]

    return {
        "overview": {
            "active_connections": len(connections),
            "total_queries": len(history),
            "successful_queries": len(successful),
            "failed_queries": len(failed),
            "success_rate": round((len(successful) / len(history)) * 100, 1) if history else 0,
            "avg_time_ms": round(sum(durations) / len(durations), 2) if durations else 0,
            "saved_queries": library_stats["total_queries"],
            "scheduled_queries": library_stats["scheduled"],
            "dashboards": len(dashboards),
            "total_widgets": dashboard_stats["total_widgets"],
        },
        "library": library_stats,
        "dashboards": {
            "total_dashboards": len(dashboards),
            "total_widgets": dashboard_stats["total_widgets"],
            "viz_breakdown": dashboard_stats["viz_breakdown"],
            "items": dashboards,
        },
        "query_health": {
            "successful": len(successful),
            "failed": len(failed),
        },
        "top_connections": top_connections,
        "recent_queries": recent_queries,
    }
