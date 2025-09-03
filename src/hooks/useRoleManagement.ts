import { useState, useCallback, useEffect } from 'react';
import { User, Role } from '../types/user';
import { useFormSubmission } from './useFormSubmission';

interface UseRoleManagementOptions {
  allowMultipleRoles?: boolean;
  requireRole?: boolean;
  autoSelectDefault?: boolean;
  defaultRoleId?: string;
}

interface RoleValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export function useRoleManagement(
  availableRoles: Role[] = [],
  options: UseRoleManagementOptions = {}
) {
  const {
    allowMultipleRoles = false, // Default to single role
    requireRole = true,
    autoSelectDefault = true,
    defaultRoleId
  } = options;

  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [roleErrors, setRoleErrors] = useState<string[]>([]);
  const [isChangingRoles, setIsChangingRoles] = useState(false);

  const { handleSubmit: protectedSubmit, isSubmitting } = useFormSubmission({
    debounceMs: 500
  });

  // Auto-select default role if enabled
  useEffect(() => {
    if (autoSelectDefault && selectedRoles.length === 0 && availableRoles.length > 0) {
      let defaultRole = defaultRoleId;
      
      if (!defaultRole) {
        // Find a suitable default role (lowest privilege non-admin role)
        const nonAdminRoles = availableRoles.filter(role => 
          !role.name.toLowerCase().includes('admin') &&
          !role.name.toLowerCase().includes('superuser')
        );
        
        if (nonAdminRoles.length > 0) {
          defaultRole = nonAdminRoles[0].id;
        } else if (availableRoles.length > 0) {
          defaultRole = availableRoles[0].id;
        }
      }

      if (defaultRole && availableRoles.some(role => role.id === defaultRole)) {
        setSelectedRoles([defaultRole]);
      }
    }
  }, [autoSelectDefault, defaultRoleId, selectedRoles.length, availableRoles]);

  // Validate role selection
  const validateRoles = useCallback((roles: string[]): RoleValidationResult => {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if role is required
    if (requireRole && roles.length === 0) {
      errors.push('At least one role must be selected');
    }

    // Check single vs multiple role constraint
    if (!allowMultipleRoles && roles.length > 1) {
      errors.push('Only one role can be selected at a time');
    }

    // Check for valid role IDs
    const invalidRoles = roles.filter(roleId => 
      !availableRoles.some(role => role.id === roleId)
    );
    
    if (invalidRoles.length > 0) {
      errors.push(`Invalid role(s): ${invalidRoles.join(', ')}`);
    }

    // Check for conflicting roles (admin + other roles)
    if (roles.length > 1) {
      const roleNames = roles
        .map(roleId => availableRoles.find(role => role.id === roleId)?.name)
        .filter(Boolean);
      
      const hasAdmin = roleNames.some(name => 
        name?.toLowerCase().includes('admin') || 
        name?.toLowerCase().includes('superuser')
      );
      
      if (hasAdmin && roles.length > 1) {
        warnings.push('Admin roles typically should not be combined with other roles');
      }
    }

    // Check for redundant permissions
    if (roles.length > 1) {
      const allPermissions = roles
        .map(roleId => availableRoles.find(role => role.id === roleId))
        .filter(Boolean)
        .flatMap(role => role.permissions);
      
      const uniquePermissions = [...new Set(allPermissions)];
      
      if (allPermissions.length > uniquePermissions.length) {
        warnings.push('Some selected roles have overlapping permissions');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }, [availableRoles, requireRole, allowMultipleRoles]);

  // Handle role selection with validation
  const handleRoleChange = useCallback(async (roleId: string, isSelected: boolean) => {
    setIsChangingRoles(true);
    setRoleErrors([]);

    try {
      await protectedSubmit(async () => {
        let newRoles: string[];

        if (isSelected) {
          if (allowMultipleRoles) {
            newRoles = [...selectedRoles, roleId];
          } else {
            // Single role mode - replace existing selection
            newRoles = [roleId];
          }
        } else {
          newRoles = selectedRoles.filter(id => id !== roleId);
        }

        // Validate the new selection
        const validation = validateRoles(newRoles);
        
        if (!validation.isValid) {
          setRoleErrors(validation.errors);
          return; // Don't update if validation fails
        }

        // Show warnings but allow the change
        if (validation.warnings.length > 0) {
          console.warn('Role selection warnings:', validation.warnings);
        }

        setSelectedRoles(newRoles);
        setRoleErrors([]);
      });
    } catch (error) {
      console.error('Error changing roles:', error);
      setRoleErrors(['Failed to update role selection']);
    } finally {
      setIsChangingRoles(false);
    }
  }, [selectedRoles, allowMultipleRoles, validateRoles, protectedSubmit]);

  // Set roles programmatically (for form initialization)
  const setRoles = useCallback((roles: string[]) => {
    const validation = validateRoles(roles);
    
    if (validation.isValid) {
      setSelectedRoles(roles);
      setRoleErrors([]);
    } else {
      setRoleErrors(validation.errors);
    }
  }, [validateRoles]);

  // Clear role selection
  const clearRoles = useCallback(() => {
    setSelectedRoles([]);
    setRoleErrors([]);
  }, []);

  // Get role information
  const getSelectedRoleInfo = useCallback(() => {
    return selectedRoles.map(roleId => 
      availableRoles.find(role => role.id === roleId)
    ).filter(Boolean);
  }, [selectedRoles, availableRoles]);

  // Check if a specific role is selected
  const isRoleSelected = useCallback((roleId: string) => {
    return selectedRoles.includes(roleId);
  }, [selectedRoles]);

  // Get all permissions from selected roles
  const getAllPermissions = useCallback(() => {
    const allPermissions = getSelectedRoleInfo()
      .flatMap(role => role.permissions);
    
    return [...new Set(allPermissions)];
  }, [getSelectedRoleInfo]);

  // Validate current selection
  const currentValidation = validateRoles(selectedRoles);

  return {
    // State
    selectedRoles,
    roleErrors,
    isChangingRoles: isChangingRoles || isSubmitting,
    
    // Validation
    isValid: currentValidation.isValid,
    errors: currentValidation.errors,
    warnings: currentValidation.warnings,
    
    // Actions
    handleRoleChange,
    setRoles,
    clearRoles,
    
    // Getters
    getSelectedRoleInfo,
    isRoleSelected,
    getAllPermissions,
    
    // Options
    allowMultipleRoles,
    requireRole
  };
}

// Hook for managing user roles specifically
export function useUserRoleManagement(
  user: User | null,
  availableRoles: Role[] = [],
  onRolesChange?: (userId: string, roles: string[]) => Promise<void>
) {
  const roleManagement = useRoleManagement(availableRoles, {
    allowMultipleRoles: false, // Enforce single role for users
    requireRole: true,
    autoSelectDefault: !user // Only auto-select for new users
  });

  // Initialize with user's current roles
  useEffect(() => {
    if (user) {
      roleManagement.setRoles(user.roles);
    } else {
      roleManagement.clearRoles();
    }
  }, [user, roleManagement.setRoles, roleManagement.clearRoles]);

  // Save role changes
  const saveRoleChanges = useCallback(async () => {
    if (!user || !onRolesChange) return;

    try {
      await onRolesChange(user.id, roleManagement.selectedRoles);
    } catch (error) {
      console.error('Failed to save role changes:', error);
      throw error;
    }
  }, [user, roleManagement.selectedRoles, onRolesChange]);

  return {
    ...roleManagement,
    user,
    saveRoleChanges,
    hasChanges: user ? 
      JSON.stringify(user.roles.sort()) !== JSON.stringify(roleManagement.selectedRoles.sort()) :
      roleManagement.selectedRoles.length > 0
  };
}
