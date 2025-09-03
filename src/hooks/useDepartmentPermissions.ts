import { useState, useCallback, useEffect } from 'react';
import { useRBAC } from '../contexts/RBACContext';
import { useFormSubmission } from './useFormSubmission';

interface Department {
  id: string;
  name: string;
  description?: string;
  managerId?: string;
  budget?: number;
  headCount?: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface Position {
  id: string;
  title: string;
  departmentId: string;
  description?: string;
  level: 'entry' | 'mid' | 'senior' | 'lead' | 'manager' | 'director';
  minSalary?: number;
  maxSalary?: number;
  requiredSkills: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

interface DepartmentFormData {
  name: string;
  description: string;
  managerId: string;
  budget: number;
}

interface PositionFormData {
  title: string;
  departmentId: string;
  description: string;
  level: Position['level'];
  minSalary: number;
  maxSalary: number;
  requiredSkills: string[];
}

interface UseDepartmentPermissionsOptions {
  enableAutoSave?: boolean;
  validateOnChange?: boolean;
  autoLoadData?: boolean;
}

export function useDepartmentPermissions(options: UseDepartmentPermissionsOptions = {}) {
  const {
    enableAutoSave = false,
    validateOnChange = true,
    autoLoadData = true
  } = options;

  const { hasPermission, currentUser } = useRBAC();
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { handleSubmit: protectedSubmit, isSubmitting } = useFormSubmission({
    debounceMs: 1000
  });

  // Permission checks
  const canCreateDepartment = hasPermission('departments', 'create') || hasPermission('admin', 'all');
  const canEditDepartment = hasPermission('departments', 'edit') || hasPermission('admin', 'all');
  const canDeleteDepartment = hasPermission('departments', 'delete') || hasPermission('admin', 'all');
  const canCreatePosition = hasPermission('positions', 'create') || hasPermission('admin', 'all');
  const canEditPosition = hasPermission('positions', 'edit') || hasPermission('admin', 'all');
  const canDeletePosition = hasPermission('positions', 'delete') || hasPermission('admin', 'all');

  // Load departments and positions
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // In a real app, these would be API calls
      const deptData = localStorage.getItem('departments');
      const posData = localStorage.getItem('positions');

      if (deptData) {
        setDepartments(JSON.parse(deptData));
      }
      if (posData) {
        setPositions(JSON.parse(posData));
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setErrors({ load: 'Failed to load departments and positions' });
    } finally {
      setLoading(false);
    }
  }, []);

  // Save data to localStorage (in a real app, this would be API calls)
  const saveDepartments = useCallback((depts: Department[]) => {
    localStorage.setItem('departments', JSON.stringify(depts));
    setDepartments(depts);
  }, []);

  const savePositions = useCallback((pos: Position[]) => {
    localStorage.setItem('positions', JSON.stringify(pos));
    setPositions(pos);
  }, []);

  // Validation functions
  const validateDepartmentForm = useCallback((data: DepartmentFormData): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!data.name.trim()) {
      errors.name = 'Department name is required';
    } else if (data.name.length < 2) {
      errors.name = 'Department name must be at least 2 characters';
    } else if (departments.some(d => d.name.toLowerCase() === data.name.toLowerCase())) {
      errors.name = 'Department name already exists';
    }

    if (data.budget && data.budget < 0) {
      errors.budget = 'Budget cannot be negative';
    }

    if (data.managerId && !data.managerId.trim()) {
      errors.managerId = 'Manager ID is invalid';
    }

