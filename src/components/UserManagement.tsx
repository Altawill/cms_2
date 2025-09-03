import React, { useState, useEffect } from 'react';
import { 
  User, 
  Role, 
  SiteAccessPolicy, 
  SitePermission,
  SiteModule,
  SiteAction,
  SYSTEM_ROLES 
} from '../types/user';
import { apiService } from '../services/apiService';
import { fallbackAuthService } from '../services/fallbackAuth';
import { useRBAC, ProtectedComponent } from '../contexts/RBACContext';
import { useI18n } from "../i18n/i18nContext";
import { ThemeSwitcher } from '../theme/ThemeProvider';

// Mock site data - in a real app, this would come from a site service
const MOCK_SITES = [
  { id: 'site-1', name: 'Downtown Construction Project', location: 'Downtown' },
  { id: 'site-2', name: 'Residential Complex Phase 1', location: 'North District' },
  { id: 'site-3', name: 'Commercial Plaza Development', location: 'Business District' },
  { id: 'site-4', name: 'Highway Bridge Construction', location: 'Highway 101' },
];

const SITE_MODULES: { value: SiteModule; label: string }[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'employees', label: 'Employees' },
  { value: 'equipment', label: 'Equipment' },
  { value: 'expenses', label: 'Expenses' },
  { value: 'progress', label: 'Progress' },
  { value: 'documents', label: 'Documents' }
];

const SITE_ACTIONS: { value: SiteAction; label: string }[] = [
  { value: 'view', label: 'View' },
  { value: 'create', label: 'Create' },
  { value: 'edit', label: 'Edit' },
  { value: 'delete', label: 'Delete' },
  { value: 'approve', label: 'Approve' },
  { value: 'export', label: 'Export' },
  { value: 'manage_budget', label: 'Manage Budget' },
  { value: 'manage_team', label: 'Manage Team' }
];

// Predefined department options
const DEPARTMENTS = [
  'Engineering',
  'Human Resources',
  'Finance',
  'Operations',
  'Marketing',
  'Sales',
  'Information Technology',
  'Quality Assurance',
  'Legal',
  'Administration',
  'Project Management',
  'Safety',
  'Procurement',
  'Research & Development'
];

// Predefined position options grouped by department
const POSITIONS = [
  // Engineering
  'Software Engineer',
  'Senior Software Engineer',
  'Lead Engineer',
  'Engineering Manager',
  'DevOps Engineer',
  'System Architect',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'QA Engineer',
  'Test Engineer',
  
  // Management
  'Project Manager',
  'Senior Project Manager',
  'Program Manager',
  'Director',
  'Vice President',
  'Chief Technology Officer',
  'Chief Executive Officer',
  'Chief Financial Officer',
  'Chief Operating Officer',
  
  // HR & Admin
  'HR Manager',
  'HR Specialist',
  'Recruiter',
  'Office Manager',
  'Administrative Assistant',
  'Executive Assistant',
  
  // Finance
  'Financial Analyst',
  'Accountant',
  'Senior Accountant',
  'Finance Manager',
  'Budget Analyst',
  
  // Operations
  'Operations Manager',
  'Operations Specialist',
  'Process Analyst',
  'Site Supervisor',
  'Field Coordinator',
  
  // Marketing & Sales
  'Marketing Manager',
  'Sales Manager',
  'Sales Representative',
  'Marketing Specialist',
  'Business Development Manager',
  
  // IT
  'System Administrator',
  'Network Administrator',
  'IT Support Specialist',
  'Database Administrator',
  'Security Analyst',
  
  // Others
  'Analyst',
  'Senior Analyst',
  'Consultant',
  'Senior Consultant',
  'Coordinator',
  'Specialist',
  'Associate',
  'Senior Associate',
  'Supervisor',
  'Team Lead',
  'Intern',
  'Trainee'
];

