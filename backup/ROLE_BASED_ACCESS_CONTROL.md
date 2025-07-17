# Role-Based Access Control System

This document explains how the role-based access control system works in the Fruits For You application.

## Overview

The system implements a simple frontend-only role-based access control that restricts user access to different sections of the sidebar based on their role. There are no backend restrictions - this is purely a UI/UX feature.

## Available Roles

1. **Admin** - Full access to all sections
2. **Quality** - Access to Menu Principal + Quality section only
3. **Logistics** - Access to Menu Principal + Logistics section only
4. **Reception** - Access to Menu Principal + Reception section only
5. **Production** - Access to Menu Principal + Production section only
6. **Personnel** - Access to Menu Principal + Personnel section only
7. **Comptabilité** - Access to Menu Principal + Comptabilité section only
8. **Maintenance** - Access to Menu Principal + Maintenance section only

## Demo Users

For testing purposes, the following demo users are available:

| Email | Password | Role | Access |
|-------|----------|------|--------|
| admin@example.com | Demo@2024! | Admin | All sections |
| quality@example.com | Demo@2024! | Quality | Menu Principal + Quality |
| logistics@example.com | Demo@2024! | Logistics | Menu Principal + Logistics |
| reception@example.com | Demo@2024! | Reception | Menu Principal + Reception |
| production@example.com | Demo@2024! | Production | Menu Principal + Production |
| personnel@example.com | Demo@2024! | Personnel | Menu Principal + Personnel |
| comptabilite@example.com | Demo@2024! | Comptabilité | Menu Principal + Comptabilité |
| maintenance@example.com | Demo@2024! | Maintenance | Menu Principal + Maintenance |

## How It Works

### 1. User Authentication
- Users authenticate through the login page
- Role is determined based on the email address (demo implementation)
- In production, roles would be fetched from a database

### 2. Permission System
- Each role has specific permissions defined in `rolePermissions` object
- All roles have access to "menu" (Menu Principal)
- Each role has access to their specific section

### 3. UI Restrictions
- **Sidebar sections**: Locked sections show a lock icon and are grayed out
- **Section headers**: Non-accessible sections cannot be expanded
- **Visual indicators**: Clear visual feedback for accessible vs restricted areas

### 4. Route Protection
- Use the `RoleGuard` component to protect specific pages
- Shows access denied message for unauthorized users

## Implementation Details

### Files Modified
- `client/src/hooks/use-auth.tsx` - Added role-based authentication
- `client/src/components/layout/sidebar.tsx` - Added role-based sidebar access
- `client/src/components/role-guard.tsx` - Created route protection component
- `client/src/pages/login-page.tsx` - Added demo user selector

### Key Components

#### useAuth Hook
```typescript
const { user, hasAccess } = useAuth();
const canAccessQuality = hasAccess('quality');
```

#### RoleGuard Component
```typescript
<RoleGuard requiredSection="quality">
  <QualityControlPage />
</RoleGuard>
```

#### Sidebar Access Control
- Sections automatically show/hide based on user permissions
- Lock icons indicate restricted access
- User info displayed in sidebar header

## Usage Examples

### Protecting a Page
```typescript
import { RoleGuard } from "@/components/role-guard";

function QualityPage() {
  return (
    <RoleGuard requiredSection="quality">
      <div>Quality control content here</div>
    </RoleGuard>
  );
}
```

### Checking Access in Components
```typescript
import { useAuth } from "@/hooks/use-auth";

function SomeComponent() {
  const { hasAccess } = useAuth();
  
  return (
    <div>
      {hasAccess('admin') && <AdminOnlyButton />}
      {hasAccess('quality') && <QualityButton />}
    </div>
  );
}
```

## Testing

1. Go to the login page
2. Click on any demo user to auto-fill credentials
3. Login and observe the sidebar - only authorized sections will be accessible
4. Try switching between different roles to see the access changes

## Future Enhancements

- Backend integration for role management
- Dynamic role assignment
- More granular permissions
- Page-level route protection
- Audit logging for access attempts
