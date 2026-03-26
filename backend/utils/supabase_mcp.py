"""
Supabase MCP Integration Utilities

Este módulo facilita o uso do Supabase MCP para operações administrativas,
backups e gerenciamento de dados em massa.

Quando o Supabase MCP estiver instalado no LionClaw, você poderá usar:

    @supabase query "SELECT * FROM users"
    @supabase insert "INSERT INTO users (...) VALUES (...)"
    @supabase update "UPDATE users SET ... WHERE ..."
    @supabase delete "DELETE FROM users WHERE ..."

Exemplos de queries úteis para o projeto Oslo:
"""

# Queries úteis para o projeto Oslo

QUERIES = {
    # Usuários
    "get_all_users": """
        SELECT id, email, role, hospital_id, hospital_name, created_at
        FROM users
        ORDER BY created_at DESC
    """,

    "get_users_by_role": """
        SELECT id, email, hospital_name, created_at
        FROM users
        WHERE role = '{role}'
        ORDER BY created_at DESC
    """,

    "get_users_by_hospital": """
        SELECT id, email, role, created_at
        FROM users
        WHERE hospital_id = '{hospital_id}'
        ORDER BY role, email
    """,

    # Progresso de aulas
    "get_learning_progress": """
        SELECT
            u.email,
            u.role,
            COUNT(DISTINCT l.id) as total_lessons,
            COUNT(DISTINCT ta.id) as completed_tests,
            ROUND(100.0 * COUNT(DISTINCT ta.id) / NULLIF(COUNT(DISTINCT l.id), 0), 1) as completion_rate
        FROM users u
        LEFT JOIN lessons l ON l.deleted_at IS NULL
        LEFT JOIN test_attempts ta ON ta.user_id = u.id AND ta.type = 'post'
        WHERE u.role = '{role}'
        GROUP BY u.id, u.email, u.role
        ORDER BY completion_rate DESC
    """,

    # Performance em testes
    "get_test_performance": """
        SELECT
            u.email,
            l.title,
            ta.type,
            ta.score,
            ta.completed_at
        FROM test_attempts ta
        JOIN users u ON ta.user_id = u.id
        JOIN lessons l ON ta.lesson_id = l.id
        WHERE u.hospital_id = '{hospital_id}'
        ORDER BY ta.completed_at DESC
        LIMIT {limit}
    """,

    # Dúvidas pendentes
    "get_pending_doubts": """
        SELECT
            d.id,
            u.email,
            l.title,
            d.text,
            d.created_at
        FROM doubts d
        JOIN users u ON d.profile_id = u.id
        JOIN lessons l ON d.lesson_id = l.id
        WHERE d.status = 'pending'
        ORDER BY d.created_at ASC
    """,

    # Indicadores por hospital
    "get_indicators_by_hospital": """
        SELECT
            name,
            category,
            value,
            unit,
            reference_date
        FROM indicators
        WHERE hospital_id = '{hospital_id}'
        ORDER BY reference_date DESC, category
    """,

    # Estatísticas gerais
    "get_platform_stats": """
        SELECT
            (SELECT COUNT(*) FROM users WHERE role = 'doctor') as total_doctors,
            (SELECT COUNT(*) FROM users WHERE role = 'manager') as total_managers,
            (SELECT COUNT(*) FROM lessons WHERE deleted_at IS NULL) as total_lessons,
            (SELECT COUNT(*) FROM tracks WHERE deleted_at IS NULL) as total_tracks,
            (SELECT COUNT(*) FROM test_attempts) as total_tests,
            (SELECT COUNT(*) FROM doubts WHERE status = 'pending') as pending_doubts
    """,
}


# INSERT/UPDATE templates para uso administrativo

INSERT_TEMPLATES = {
    "user": """
        INSERT INTO users (email, role, hospital_id, hospital_name, created_at)
        VALUES ('{email}', '{role}', '{hospital_id}', '{hospital_name}', NOW())
    """,

    "indicator": """
        INSERT INTO indicators (hospital_id, name, category, value, unit, reference_date)
        VALUES ('{hospital_id}', '{name}', '{category}', {value}, '{unit}', '{reference_date}')
    """,

    "track": """
        INSERT INTO tracks (hospital_id, title, description, created_at)
        VALUES ('{hospital_id}', '{title}', '{description}', NOW())
    """,

    "lesson": """
        INSERT INTO lessons (track_id, title, description, video_url, duration_seconds, position)
        VALUES ('{track_id}', '{title}', '{description}', '{video_url}', {duration}, {position})
    """,
}


# DELETE templates para limpeza de dados

DELETE_TEMPLATES = {
    "old_test_attempts": """
        DELETE FROM test_attempts
        WHERE created_at < '{date}'
    """,

    "old_doubts": """
        DELETE FROM doubts
        WHERE status = 'pending' AND created_at < '{date}'
    """,

    "soft_deleted_records": """
        DELETE FROM {table}
        WHERE deleted_at IS NOT NULL AND deleted_at < '{date}'
    """,

    "user_by_email": """
        DELETE FROM users
        WHERE email = '{email}'
    """,
}


def get_query(query_name: str, **params) -> str:
    """
    Get a pre-defined query with parameters filled in.

    Example:
        query = get_query("get_users_by_hospital", hospital_id="123")
    """
    if query_name not in QUERIES:
        raise ValueError(f"Query '{query_name}' not found. Available: {list(QUERIES.keys())}")

    query = QUERIES[query_name]
    return query.format(**params)


def get_insert(template_name: str, **params) -> str:
    """
    Get a pre-defined INSERT statement with parameters filled in.

    Example:
        insert = get_insert("user", email="novo@teste.com", role="doctor", ...)
    """
    if template_name not in INSERT_TEMPLATES:
        raise ValueError(f"Template '{template_name}' not found. Available: {list(INSERT_TEMPLATES.keys())}")

    statement = INSERT_TEMPLATES[template_name]
    return statement.format(**params)


def get_delete(template_name: str, **params) -> str:
    """
    Get a pre-defined DELETE statement with parameters filled in.

    Example:
        delete = get_delete("old_test_attempts", date="2025-01-01")
    """
    if template_name not in DELETE_TEMPLATES:
        raise ValueError(f"Template '{template_name}' not found. Available: {list(DELETE_TEMPLATES.keys())}")

    statement = DELETE_TEMPLATES[template_name]
    return statement.format(**params)


if __name__ == "__main__":
    # Exemplos de uso
    print("=== Exemplo: Obter estatísticas da plataforma ===")
    print(QUERIES["get_platform_stats"])
    print()

    print("=== Exemplo: Obter usuários de um hospital ===")
    query = get_query("get_users_by_hospital", hospital_id="joewhfllvdaygffsosor")
    print(query)
    print()

    print("=== Exemplo: Inserir novo usuário ===")
    insert = get_insert(
        "user",
        email="novo_medico@hospital.com",
        role="doctor",
        hospital_id="joewhfllvdaygffsosor",
        hospital_name="Hospital Teste"
    )
    print(insert)
