from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy_dev_utils.types.datetime import UTCDateTime

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None

LANGUAGE_ENUM = postgresql.ENUM(
    "RU",
    "EN",
    name="language_enum",
    create_type=False,
)


def upgrade() -> None:
    LANGUAGE_ENUM.create(op.get_bind(), checkfirst=True)
    op.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm")
    op.create_table(
        "resumes__resume_model",
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("language", LANGUAGE_ENUM, nullable=False),
        sa.Column("author_username", sa.String(length=255), nullable=False),
        sa.Column("content", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column(
            "id",
            sa.String(length=32),
            server_default=sa.func.replace(
                sa.cast(sa.func.gen_random_uuid(), sa.String()),
                "-",
                "",
            ),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            UTCDateTime(timezone=True),
            server_default=sa.func.timezone("utc", sa.func.current_timestamp()),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            UTCDateTime(timezone=True),
            server_default=sa.func.timezone("utc", sa.func.current_timestamp()),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        "resumes_resume_author_updated_id_idx",
        "resumes__resume_model",
        ["author_username", sa.literal_column("updated_at DESC"), sa.literal_column("id DESC")],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("resumes_resume_author_updated_id_idx", table_name="resumes__resume_model")
    op.drop_table("resumes__resume_model")
    LANGUAGE_ENUM.drop(op.get_bind(), checkfirst=True)