    return errors;
  }, [departments]);

  const validatePositionForm = useCallback((data: PositionFormData): Record<string, string> => {
    const errors: Record<string, string> = {};

    if (!data.title.trim()) {
      errors.title = 'Position title is required';
    } else if (data.title.length < 2) {
      errors.title = 'Position title must be at least 2 characters';
    }

    if (!data.departmentId) {
      errors.departmentId = 'Department must be selected';
    } else if (!departments.some(d => d.id === data.departmentId)) {
      errors.departmentId = 'Selected department does not exist';
    }

    if (data.minSalary && data.maxSalary && data.minSalary > data.maxSalary) {
      errors.maxSalary = 'Maximum salary must be greater than minimum salary';
    }

    if (data.minSalary && data.minSalary < 0) {
      errors.minSalary = 'Minimum salary cannot be negative';
    }

    if (data.maxSalary && data.maxSalary < 0) {
      errors.maxSalary = 'Maximum salary cannot be negative';
    }

    return errors;
  }, [departments]);

  // Department operations
  const createDepartment = useCallback(async (data: DepartmentFormData) => {
    if (!canCreateDepartment) {
      throw new Error('Insufficient permissions to create departments');
    }

    return await protectedSubmit(async () => {
      const validationErrors = validateDepartmentForm(data);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        throw new Error('Validation failed');
      }

      const newDepartment: Department = {
        id: `dept_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: data.name.trim(),
        description: data.description.trim(),
        managerId: data.managerId.trim() || undefined,
        budget: data.budget || undefined,
        headCount: 0,
        createdBy: currentUser?.id || 'unknown',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const updatedDepartments = [...departments, newDepartment];
      saveDepartments(updatedDepartments);
      setErrors({});

      return newDepartment;
    });
  }, [canCreateDepartment, validateDepartmentForm, departments, currentUser, protectedSubmit, saveDepartments]);

  const updateDepartment = useCallback(async (id: string, data: Partial<DepartmentFormData>) => {
    if (!canEditDepartment) {
      throw new Error('Insufficient permissions to edit departments');
    }

    return await protectedSubmit(async () => {
      const existingDept = departments.find(d => d.id === id);
      if (!existingDept) {
        throw new Error('Department not found');
      }

      // Only validate fields that are being updated
      const fieldsToValidate = { ...existingDept, ...data } as DepartmentFormData;
      const validationErrors = validateDepartmentForm(fieldsToValidate);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        throw new Error('Validation failed');
      }

      const updatedDepartment = {
        ...existingDept,
        ...data,
        updatedAt: new Date().toISOString()
      };

      const updatedDepartments = departments.map(d => 
        d.id === id ? updatedDepartment : d
      );
      
      saveDepartments(updatedDepartments);
      setErrors({});

      return updatedDepartment;
    });
  }, [canEditDepartment, departments, validateDepartmentForm, protectedSubmit, saveDepartments]);

  const deleteDepartment = useCallback(async (id: string) => {
    if (!canDeleteDepartment) {
      throw new Error('Insufficient permissions to delete departments');
    }

    return await protectedSubmit(async () => {
      // Check if department has positions
      const departmentPositions = positions.filter(p => p.departmentId === id);
      if (departmentPositions.length > 0) {
        throw new Error(`Cannot delete department with ${departmentPositions.length} positions. Please reassign or delete positions first.`);
      }

      const updatedDepartments = departments.filter(d => d.id !== id);
      saveDepartments(updatedDepartments);
      setErrors({});

      return id;
    });
  }, [canDeleteDepartment, departments, positions, protectedSubmit, saveDepartments]);

  // Position operations
  const createPosition = useCallback(async (data: PositionFormData) => {
    if (!canCreatePosition) {
      throw new Error('Insufficient permissions to create positions');
    }

    return await protectedSubmit(async () => {
      const validationErrors = validatePositionForm(data);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        throw new Error('Validation failed');
      }

      const newPosition: Position = {
        id: `pos_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        title: data.title.trim(),
        departmentId: data.departmentId,
        description: data.description.trim(),
        level: data.level,
        minSalary: data.minSalary || undefined,
        maxSalary: data.maxSalary || undefined,
        requiredSkills: data.requiredSkills.filter(skill => skill.trim()),
        createdBy: currentUser?.id || 'unknown',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const updatedPositions = [...positions, newPosition];
      savePositions(updatedPositions);
      
      // Update department head count
      const updatedDepartments = departments.map(d => 
        d.id === data.departmentId 
          ? { ...d, headCount: (d.headCount || 0) + 1 }
          : d
      );
      saveDepartments(updatedDepartments);
      
      setErrors({});
      return newPosition;
    });
  }, [canCreatePosition, validatePositionForm, positions, departments, currentUser, protectedSubmit, savePositions, saveDepartments]);

  const updatePosition = useCallback(async (id: string, data: Partial<PositionFormData>) => {
    if (!canEditPosition) {
      throw new Error('Insufficient permissions to edit positions');
    }

    return await protectedSubmit(async () => {
      const existingPos = positions.find(p => p.id === id);
      if (!existingPos) {
        throw new Error('Position not found');
      }

      const fieldsToValidate = { ...existingPos, ...data } as PositionFormData;
      const validationErrors = validatePositionForm(fieldsToValidate);
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        throw new Error('Validation failed');
      }

      const updatedPosition = {
        ...existingPos,
        ...data,
        updatedAt: new Date().toISOString()
      };

      const updatedPositions = positions.map(p => 
        p.id === id ? updatedPosition : p
      );
      
      savePositions(updatedPositions);
      setErrors({});

      return updatedPosition;
    });
  }, [canEditPosition, positions, validatePositionForm, protectedSubmit, savePositions]);

  const deletePosition = useCallback(async (id: string) => {
    if (!canDeletePosition) {
      throw new Error('Insufficient permissions to delete positions');
    }

    return await protectedSubmit(async () => {
      const position = positions.find(p => p.id === id);
      if (!position) {
        throw new Error('Position not found');
      }

      const updatedPositions = positions.filter(p => p.id !== id);
      savePositions(updatedPositions);

      // Update department head count
      const updatedDepartments = departments.map(d => 
        d.id === position.departmentId 
          ? { ...d, headCount: Math.max(0, (d.headCount || 0) - 1) }
          : d
      );
      saveDepartments(updatedDepartments);
      
      setErrors({});
      return id;
    });
  }, [canDeletePosition, positions, departments, protectedSubmit, savePositions, saveDepartments]);

  // Utility functions
  const getDepartmentById = useCallback((id: string) => {
    return departments.find(d => d.id === id);
  }, [departments]);

  const getPositionsByDepartment = useCallback((departmentId: string) => {
    return positions.filter(p => p.departmentId === departmentId);
  }, [positions]);

  const getDepartmentStats = useCallback((departmentId: string) => {
    const dept = getDepartmentById(departmentId);
    const deptPositions = getPositionsByDepartment(departmentId);
    
    return {
      department: dept,
      positionCount: deptPositions.length,
      levels: [...new Set(deptPositions.map(p => p.level))],
      salaryRange: deptPositions.length > 0 ? {
        min: Math.min(...deptPositions.map(p => p.minSalary || 0).filter(s => s > 0)),
        max: Math.max(...deptPositions.map(p => p.maxSalary || 0))
      } : null
    };
  }, [getDepartmentById, getPositionsByDepartment]);

  // Load data on mount if enabled
  useEffect(() => {
    if (autoLoadData) {
      loadData();
    }
  }, [autoLoadData, loadData]);

  return {
    // Data
    departments,
    positions,
    loading,
    errors,
    isSubmitting,

    // Permissions
    permissions: {
      canCreateDepartment,
      canEditDepartment,
      canDeleteDepartment,
      canCreatePosition,
      canEditPosition,
      canDeletePosition
    },

    // Department operations
    createDepartment,
    updateDepartment,
    deleteDepartment,

    // Position operations
    createPosition,
    updatePosition,
    deletePosition,

    // Utility functions
    getDepartmentById,
    getPositionsByDepartment,
    getDepartmentStats,
    loadData,

    // Validation
    validateDepartmentForm,
    validatePositionForm,

    // State management
    setErrors,
    clearErrors: () => setErrors({})
  };
}
