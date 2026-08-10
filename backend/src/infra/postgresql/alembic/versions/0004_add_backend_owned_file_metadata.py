from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from sqlalchemy_dev_utils.types.datetime import UTCDateTime

revision = "0004"
down_revision = "0001"
branch_labels = None
depends_on = None

FILE_PURPOSE_ENUM = postgresql.ENUM(
    "ATTACHMENT",
    name="file_purpose_enum",
    create_type=False,
)


def upgrade() -> None:
    FILE_PURPOSE_ENUM.create(op.get_bind(), checkfirst=True)
    op.create_table(
        "files__file_model",
        sa.Column("purpose", FILE_PURPOSE_ENUM, nullable=False),
        sa.Column("namespace", sa.String(length=63), nullable=False),
        sa.Column("relative_path", sa.String(length=2048), nullable=False),
        sa.Column("mime_type", sa.String(length=255), nullable=False),
        sa.Column("size_bytes", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("original_name", sa.String(length=255), nullable=False),
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
        sa.UniqueConstraint(
            "namespace",
            "relative_path",
            name="files_file_namespace_relative_path_uniq",
        ),
    )
    op.create_index(
        "files_file_purpose_created_id_idx",
        "files__file_model",
        ["purpose", "created_at", "id"],
        unique=False,
    )


def downgrade() -> None:
    op.drop_index("files_file_purpose_created_id_idx", table_name="files__file_model")
    op.drop_table("files__file_model")
    FILE_PURPOSE_ENUM.drop(op.get_bind(), checkfirst=True)
