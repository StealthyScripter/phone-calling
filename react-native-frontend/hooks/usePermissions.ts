import { useState, useEffect } from 'react';
import { permissionManager } from '../lib/utils/permissions';
import type { PermissionType, PermissionStatus } from '../lib/utils/permissions';

export const usePermissions = () => {
  const [permissions, setPermissions] = useState<Record<PermissionType, PermissionStatus>>({
    microphone: 'undetermined',
    camera: 'undetermined',
    contacts: 'undetermined',
    notifications: 'undetermined',
    phone: 'undetermined',
  });

  useEffect(() => {
    checkAllPermissions();
  }, []);

  const checkAllPermissions = async () => {
    const types: PermissionType[] = ['microphone', 'camera', 'contacts', 'notifications', 'phone'];
    const newPermissions = { ...permissions };

    for (const type of types) {
      try {
        const status = await permissionManager.checkPermission(type);
        newPermissions[type] = status;
      } catch (error) {
        console.error(`Failed to check ${type} permission:`, error);
      }
    }

    setPermissions(newPermissions);
  };

  const checkPermission = async (type: PermissionType): Promise<boolean> => {
    try {
      const status = await permissionManager.checkPermission(type);
      setPermissions(prev => ({ ...prev, [type]: status }));
      return status === 'granted';
    } catch (error) {
      console.error(`Failed to check ${type} permission:`, error);
      return false;
    }
  };

  const requestPermission = async (type: PermissionType): Promise<boolean> => {
    try {
      const status = await permissionManager.requestPermission(type);
      setPermissions(prev => ({ ...prev, [type]: status }));
      return status === 'granted';
    } catch (error) {
      console.error(`Failed to request ${type} permission:`, error);
      return false;
    }
  };

  const requestMultiplePermissions = async (types: PermissionType[]): Promise<Record<PermissionType, PermissionStatus>> => {
    const results: Record<string, PermissionStatus> = {};

    for (const type of types) {
      try {
        const status = await permissionManager.requestPermission(type);
        results[type] = status;
      } catch (error) {
        console.error(`Failed to request ${type} permission:`, error);
        results[type] = 'denied';
      }
    }

    setPermissions(prev => ({ ...prev, ...results }));
    return results as Record<PermissionType, PermissionStatus>;
  };

  return {
    permissions,
    checkPermission,
    requestPermission,
    requestMultiplePermissions,
    checkAllPermissions,
  };
};