const UserManagement: React.FC = () => {
  const { t, language } = useI18n();
  const { hasPermission, currentUser } = useRBAC();
  
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  const [showUserModal, setShowUserModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showSiteAccessModal, setShowSiteAccessModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedUserForSiteAccess, setSelectedUserForSiteAccess] = useState<User | null>(null);
  
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
    department: '',
    position: '',
    password: '',
    confirmPassword: '',
    role: '', // Changed from roles array to single role string
    isActive: true
  });

  const [formErrors, setFormErrors] = useState<{[key: string]: string}>({});

  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });

  const [siteAccessForm, setSiteAccessForm] = useState<SiteAccessPolicy[]>([]);

  // Loading states to prevent double-clicking
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [isSavingSiteAccess, setIsSavingSiteAccess] = useState(false);
  
  // Data loading states
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isLoadingRoles, setIsLoadingRoles] = useState(true);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Load data
  useEffect(() => {
    loadUsers();
    loadRoles();
  }, []);

  // Filter users
  useEffect(() => {
    let filtered = users;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.firstName.toLowerCase().includes(query) ||
        user.lastName.toLowerCase().includes(query) ||
        user.username.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        (user.department && user.department.toLowerCase().includes(query))
      );
    }

    if (selectedRole) {
      filtered = filtered.filter(user => user.roles.includes(selectedRole));
    }

    if (selectedDepartment) {
      filtered = filtered.filter(user => user.department === selectedDepartment);
    }

    if (statusFilter !== 'all') {
      const isActive = statusFilter === 'active';
      filtered = filtered.filter(user => user.isActive === isActive);
    }

    setFilteredUsers(filtered);
  }, [users, searchQuery, selectedRole, selectedDepartment, statusFilter]);

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const users = await apiService.getAllUsers();
      setUsers(users);
    } catch (error) {
      console.warn('API failed, using fallback users:', error);
      try {
        const users = await fallbackAuthService.getAllUsers();
        setUsers(users);
      } catch (fallbackError) {
        console.error('Failed to load users:', fallbackError);
        alert('Failed to load users: ' + (fallbackError instanceof Error ? fallbackError.message : 'Unknown error'));
      }
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const loadRoles = async () => {
    setIsLoadingRoles(true);
    try {
      const roles = await apiService.getAllRoles();
      setRoles(roles);
    } catch (error) {
      console.warn('API failed, using fallback roles:', error);
      try {
        const roles = await fallbackAuthService.getAllRoles();
        setRoles(roles);
      } catch (fallbackError) {
        console.error('Failed to load roles:', fallbackError);
        alert('Failed to load roles: ' + (fallbackError instanceof Error ? fallbackError.message : 'Unknown error'));
      }
    } finally {
      setIsLoadingRoles(false);
    }
  };

  const getDepartments = () => {
    const departments = users
      .map(user => user.department)
      .filter((dept, index, arr) => dept && arr.indexOf(dept) === index);
    return departments as string[];
  };

  const getRoleNames = (roleIds: string[]) => {
    return roleIds.map(roleId => {
      const role = roles.find(r => r.id === roleId);
      return role ? role.name : roleId;
    }).join(', ');
  };

  const validateUserForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!userForm.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    if (!userForm.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    if (!userForm.username.trim()) {
      errors.username = 'Username is required';
    }
    if (!userForm.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(userForm.email)) {
      errors.email = 'Email is invalid';
    }
    
    // Password validation
    if (!editingUser) {
      // Creating new user - password is required
      if (!userForm.password) {
        errors.password = 'Password is required for new users';
      } else if (userForm.password.length < 6) {
        errors.password = 'Password must be at least 6 characters';
      } else if (userForm.password !== userForm.confirmPassword) {
        errors.confirmPassword = 'Passwords do not match';
      }
    } else {
      // Editing existing user - password is optional, but if provided must be valid
      if (userForm.password) {
        if (userForm.password.length < 6) {
          errors.password = 'Password must be at least 6 characters';
        } else if (userForm.password !== userForm.confirmPassword) {
          errors.confirmPassword = 'Passwords do not match';
        }
      }
    }
    
    if (!userForm.role) {
      errors.role = 'A role must be selected';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setUserForm({
      username: '',
      email: '',
      firstName: '',
      lastName: '',
      phoneNumber: '',
      department: '',
      position: '',
      password: '',
      confirmPassword: '',
      role: '',
      isActive: true
    });
    setFormErrors({});
    setShowUserModal(true);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({
      username: user.username,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phoneNumber: user.phoneNumber || '',
      department: user.department || '',
      position: user.position || '',
      password: '',
      confirmPassword: '',
      role: user.roles[0] || '', // Take the first role or empty string
      isActive: user.isActive
    });
    setFormErrors({});
    setShowUserModal(true);
  };

  const handleSaveUser = async () => {
    if (!validateUserForm() || isSavingUser) {
      return;
    }

    setIsSavingUser(true);
    
    try {
      const formData = { ...userForm };
      // Convert single role string to roles array for API
      const apiData = {
        ...formData,
        roles: [formData.role] // Convert to array
      };
      // Remove the single role field and password fields if editing and no password provided
      delete (apiData as any).role;
      if (editingUser && !apiData.password) {
        delete apiData.password;
        delete apiData.confirmPassword;
      }
      
      if (editingUser) {
        try {
          await apiService.updateUser(editingUser.id, apiData);
        } catch (apiError) {
          console.warn('API update failed, using fallback:', apiError);
          await fallbackAuthService.updateUser(editingUser.id, apiData);
        }
      } else {
        try {
          await apiService.createUser(apiData);
        } catch (apiError) {
          console.warn('API create failed, using fallback:', apiError);
          await fallbackAuthService.createUser(apiData);
        }
      }
      await loadUsers();
      setShowUserModal(false);
      setFormErrors({});
    } catch (error) {
      console.error('Save user error:', error);
      alert(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsSavingUser(false);
    }
  };

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeleteUser = async (user: User) => {
    if (user.id === currentUser?.id) {
      alert('You cannot delete your own account');
      return;
    }
    
    // Show confirmation modal instead of using browser's confirm
    setUserToDelete(user);
    setDeleteError(null);
    setShowDeleteModal(true);
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    setIsDeleting(true);
    setDeleteError(null);
    
    try {
      // First remove user from any teams or associated data
      try {
        // Call a cleanup function to remove user references from all related data
        await apiService.cleanupUserReferences(userToDelete.id);
      } catch (cleanupError) {
        console.warn('API cleanup failed, using fallback:', cleanupError);
        try {
          // Fallback cleanup
          await fallbackAuthService.cleanupUserReferences(userToDelete.id);
        } catch (fallbackCleanupError) {
          console.warn('Fallback cleanup also failed, proceeding with deletion anyway:', fallbackCleanupError);
          // Continue with deletion despite cleanup issues
        }
      }
      
      // Then delete the user
      try {
        await apiService.deleteUser(userToDelete.id);
      } catch (apiError) {
        console.warn('API delete failed, using fallback:', apiError);
        await fallbackAuthService.deleteUser(userToDelete.id);
      }
      
      await loadUsers();
      setShowDeleteModal(false);
      setUserToDelete(null);
    } catch (error) {
      console.error('Delete user error:', error);
      setDeleteError(error instanceof Error ? error.message : 'An error occurred while deleting user');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleManageSiteAccess = (user: User) => {
    setSelectedUserForSiteAccess(user);
    setSiteAccessForm(user.siteAccess || []);
    setShowSiteAccessModal(true);
  };

  const handleSaveSiteAccess = async () => {
    if (!selectedUserForSiteAccess || isSavingSiteAccess) {
      return;
    }

    setIsSavingSiteAccess(true);
    
    try {
      try {
        await apiService.updateUserSiteAccess(selectedUserForSiteAccess.id, siteAccessForm);
      } catch (apiError) {
        console.warn('API updateUserSiteAccess failed, using fallback:', apiError);
        await fallbackAuthService.updateUserSiteAccess(selectedUserForSiteAccess.id, siteAccessForm);
      }
      await loadUsers();
      setShowSiteAccessModal(false);
    } catch (error) {
      console.error('Save site access error:', error);
      alert(error instanceof Error ? error.message : 'An error occurred while updating site access');
    } finally {
      setIsSavingSiteAccess(false);
    }
  };

  const addSiteAccess = () => {
    const newAccess: SiteAccessPolicy = {
      siteId: MOCK_SITES[0].id,
      siteName: MOCK_SITES[0].name,
      permissions: [],
      restrictions: []
    };
    setSiteAccessForm([...siteAccessForm, newAccess]);
  };

  const removeSiteAccess = (index: number) => {
    setSiteAccessForm(siteAccessForm.filter((_, i) => i !== index));
  };

  const updateSiteAccess = (index: number, updates: Partial<SiteAccessPolicy>) => {
    const updated = [...siteAccessForm];
    updated[index] = { ...updated[index], ...updates };
    if (updates.siteId) {
      const site = MOCK_SITES.find(s => s.id === updates.siteId);
      if (site) {
        updated[index].siteName = site.name;
      }
    }
    setSiteAccessForm(updated);
  };

  const updateSitePermission = (siteIndex: number, moduleIndex: number, updates: Partial<SitePermission>) => {
    const updated = [...siteAccessForm];
    if (!updated[siteIndex].permissions[moduleIndex]) {
      updated[siteIndex].permissions[moduleIndex] = { module: 'overview', actions: [] };
    }
    updated[siteIndex].permissions[moduleIndex] = { 
      ...updated[siteIndex].permissions[moduleIndex], 
      ...updates 
    };
    setSiteAccessForm(updated);
  };

  const addSitePermission = (siteIndex: number) => {
    const updated = [...siteAccessForm];
    updated[siteIndex].permissions.push({ module: 'overview', actions: [] });
    setSiteAccessForm(updated);
  };

  const removeSitePermission = (siteIndex: number, moduleIndex: number) => {
    const updated = [...siteAccessForm];
    updated[siteIndex].permissions.splice(moduleIndex, 1);
    setSiteAccessForm(updated);
  };

  // Show loading state if data is still loading
  if (isLoadingUsers || isLoadingRoles) {
    return (
      <div style={{ 
        background: 'var(--bg-primary)', 
        color: 'var(--text-primary)',
        minHeight: '100vh',
        padding: '24px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid var(--border-color)',
            borderTop: '4px solid var(--accent-primary)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <h2 style={{
            color: 'var(--text-primary)',
            fontSize: '18px',
            fontWeight: '600',
            margin: '0 0 8px 0'
          }}>
            {isLoadingUsers && isLoadingRoles ? 'Loading data...' : 
             isLoadingUsers ? 'Loading users...' : 'Loading roles...'}
          </h2>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: '14px',
            margin: '0'
          }}>
            Please wait while we fetch the user and role information.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      background: 'var(--bg-primary)', 
      color: 'var(--text-primary)',
      minHeight: '100vh',
      padding: '24px'
    }}>
      <div style={{ 
        maxWidth: '1280px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{ 
          marginBottom: '24px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h1 style={{ 
              color: 'var(--text-primary)',
              fontSize: '24px',
              fontWeight: 'bold',
              marginBottom: '8px',
              margin: '0 0 8px 0'
            }}>
              {t.userManagement}
            </h1>
            <p style={{ 
              color: 'var(--text-secondary)',
              fontSize: '14px',
              margin: '0'
            }}>
              Manage users, roles, and site access permissions
            </p>
          </div>
          <ThemeSwitcher />
        </div>

        {/* Stats Cards */}
        <div style={{ 
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          <div style={{ 
            background: 'var(--bg-card)', 
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between'
            }}>
              <div>
                <p style={{ 
                  color: 'var(--text-secondary)',
                  fontSize: '14px',
                  margin: '0 0 4px 0'
                }}>Total Users</p>
                <p style={{ 
                  color: 'var(--text-primary)',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  margin: '0'
                }}>{users.length}</p>
              </div>
              <div style={{ 
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--accent-primary)', 
                color: 'white'
              }}>
                👥
              </div>
            </div>
          </div>

          <div style={{ 
            background: 'var(--bg-card)', 
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between'
            }}>
              <div>
                <p style={{ 
                  color: 'var(--text-secondary)',
                  fontSize: '14px',
                  margin: '0 0 4px 0'
                }}>Active Users</p>
                <p style={{ 
                  color: 'var(--text-primary)',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  margin: '0'
                }}>
                  {users.filter(u => u.isActive).length}
                </p>
              </div>
              <div style={{ 
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--accent-success)', 
                color: 'white'
              }}>
                ✓
              </div>
            </div>
          </div>

          <div style={{ 
            background: 'var(--bg-card)', 
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between'
            }}>
              <div>
                <p style={{ 
                  color: 'var(--text-secondary)',
                  fontSize: '14px',
                  margin: '0 0 4px 0'
                }}>Total Roles</p>
                <p style={{ 
                  color: 'var(--text-primary)',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  margin: '0'
                }}>{roles.length}</p>
              </div>
              <div style={{ 
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--accent-warning)', 
                color: 'white'
              }}>
                🛡️
              </div>
            </div>
          </div>

          <div style={{ 
            background: 'var(--bg-card)', 
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-lg)',
            padding: '16px'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between'
            }}>
              <div>
                <p style={{ 
                  color: 'var(--text-secondary)',
                  fontSize: '14px',
                  margin: '0 0 4px 0'
                }}>Departments</p>
                <p style={{ 
                  color: 'var(--text-primary)',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  margin: '0'
                }}>
                  {getDepartments().length}
                </p>
              </div>
              <div style={{ 
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--accent-info)', 
                color: 'white'
              }}>
                🏢
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Actions */}
        <div style={{ 
          background: 'var(--bg-card)', 
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          padding: '16px',
          marginBottom: '24px'
        }}>
          <div style={{ 
            display: 'flex',
            flexWrap: 'wrap',
            gap: '16px',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ 
              display: 'flex',
              flexWrap: 'wrap',
              gap: '16px'
            }}>
              <input
                type="text"
                placeholder="Search users..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ 
                  background: 'var(--bg-primary)', 
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              />

              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                style={{ 
                  background: 'var(--bg-primary)', 
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value="">All Roles</option>
                {roles.map(role => (
                  <option key={role.id} value={role.id}>{role.name}</option>
                ))}
              </select>

              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                style={{ 
                  background: 'var(--bg-primary)', 
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value="">All Departments</option>
                {getDepartments().map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={{ 
                  background: 'var(--bg-primary)', 
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-primary)',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '14px'
                }}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <ProtectedComponent resource="users" action="create">
                <button
                  onClick={handleCreateUser}
                  style={{ 
                    background: 'var(--accent-primary)', 
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  + Add User
                </button>
              </ProtectedComponent>

            </div>
          </div>
        </div>

        {/* Users Table */}
        <div style={{ 
          background: 'var(--bg-card)', 
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)'
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%' }}>
              <thead>
                <tr style={{ 
                  borderBottom: '1px solid var(--border-color)'
                }}>
                  <th style={{ 
                    textAlign: 'left',
                    padding: '16px',
                    fontWeight: '500',
                    color: 'var(--text-primary)'
                  }}>User</th>
                  <th style={{ 
                    textAlign: 'left',
                    padding: '16px',
                    fontWeight: '500',
                    color: 'var(--text-primary)'
                  }}>Contact</th>
                  <th style={{ 
                    textAlign: 'left',
                    padding: '16px',
                    fontWeight: '500',
                    color: 'var(--text-primary)'
                  }}>Role</th>
                  <th style={{ 
                    textAlign: 'left',
                    padding: '16px',
                    fontWeight: '500',
                    color: 'var(--text-primary)'
                  }}>Department</th>
                  <th style={{ 
                    textAlign: 'left',
                    padding: '16px',
                    fontWeight: '500',
                    color: 'var(--text-primary)'
                  }}>Status</th>
                  <th style={{ 
                    textAlign: 'left',
                    padding: '16px',
                    fontWeight: '500',
                    color: 'var(--text-primary)'
                  }}>Site Access</th>
                  <th style={{ 
                    textAlign: 'left',
                    padding: '16px',
                    fontWeight: '500',
                    color: 'var(--text-primary)'
                  }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map(user => (
                  <tr key={user.id} style={{ 
                    borderBottom: '1px solid var(--border-color)'
                  }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ 
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px'
                      }}>
                        <div style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: 'var(--accent-primary)',
                          color: 'white',
                          fontWeight: '600'
                        }}>
                          {user.firstName?.charAt(0) || 'U'}{user.lastName?.charAt(0) || 'U'}
                        </div>
                        <div>
                          <p style={{ 
                            color: 'var(--text-primary)',
                            fontWeight: '500',
                            margin: '0 0 2px 0'
                          }}>
                            {user.firstName} {user.lastName}
                          </p>
                          <p style={{ 
                            color: 'var(--text-secondary)',
                            fontSize: '14px',
                            margin: '0'
                          }}>
                            @{user.username}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <p style={{ 
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        margin: '0 0 2px 0'
                      }}>{user.email}</p>
                      {user.phoneNumber && (
                        <p style={{ 
                          color: 'var(--text-secondary)',
                          fontSize: '14px',
                          margin: '0'
                        }}>{user.phoneNumber}</p>
                      )}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <p style={{ 
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        margin: '0'
                      }}>
                        {getRoleNames(user.roles)}
                      </p>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <p style={{ 
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        margin: '0 0 2px 0'
                      }}>
                        {user.department || '-'}
                      </p>
                      <p style={{ 
                        color: 'var(--text-secondary)',
                        fontSize: '14px',
                        margin: '0'
                      }}>
                        {user.position || '-'}
                      </p>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <span style={{ 
                        background: user.isActive ? 'var(--accent-success)' : 'var(--accent-danger)',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: '500'
                      }}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <p style={{ 
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        margin: '0'
                      }}>
                        {user.roles.includes(SYSTEM_ROLES.SUPER_ADMIN) 
                          ? 'All Sites' 
                          : `${user.siteAccess?.length || 0} sites`}
                      </p>
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <ProtectedComponent resource="users" action="update">
                          <button
                            onClick={() => handleEditUser(user)}
                            style={{ 
                              background: 'var(--accent-info)', 
                              color: 'white',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            Edit
                          </button>
                        </ProtectedComponent>
                        
                        <ProtectedComponent resource="users" action="manage_users">
                          <button
                            onClick={() => handleManageSiteAccess(user)}
                            style={{ 
                              background: 'var(--accent-warning)', 
                              color: 'white',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            Site Access
                          </button>
                        </ProtectedComponent>

                        <ProtectedComponent resource="users" action="delete">
                          <button
                            onClick={() => handleDeleteUser(user)}
                            disabled={user.id === currentUser?.id}
                            style={{ 
                              background: 'var(--accent-danger)', 
                              color: 'white',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              border: 'none',
                              cursor: user.id === currentUser?.id ? 'not-allowed' : 'pointer',
                              opacity: user.id === currentUser?.id ? 0.5 : 1
                            }}
                          >
                            Delete
                          </button>
                        </ProtectedComponent>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div style={{ 
              padding: '32px',
              textAlign: 'center',
              color: 'var(--text-secondary)'
            }}>
              No users found matching your criteria.
            </div>
          )}
        </div>

        {/* User Modal */}
        {showUserModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50
          }}>
            <div style={{
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              borderRadius: '8px',
              padding: '24px',
              width: '100%',
              maxWidth: '28rem',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                marginBottom: '16px'
              }}>
                {editingUser ? 'Edit User' : 'Create User'}
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px'
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '4px'
                    }}>First Name <span style={{ color: 'var(--accent-danger)' }}>*</span></label>
                    <input
                      type="text"
                      value={userForm.firstName}
                      onChange={(e) => setUserForm({...userForm, firstName: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        background: 'var(--bg-primary)',
                        border: `1px solid ${formErrors.firstName ? 'var(--accent-danger)' : 'var(--border-color)'}`,
                        color: 'var(--text-primary)'
                      }}
                    />
                    {formErrors.firstName && (
                      <p style={{
                        color: 'var(--accent-danger)',
                        fontSize: '12px',
                        margin: '4px 0 0 0'
                      }}>
                        {formErrors.firstName}
                      </p>
                    )}
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '4px'
                    }}>Last Name <span style={{ color: 'var(--accent-danger)' }}>*</span></label>
                    <input
                      type="text"
                      value={userForm.lastName}
                      onChange={(e) => setUserForm({...userForm, lastName: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        background: 'var(--bg-primary)',
                        border: `1px solid ${formErrors.lastName ? 'var(--accent-danger)' : 'var(--border-color)'}`,
                        color: 'var(--text-primary)'
                      }}
                    />
                    {formErrors.lastName && (
                      <p style={{
                        color: 'var(--accent-danger)',
                        fontSize: '12px',
                        margin: '4px 0 0 0'
                      }}>
                        {formErrors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    marginBottom: '4px'
                  }}>Username <span style={{ color: 'var(--accent-danger)' }}>*</span></label>
                  <input
                    type="text"
                    value={userForm.username}
                    onChange={(e) => setUserForm({...userForm, username: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      background: 'var(--bg-primary)',
                      border: `1px solid ${formErrors.username ? 'var(--accent-danger)' : 'var(--border-color)'}`,
                      color: 'var(--text-primary)'
                    }}
                  />
                  {formErrors.username && (
                    <p style={{
                      color: 'var(--accent-danger)',
                      fontSize: '12px',
                      margin: '4px 0 0 0'
                    }}>
                      {formErrors.username}
                    </p>
                  )}
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    marginBottom: '4px'
                  }}>Email <span style={{ color: 'var(--accent-danger)' }}>*</span></label>
                  <input
                    type="email"
                    value={userForm.email}
                    onChange={(e) => setUserForm({...userForm, email: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      background: 'var(--bg-primary)',
                      border: `1px solid ${formErrors.email ? 'var(--accent-danger)' : 'var(--border-color)'}`,
                      color: 'var(--text-primary)'
                    }}
                  />
                  {formErrors.email && (
                    <p style={{
                      color: 'var(--accent-danger)',
                      fontSize: '12px',
                      margin: '4px 0 0 0'
                    }}>
                      {formErrors.email}
                    </p>
                  )}
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    marginBottom: '4px'
                  }}>Phone Number</label>
                  <input
                    type="text"
                    value={userForm.phoneNumber}
                    onChange={(e) => setUserForm({...userForm, phoneNumber: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      background: 'var(--bg-primary)',
                      border: '1px solid var(--border-color)',
                      color: 'var(--text-primary)'
                    }}
                  />
                </div>

                {/* Password fields - only show for new users or when editing and user wants to change password */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px'
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '4px'
                    }}>Password {!editingUser && <span style={{ color: 'var(--accent-danger)' }}>*</span>}</label>
                    <input
                      type="password"
                      value={userForm.password}
                      placeholder={editingUser ? 'Leave blank to keep current password' : 'Enter password'}
                      onChange={(e) => setUserForm({...userForm, password: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        background: 'var(--bg-primary)',
                        border: `1px solid ${formErrors.password ? 'var(--accent-danger)' : 'var(--border-color)'}`,
                        color: 'var(--text-primary)'
                      }}
                    />
                    {formErrors.password && (
                      <p style={{
                        color: 'var(--accent-danger)',
                        fontSize: '12px',
                        marginTop: '4px',
                        margin: '4px 0 0 0'
                      }}>
                        {formErrors.password}
                      </p>
                    )}
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '4px'
                    }}>Confirm Password {!editingUser && userForm.password && <span style={{ color: 'var(--accent-danger)' }}>*</span>}</label>
                    <input
                      type="password"
                      value={userForm.confirmPassword}
                      placeholder={editingUser ? 'Confirm new password' : 'Confirm password'}
                      onChange={(e) => setUserForm({...userForm, confirmPassword: e.target.value})}
                      disabled={!userForm.password}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        background: !userForm.password ? 'var(--bg-secondary)' : 'var(--bg-primary)',
                        border: `1px solid ${formErrors.confirmPassword ? 'var(--accent-danger)' : 'var(--border-color)'}`,
                        color: 'var(--text-primary)',
                        cursor: !userForm.password ? 'not-allowed' : 'text'
                      }}
                    />
                    {formErrors.confirmPassword && (
                      <p style={{
                        color: 'var(--accent-danger)',
                        fontSize: '12px',
                        marginTop: '4px',
                        margin: '4px 0 0 0'
                      }}>
                        {formErrors.confirmPassword}
                      </p>
                    )}
                  </div>
                </div>

                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: '16px'
                }}>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '4px'
                    }}>Department</label>
                    <select
                      value={userForm.department}
                      onChange={(e) => setUserForm({...userForm, department: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <option value="">Select department...</option>
                      {DEPARTMENTS.map(department => (
                        <option key={department} value={department}>{department}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: '500',
                      marginBottom: '4px'
                    }}>Position</label>
                    <select
                      value={userForm.position}
                      onChange={(e) => setUserForm({...userForm, position: e.target.value})}
                      style={{
                        width: '100%',
                        padding: '8px 12px',
                        borderRadius: '4px',
                        background: 'var(--bg-primary)',
                        border: '1px solid var(--border-color)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <option value="">Select position...</option>
                      {POSITIONS.sort().map(position => (
                        <option key={position} value={position}>{position}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '500',
                    marginBottom: '4px'
                  }}>Role <span style={{ color: 'var(--accent-danger)' }}>*</span></label>
                  <select
                    value={userForm.role}
                    onChange={(e) => setUserForm({...userForm, role: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      background: 'var(--bg-primary)',
                      border: `1px solid ${formErrors.role ? 'var(--accent-danger)' : 'var(--border-color)'}`,
                      color: 'var(--text-primary)'
                    }}
                  >
                    <option value="">Select a role...</option>
                    {roles.map(role => (
                      <option key={role.id} value={role.id}>{role.name}</option>
                    ))}
                  </select>
                  {formErrors.role && (
                    <p style={{
                      color: 'var(--accent-danger)',
                      fontSize: '12px',
                      margin: '4px 0 0 0'
                    }}>
                      {formErrors.role}
                    </p>
                  )}
                </div>

                <div>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <input
                      type="checkbox"
                      checked={userForm.isActive}
                      onChange={(e) => setUserForm({...userForm, isActive: e.target.checked})}
                    />
                    <span style={{ fontSize: '14px' }}>Active User</span>
                  </label>
                </div>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px',
                marginTop: '24px'
              }}>
                <button
                  onClick={() => setShowUserModal(false)}
                  style={{
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveUser}
                  disabled={isSavingUser}
                  style={{
                    background: 'var(--accent-primary)',
                    color: 'white',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    border: 'none',
                    cursor: isSavingUser ? 'not-allowed' : 'pointer',
                    opacity: isSavingUser ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {isSavingUser && (
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid white',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                  )}
                  {isSavingUser ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && userToDelete && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 60
          }}>
            <div style={{
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              borderRadius: '12px',
              padding: '24px',
              width: '100%',
              maxWidth: '28rem',
              boxShadow: 'var(--shadow-xl)'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <div style={{
                  fontSize: '48px',
                  marginBottom: '16px',
                  color: 'var(--accent-danger)'
                }}>⚠️</div>
                <h3 style={{
                  fontSize: '20px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: 'var(--accent-danger)'
                }}>
                  Delete User Confirmation
                </h3>
                <p style={{
                  fontSize: '16px',
                  color: 'var(--text-primary)',
                  margin: '0 0 8px 0'
                }}>
                  Are you sure you want to delete:
                </p>
                <p style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: 'var(--text-primary)',
                  margin: '0 0 16px 0'
                }}>
                  {userToDelete.firstName} {userToDelete.lastName} (@{userToDelete.username})
                </p>
              </div>
              
              <div style={{
                background: 'var(--bg-secondary)',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '20px'
              }}>
                <h4 style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  marginBottom: '8px',
                  color: 'var(--text-primary)'
                }}>
                  This action will:
                </h4>
                <ul style={{
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  margin: '0',
                  paddingLeft: '20px'
                }}>
                  <li>Permanently delete the user account</li>
                  <li>Remove all site access permissions</li>
                  <li>Remove user from all teams and projects</li>
                  <li>Archive all user activity logs</li>
                  <li>This action cannot be undone</li>
                </ul>
              </div>
              
              {deleteError && (
                <div style={{
                  background: 'var(--accent-danger)',
                  color: 'white',
                  padding: '12px',
                  borderRadius: '6px',
                  fontSize: '14px',
                  marginBottom: '16px'
                }}>
                  {deleteError}
                </div>
              )}
              
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '12px'
              }}>
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setUserToDelete(null);
                    setDeleteError(null);
                  }}
                  disabled={isDeleting}
                  style={{
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    padding: '12px 24px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    border: '1px solid var(--border-color)',
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                    opacity: isDeleting ? 0.6 : 1
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteUser}
                  disabled={isDeleting}
                  style={{
                    background: 'var(--accent-danger)',
                    color: 'white',
                    padding: '12px 24px',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    border: 'none',
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                    opacity: isDeleting ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {isDeleting && (
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid white',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                  )}
                  {isDeleting ? 'Deleting...' : 'Delete User'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Site Access Modal */}
        {showSiteAccessModal && selectedUserForSiteAccess && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50
          }}>
            <div style={{
              background: 'var(--bg-card)',
              color: 'var(--text-primary)',
              borderRadius: '8px',
              padding: '24px',
              width: '100%',
              maxWidth: '64rem',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                marginBottom: '16px'
              }}>
                Manage Site Access - {selectedUserForSiteAccess.firstName} {selectedUserForSiteAccess.lastName}
              </h3>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '24px'
              }}>
                {siteAccessForm.map((siteAccess, siteIndex) => (
                  <div key={siteIndex} style={{
                    border: '1px solid var(--border-color)',
                    borderRadius: '8px',
                    padding: '16px'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '16px'
                    }}>
                      <div style={{ flex: 1 }}>
                        <label style={{
                          display: 'block',
                          fontSize: '14px',
                          fontWeight: '500',
                          marginBottom: '4px'
                        }}>Site</label>
                        <select
                          value={siteAccess.siteId}
                          onChange={(e) => updateSiteAccess(siteIndex, { 
                            siteId: e.target.value,
                            siteName: MOCK_SITES.find(s => s.id === e.target.value)?.name || ''
                          })}
                          style={{ 
                            width: '100%',
                            padding: '8px 12px',
                            borderRadius: '4px',
                            border: '1px solid var(--border-color)',
                            background: 'var(--bg-primary)', 
                            color: 'var(--text-primary)',
                            fontSize: '14px'
                          }}
                        >
                          {MOCK_SITES.map(site => (
                            <option key={site.id} value={site.id}>{site.name}</option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={() => removeSiteAccess(siteIndex)}
                        style={{
                          marginLeft: '16px',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          fontSize: '14px',
                          border: 'none',
                          cursor: 'pointer',
                          background: 'var(--accent-danger)', 
                          color: 'white'
                        }}
                      >
                        Remove Site
                      </button>
                    </div>

                    <div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '8px'
                      }}>
                        <label style={{
                          fontSize: '14px',
                          fontWeight: '500'
                        }}>Module Permissions</label>
                        <button
                          onClick={() => addSitePermission(siteIndex)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            border: 'none',
                            cursor: 'pointer',
                            background: 'var(--accent-info)', 
                            color: 'white'
                          }}
                        >
                          Add Module
                        </button>
                      </div>
                      
                      {siteAccess.permissions.map((permission, moduleIndex) => (
                        <div key={moduleIndex} style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '16px',
                          marginBottom: '8px',
                          padding: '8px',
                          borderRadius: '4px',
                          background: 'var(--bg-secondary)'
                        }}>
                          <select
                            value={permission.module}
                            onChange={(e) => updateSitePermission(siteIndex, moduleIndex, { 
                              module: e.target.value as SiteModule 
                            })}
                            style={{ 
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '14px',
                              background: 'var(--bg-primary)', 
                              border: '1px solid var(--border-color)',
                              color: 'var(--text-primary)'
                            }}
                          >
                            {SITE_MODULES.map(module => (
                              <option key={module.value} value={module.value}>
                                {module.label}
                              </option>
                            ))}
                          </select>

                          <div style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: '8px',
                            flex: 1
                          }}>
                            {SITE_ACTIONS.map(action => (
                              <label key={action.value} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                <input
                                  type="checkbox"
                                  checked={permission.actions.includes(action.value)}
                                  onChange={(e) => {
                                    const actions = e.target.checked
                                      ? [...permission.actions, action.value]
                                      : permission.actions.filter(a => a !== action.value);
                                    updateSitePermission(siteIndex, moduleIndex, { actions });
                                  }}
                                />
                                <span style={{ fontSize: '12px' }}>{action.label}</span>
                              </label>
                            ))}
                          </div>

                          <button
                            onClick={() => removeSitePermission(siteIndex, moduleIndex)}
                            style={{
                              padding: '4px 8px',
                              borderRadius: '4px',
                              fontSize: '12px',
                              border: 'none',
                              cursor: 'pointer',
                              background: 'var(--accent-danger)', 
                              color: 'white'
                            }}
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <button
                  onClick={addSiteAccess}
                  style={{
                    width: '100%',
                    padding: '12px',
                    borderRadius: '4px',
                    border: '2px dashed var(--accent-primary)',
                    fontSize: '14px',
                    cursor: 'pointer',
                    color: 'var(--accent-primary)',
                    background: 'transparent'
                  }}
                >
                  + Add Site Access
                </button>
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px',
                marginTop: '24px'
              }}>
                <button
                  onClick={() => setShowSiteAccessModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    border: 'none',
                    cursor: 'pointer',
                    background: 'var(--bg-secondary)', 
                    color: 'var(--text-primary)'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveSiteAccess}
                  disabled={isSavingSiteAccess}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '4px',
                    fontSize: '14px',
                    border: 'none',
                    cursor: isSavingSiteAccess ? 'not-allowed' : 'pointer',
                    background: 'var(--accent-primary)', 
                    color: 'white',
                    opacity: isSavingSiteAccess ? 0.6 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {isSavingSiteAccess && (
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid white',
                      borderTop: '2px solid transparent',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                  )}
                  {isSavingSiteAccess ? 'Saving...' : 'Save Site Access'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
