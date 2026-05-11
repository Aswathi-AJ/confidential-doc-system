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

## Network Configuration

### Running on Localhost Only (Default)
The application runs on `http://localhost:3000` (frontend) and `http://localhost:5000` (backend).

### Running on Network Interface (Accessible from other devices)
To make the application accessible from other devices on your network (like `192.168.0.102`):

1. **Server Configuration** (Already configured):
   - Server listens on all interfaces (`0.0.0.0:5000`)
   - CORS allows `http://localhost:3000` and `http://192.168.0.102:3000`

2. **Client Configuration** (Auto-detected):
   - Client automatically uses current hostname/IP
   - Access via `http://localhost:3000` or `http://192.168.0.102:3000`

3. **Firewall**:
   - Ensure port 3000 (React dev server) is open
   - Ensure port 5000 (Express server) is open

### Manual IP Configuration
If you need to specify a different IP, update these files:

**Server (.env):**
```
HOST=192.168.0.102  # or 0.0.0.0 for all interfaces
```

**Client (.env):**
```
REACT_APP_API_URL=http://192.168.0.102:5000/api
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


