# Hosla Backend API Documentation

## Base URL
`https://[your-tunnel-id].trycloudflare.com/api`

---

## Authentication Flow

### 1. Request OTP
- **Endpoint**: `POST /auth/request-otp`
- **Body**:
```json
{
  "phone": "9876543210"
}
```
- **Response**: `200 OK` (OTP logged in console/response in dev mode)

### 2. Verify OTP
- **Endpoint**: `POST /auth/verify-otp`
- **Body**:
```json
{
  "phone": "9876543210",
  "otp": "123456",
  "device": {
    "fcmToken": "token...",
    "platform": "android",
    "model": "Samsung S21"
  }
}
```
- **Response**:
```json
{
  "success": true,
  "data": {
    "user": { ... },
    "tokens": { "accessToken": "...", "refreshToken": "..." },
    "isNewUser": true
  }
}
```

---

## User Profile Flow (For New Users)

If `isNewUser: true` is returned during login, redirect the user to the Profile Setup screen.

### Update Profile
- **Endpoint**: `PUT /users/profile`
- **Headers**: `Authorization: Bearer <accessToken>`
- **Content-Type**: `multipart/form-data`

#### Form Fields:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | String | Yes | Full name (letters and spaces only) |
| `dateOfBirth` | String | Yes | Format: `DD-MM-YYYY` |
| `gender` | String | Yes | `MALE`, `FEMALE`, or `OTHER` |
| `email` | String | No | Valid email address |
| `bio` | String | No | Max 500 characters |
| `profilePicture` | File | No | Image file (JPEG, PNG, WebP) |

#### Example (using fetch):
```javascript
const formData = new FormData();
formData.append('name', 'John Doe');
formData.append('dateOfBirth', '15-05-1990');
formData.append('gender', 'MALE');
formData.append('email', 'john@example.com');
formData.append('bio', 'Hello, I am new here!');
formData.append('profilePicture', imageFile); // Optional

fetch('/api/users/profile', {
  method: 'PUT',
  headers: { 'Authorization': `Bearer ${accessToken}` },
  body: formData
});
```

---

## Get Profile
- **Endpoint**: `GET /users/profile`
- **Headers**: `Authorization: Bearer <accessToken>`

---

## Health Check
- **Endpoint**: `GET /health`
- **Response**:
```json
{
  "success": true,
  "data": {
    "status": "ok",
    "timestamp": "..."
  }
}
```
