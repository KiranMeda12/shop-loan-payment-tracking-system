import os
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Response, Query
from sqlalchemy.orm import Session
from sqlalchemy import desc
from backend.database import get_db
from backend.models import BackupLog, AdminUser
from backend.auth import get_current_admin
from backend.services.backup_service import create_database_backup, BACKUP_DIR

router = APIRouter(prefix="/api/backup", tags=["Database Backup"])

@router.post("/create")
def trigger_backup(
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    result = create_database_backup(db)
    return {"message": "Backup created successfully", "backup": result}

@router.get("/history")
def get_backup_history(
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    logs = db.query(BackupLog).order_by(desc(BackupLog.backup_time)).all()
    return [
        {
            "id": log.id,
            "backup_time": log.backup_time.strftime("%d-%m-%Y %I:%M %p"),
            "file_name": log.file_name,
            "file_size_kb": log.file_size_kb,
            "record_count": log.record_count
        }
        for log in logs
    ]

@router.get("/download/{backup_id}")
def download_backup_file(
    backup_id: int,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    log = db.query(BackupLog).filter(BackupLog.id == backup_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Backup log entry not found")

    file_path = os.path.join(BACKUP_DIR, log.file_name)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Backup file not found on disk")

    with open(file_path, "rb") as f:
        content = f.read()

    return Response(
        content=content,
        media_type="application/json",
        headers={"Content-Disposition": f'attachment; filename="{log.file_name}"'}
    )

@router.delete("/{backup_id}")
def delete_backup_file(
    backup_id: int,
    db: Session = Depends(get_db),
    current_admin: AdminUser = Depends(get_current_admin)
):
    log = db.query(BackupLog).filter(BackupLog.id == backup_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Backup entry not found")

    file_path = os.path.join(BACKUP_DIR, log.file_name)
    if os.path.exists(file_path):
        try:
            os.remove(file_path)
        except Exception:
            pass

    db.delete(log)
    db.commit()
    return {"message": "Backup deleted successfully", "id": backup_id}
