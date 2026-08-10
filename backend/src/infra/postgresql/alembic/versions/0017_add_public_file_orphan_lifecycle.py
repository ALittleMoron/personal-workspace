from alembic import op
import sqlalchemy as sa
from sqlalchemy_dev_utils.types.datetime import UTCDateTime


revision = "0017"
down_revision = "0016"
branch_labels = None
depends_on = None

FILE_TABLE = "files__file_model"
ORPHAN_INDEX = "files_file_namespace_orphaned_id_idx"

files = sa.table(
    FILE_TABLE,
    sa.column("id", sa.String()),
    sa.column("orphaned_at", UTCDateTime(timezone=True)),
)
def upgrade() -> None:
    op.add_column(
        FILE_TABLE,
        sa.Column("orphaned_at", UTCDateTime(timezone=True), nullable=True),
    )
    op.get_bind().execute(
        sa.update(files)
        .values(orphaned_at=sa.func.timezone("utc", sa.func.current_timestamp())),
    )
    op.create_index(
        ORPHAN_INDEX,
        FILE_TABLE,
        ["namespace", "orphaned_at", "id"],
        unique=False,
        postgresql_where=sa.column("orphaned_at").is_not(None),
    )


def downgrade() -> None:
    op.drop_index(ORPHAN_INDEX, table_name=FILE_TABLE)
    op.drop_column(FILE_TABLE, "orphaned_at")
