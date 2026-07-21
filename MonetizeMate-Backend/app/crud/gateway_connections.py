from sqlalchemy.orm import Session
from app.models.gateway_connection import GatewayConnection
from datetime import datetime


def create_connection(db: Session, provider: str, name: str, description: str, audience_id: int) -> GatewayConnection:
    """Create a new gateway connection record."""
    record = GatewayConnection(
        provider=provider,
        name=name,
        description=description or "",
        status="connected",
        audience_id=audience_id,
        created_at=datetime.utcnow(),
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def get_connections_by_owner(db: Session, audience_id: int) -> list[GatewayConnection]:
    """Return all gateway connections belonging to a user."""
    return (
        db.query(GatewayConnection)
        .filter(GatewayConnection.audience_id == audience_id)
        .order_by(GatewayConnection.created_at.desc())
        .all()
    )


def get_connection_by_id(db: Session, connection_id: int, audience_id: int):
    """Return a single connection, scoped to the owning user."""
    return (
        db.query(GatewayConnection)
        .filter(
            GatewayConnection.id == connection_id,
            GatewayConnection.audience_id == audience_id,
        )
        .first()
    )


def delete_connection(db: Session, connection_id: int, audience_id: int):
    """Delete a gateway connection. Returns the deleted record or None."""
    record = get_connection_by_id(db, connection_id, audience_id)
    if record:
        db.delete(record)
        db.commit()
    return record
