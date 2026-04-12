# Confidential Government Document Sharing System

A secure web-based system for sharing confidential documents with military-grade encryption and role-based access control.

## Tech Stack

**Frontend:** React, React Router, Axios, PDF.js  
**Backend:** Node.js, Express.js, MySQL  
**Security:** Argon2id, AES-256-GCM, JWT, Helmet.js

## Features

### Authentication & Security
- Argon2id password hashing (GPU-resistant)
- JWT authentication with 8-hour expiry
- Session timeout (30 min) with warning modal
- Account lockout after 5 failed attempts
- Rate limiting on login & password reset
- CSRF token protection
- XSS prevention via input sanitization

### Document Security
- AES-256-GCM encryption with tamper detection
- Per-document unique encryption keys
- Canvas-based PDF viewing (no download controls)
- Watermark with email + timestamp
- Keyboard shortcuts blocked (Ctrl+P, Ctrl+S, F12)
- Right-click disabled

### Access Control
- **Admin** - Full access, user management, delete documents
- **Officer** - Upload and view documents
- **Viewer** - View documents only

### Additional Features
- Admin-only user creation (no public registration)
- Secure setup links (24-hour expiry)
- Password reset with email verification
- Complete audit logging with CSV export
- Automatic backup with tamper recovery

## Quick Start

### Prerequisites
- Node.js (v14+)
- MySQL (v8+)

### Backend Setup
```bash
cd server
npm install
# Configure .env file
npm start
```
### Frontend Setup
```bash
cd client
npm install
npm start
```
## Security Score: 92% | Production Ready ✅

## Future Enhancements

### User-to-User Document Sharing (Planned)

| Feature | Description |
|---------|-------------|
| **Granular Sharing** | Officers can share documents with specific users (not just role-based) |
| **Permission Levels** | View, Edit, Download permissions per user per document |
| **Access Management** | Add/remove users from document access list |
| **Expiry Dates** | Set time-limited access for sensitive documents |
| **Email Notifications** | Auto-notify when document is shared |
| **Shared with Me** | Dedicated section showing documents shared with current user |


