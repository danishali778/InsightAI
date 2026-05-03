from app.services import (
    analytics_service,
    chat_service,
    connection_service,
    dashboard_service,
    query_history_service,
    query_library_service,
    settings_service,
)


def get_chat_service():
    return chat_service


def get_connection_service():
    return connection_service


def get_dashboard_service():
    return dashboard_service


def get_query_library_service():
    return query_library_service


def get_query_history_service():
    return query_history_service


def get_settings_service():
    return settings_service


def get_analytics_service():
    return analytics_service
