# Backup System

## Overview

This module provides production-grade database backup and restore functionality for the desktop accounting application.

The implementation is designed to:

* Protect business data from accidental loss
* Support automated scheduled backups
* Allow recovery from previous backup snapshots
* Maintain backup history and metadata
* Enforce backup retention limits

---

## Features Implemented

### 1. Manual Backup

Users can create a full database backup on demand.

Implementation:

* SQLite VACUUM INTO
* Generates timestamped backup files
* Stores backups inside Electron userData directory

Example:

startup-backup-2026-06-13T10-53-03.182Z.db

---

### 2. Backup History

Every backup operation is recorded.

Stored information:

* Backup filename
* Backup path
* Backup size
* Creation timestamp

Table:

backup_history

---

### 3. Backup Settings

Persistent settings table added.

Table:

backup_settings

Fields:

* auto_backup_enabled
* backup_frequency
* max_backups
* last_backup_at

Supported frequencies:

* daily
* weekly
* monthly

---

### 4. Automatic Backup Scheduler

Application checks backup settings during startup.

Flow:

1. Read backup_settings.
2. Determine whether backup is due.
3. Create backup automatically.
4. Update last_backup_at.

Current implementation runs during application startup.

---

### 5. Backup Retention Policy

System automatically removes old backup files.

Behavior:

* Reads max_backups from backup_settings.
* Keeps newest backups.
* Deletes older backup files.
* Removes corresponding backup_history records.

Purpose:

Prevent unlimited disk usage growth.

---

### 6. Database Restore

Restore functionality allows database rollback to a previous backup.

Challenge:

SQLite database file remains locked while application is running.

Solution:

Restore-request startup workflow.

Flow:

1. User selects backup.
2. restore-request.json is created.
3. Application relaunches.
4. Startup process detects restore request.
5. Existing database files are removed.
6. Backup file replaces startup.db.
7. Request file is deleted.
8. Application starts normally.

Files handled:

* startup.db
* startup.db-wal
* startup.db-shm

---

## IPC APIs

### Backup Creation

backup:create

Creates database backup.

---

### Backup Listing

backup:getAll

Returns backup files present on disk.

---

### Restore Backup

backup:restore

Schedules restore and relaunches application.

---

### Backup History

backup:getHistory

Returns backup metadata from backup_history.

---

### Backup Settings

backup:getSettings

Returns current scheduler configuration.

---

## Electron Integration

### preload.js

Exposed APIs:

window.api.backup.create()

window.api.backup.getAll()

window.api.backup.restore(path)

window.api.backup.getHistory()

window.api.backup.getSettings()

---

## Database Tables Added

### backup_history

Columns:

* id
* file_name
* file_path
* size_bytes
* created_at

---

### backup_settings

Columns:

* id
* auto_backup_enabled
* backup_frequency
* max_backups
* last_backup_at

---

## Testing Performed

Verified:

✓ VACUUM INTO backup generation

✓ Backup file creation

✓ Backup history insertion

✓ Backup listing

✓ Restore workflow

✓ Application relaunch after restore

✓ Auto-backup execution

✓ Retention cleanup

✓ Backup settings retrieval

✓ WAL database handling

✓ Startup restore processing

---

## Known Future Improvements

### Backup Settings UI

Allow users to configure:

* Enable/Disable auto backup
* Daily/Weekly/Monthly schedule
* Maximum backup count

---

### Backup Compression

Store backups as compressed archives.

---

### Restore Confirmation UI

Add confirmation dialog before restore.

---

### Backup Export/Import

Allow external backup storage and recovery.

---

### Scheduled Background Backups

Run scheduler periodically instead of startup-only execution.

---

## Author

Priyambad Kumar Dubey

Feature Contribution:
Automated Database Backup & Restore System
