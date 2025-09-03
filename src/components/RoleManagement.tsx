import React, { useState, useEffect } from 'react';
import { 
  Role, 
  Permission, 
  ResourceType, 
  ActionType, 
  PERMISSION_TEMPLATES,
  SYSTEM_ROLES 
} from '../types/user';
import { userService } from '../services/userService';
import { useRBAC, ProtectedComponent } from '../contexts/RBACContext';
import { useI18n } from '../contexts/I18nContext';

const RESOURCES: { value: ResourceType; label: string; description: string }[] = [
  { value: 'dashboard', label: 'Dashboard', description: 'Main dashboard and overview' },
  { value: 'employees', label: 'Employees', description: 'Employee management and records' },
  { value: 'sites', label: 'Sites', description: 'Construction sites and projects' },
  { value: 'safes', label: 'Safes', description: 'Financial safes and cash management' },
  { value: 'expenses', label: 'Expenses', description: 'Expense tracking and management' },
  { value: 'revenues', label: 'Revenues', description: 'Revenue and income management' },
  { value: 'payroll', label: 'Payroll', description: 'Employee payroll and salary management' },
  { value: 'reports', label: 'Reports', description: 'Report generation and analytics' },
  { value: 'settings', label: 'Settings', description: 'System settings and configuration' },
  { value: 'users', label: 'Users', description: 'User and role management' },
  { value: 'system', label: 'System', description: 'System administration' }
];

const ACTIONS: { value: ActionType; label: string; description: string }[] = [
  { value: 'read', label: 'Read', description: 'View and access data' },
  { value: 'create', label: 'Create', description: 'Add new records' },
  { value: 'update', label: 'Update', description: 'Modify existing records' },
  { value: 'delete', label: 'Delete', description: 'Remove records' },
  { value: 'approve', label: 'Approve', description: 'Approve workflows and requests' },
  { value: 'reject', label: 'Reject', description: 'Reject requests and workflows' },
  { value: 'export', label: 'Export', description: 'Export data and reports' },
  { value: 'import', label: 'Import', description: 'Import data from external sources' },
  { value: 'manage_users', label: 'Manage Users', description: 'Manage user accounts and permissions' },
  { value: 'manage_roles', label: 'Manage Roles', description: 'Create and manage user roles' },
  { value: 'system_settings', label: 'System Settings', description: 'Configure system-wide settings' }
];

const RoleManagement: React.FC = () => {
  const { t } = useI18n();
  const { hasPermission, currentUser } = useRBAC();
  
  const [roles, setRoles] = useState<Role[]>([]);
  const [filteredRoles, setFilteredRoles] = useState<Role[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'system' | 'custom'>('all');
  
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedRoleForPermissions, setSelectedRoleForPermissions] = useState<Role | null>(null);
  
  const [roleForm, setRoleForm] = useState({
    name: '',
    description: '',
    permissions: [] as Permission[]
  });

  const [permissionMatrix, setPermissionMatrix] = useState<Record<string, ActionType[]>>({});

  // Load data
  useEffect(() => {
    loadRoles();
  }, []);

  // Filter roles
  useEffect(() => {
    let filtered = roles;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(role =>
        role.name.toLowerCase().includes(query) ||
        role.description.toLowerCase().includes(query)
      );
    }

    if (filterType !== 'all') {
      if (filterType === 'system') {
        filtered = filtered.filter(role => role.isSystemRole);
      } else {
        filtered = filtered.filter(role => !role.isSystemRole);
      }
    }

    setFilteredRoles(filtered);
  }, [roles, searchQuery, filterType]);

  const loadRoles = () => {
    setRoles(userService.getAllRoles());
  };

  const getUsersWithRole = (roleId: string) => {
    const users = userService.getAllUsers();
    return users.filter(user => user.roles.includes(roleId));
  };

  const handleCreateRole = () => {
    setEditingRole(null);
    setRoleForm({
      name: '',
      description: '',
      permissions: []
    });
    setPermissionMatrix({});
    setShowRoleModal(true);
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      description: role.description,
      permissions: role.permissions
    });
    
    // Convert permissions to matrix format
    const matrix: Record<string, ActionType[]> = {};
    role.permissions.forEach(permission => {
      if (!matrix[permission.resource]) {
        matrix[permission.resource] = [];
      }
      matrix[permission.resource].push(permission.action);
    });
    setPermissionMatrix(matrix);
    setShowRoleModal(true);
  };

  const handleSaveRole = async () => {
    try {
      // Convert matrix back to permissions
      const permissions: Permission[] = [];
      Object.entries(permissionMatrix).forEach(([resource, actions]) => {
        actions.forEach(action => {
          permissions.push({
            id: `${resource}-${action}`,
            resource: resource as ResourceType,
            action
          });
        });
      });

      const roleData = {
        ...roleForm,
        permissions
      };

      if (editingRole) {
        userService.updateRole(editingRole.id, roleData);
      } else {
        userService.createRole(roleData);
      }
      
      loadRoles();
      setShowRoleModal(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'An error occurred');
    }
  };

  const handleDeleteRole = (role: Role) => {
    if (role.isSystemRole) {
      alert('Cannot delete system roles');
      return;
    }

    const usersWithRole = getUsersWithRole(role.id);
    if (usersWithRole.length > 0) {
      alert(`Cannot delete role: ${usersWithRole.length} user(s) have this role`);
      return;
    }

    if (confirm(`Are you sure you want to delete role "${role.name}"?`)) {
      userService.deleteRole(role.id);
      loadRoles();
    }
  };

  const handleManagePermissions = (role: Role) => {
    setSelectedRoleForPermissions(role);
    const matrix: Record<string, ActionType[]> = {};
    role.permissions.forEach(permission => {
      if (!matrix[permission.resource]) {
        matrix[permission.resource] = [];
      }
      matrix[permission.resource].push(permission.action);
    });
    setPermissionMatrix(matrix);
    setShowPermissionModal(true);
  };

  const handlePermissionChange = (resource: ResourceType, action: ActionType, checked: boolean) => {
    setPermissionMatrix(prev => {
      const newMatrix = { ...prev };
      if (!newMatrix[resource]) {
        newMatrix[resource] = [];
      }
      
      if (checked) {
        if (!newMatrix[resource].includes(action)) {
          newMatrix[resource] = [...newMatrix[resource], action];
        }
      } else {
        newMatrix[resource] = newMatrix[resource].filter(a => a !== action);
        if (newMatrix[resource].length === 0) {
          delete newMatrix[resource];
        }
      }
      
      return newMatrix;
    });
  };

  const applyPermissionTemplate = (templateKey: keyof typeof PERMISSION_TEMPLATES) => {
    const template = PERMISSION_TEMPLATES[templateKey];
    const matrix: Record<string, ActionType[]> = {};
    
    template.forEach((item: any) => {
      matrix[item.resource] = item.actions as ActionType[];
    });
    
    setPermissionMatrix(matrix);
  };

  const hasResourcePermission = (resource: ResourceType, action: ActionType): boolean => {
    return permissionMatrix[resource]?.includes(action) || false;
  };

  return (
    <ProtectedComponent resource="users" action="manage_roles" fallback={
      <div className="p-6 text-center">
        <h2 className="text-xl font-bold text-red-600 mb-4">Access Denied</h2>
        <p className="text-gray-600">You don't have permission to manage roles.</p>
      </div>
    }>
      <div className="p-6" style={{ 
        background: 'var(--bg-primary)', 
        color: 'var(--text-primary)',
        minHeight: '100vh'
      }}>
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
              Role & Permission Management
            </h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Create and manage user roles with granular permissions
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="card p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Total Roles</p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{roles.length}</p>
                </div>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" 
                  style={{ background: 'var(--accent-primary)', color: 'white' }}>
                  🛡️
                </div>
              </div>
            </div>

            <div className="card p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>System Roles</p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {roles.filter(r => r.isSystemRole).length}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" 
                  style={{ background: 'var(--accent-warning)', color: 'white' }}>
                  ⚙️
                </div>
              </div>
            </div>

            <div className="card p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Custom Roles</p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                    {roles.filter(r => !r.isSystemRole).length}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" 
                  style={{ background: 'var(--accent-success)', color: 'white' }}>
                  ✨
                </div>
              </div>
            </div>

            <div className="card p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Resources</p>
                  <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{RESOURCES.length}</p>
                </div>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" 
                  style={{ background: 'var(--accent-info)', color: 'white' }}>
                  📊
                </div>
              </div>
            </div>
          </div>

          {/* Filters and Actions */}
          <div className="card p-4 mb-6" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex flex-wrap gap-4">
                <input
                  type="text"
                  placeholder="Search roles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-3 py-2 rounded-md text-sm"
                  style={{ 
                    background: 'var(--bg-primary)', 
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)'
                  }}
                />

                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as any)}
                  className="px-3 py-2 rounded-md text-sm"
                  style={{ 
                    background: 'var(--bg-primary)', 
                    border: '1px solid var(--border-color)',
                    color: 'var(--text-primary)'
                  }}
                >
                  <option value="all">All Roles</option>
                  <option value="system">System Roles</option>
                  <option value="custom">Custom Roles</option>
                </select>
              </div>

              <ProtectedComponent resource="users" action="manage_roles">
                <button
                  onClick={handleCreateRole}
                  className="px-4 py-2 rounded-md text-sm font-medium"
                  style={{ background: 'var(--accent-primary)', color: 'white' }}
                >
                  + Create Role
                </button>
              </ProtectedComponent>
            </div>
          </div>

          {/* Roles Table */}
          <div className="card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                    <th className="text-left p-4 font-medium" style={{ color: 'var(--text-primary)' }}>Role</th>
                    <th className="text-left p-4 font-medium" style={{ color: 'var(--text-primary)' }}>Description</th>
                    <th className="text-left p-4 font-medium" style={{ color: 'var(--text-primary)' }}>Permissions</th>
                    <th className="text-left p-4 font-medium" style={{ color: 'var(--text-primary)' }}>Users</th>
                    <th className="text-left p-4 font-medium" style={{ color: 'var(--text-primary)' }}>Type</th>
                    <th className="text-left p-4 font-medium" style={{ color: 'var(--text-primary)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoles.map(role => {
                    const usersCount = getUsersWithRole(role.id).length;
                    return (
                      <tr key={role.id} className="border-b hover:bg-opacity-50" 
                        style={{ borderColor: 'var(--border-color)' }}>
                        <td className="p-4">
                          <div>
                            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                              {role.name}
                            </p>
                            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                              ID: {role.id}
                            </p>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                            {role.description}
                          </p>
                        </td>
                        <td className="p-4">
                          <div className="flex flex-wrap gap-1">
                            {role.permissions.slice(0, 3).map((perm, idx) => (
                              <span key={idx} className="px-2 py-1 rounded-full text-xs" 
                                style={{ 
                                  background: 'var(--accent-info)', 
                                  color: 'white' 
                                }}>
                                {perm.resource}:{perm.action}
                              </span>
                            ))}
                            {role.permissions.length > 3 && (
                              <span className="px-2 py-1 rounded-full text-xs" 
                                style={{ 
                                  background: 'var(--text-secondary)', 
                                  color: 'white' 
                                }}>
                                +{role.permissions.length - 3}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                            {usersCount} users
                          </p>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium`}
                            style={{ 
                              background: role.isSystemRole ? 'var(--accent-warning)' : 'var(--accent-success)',
                              color: 'white'
                            }}>
                            {role.isSystemRole ? 'System' : 'Custom'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleManagePermissions(role)}
                              className="text-xs px-2 py-1 rounded"
                              style={{ background: 'var(--accent-info)', color: 'white' }}
                            >
                              Permissions
                            </button>
                            
                            <ProtectedComponent resource="users" action="manage_roles">
                              {!role.isSystemRole && (
                                <>
                                  <button
                                    onClick={() => handleEditRole(role)}
                                    className="text-xs px-2 py-1 rounded"
                                    style={{ background: 'var(--accent-warning)', color: 'white' }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteRole(role)}
                                    className="text-xs px-2 py-1 rounded"
                                    style={{ background: 'var(--accent-danger)', color: 'white' }}
                                  >
                                    Delete
                                  </button>
                                </>
                              )}
                            </ProtectedComponent>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {filteredRoles.length === 0 && (
              <div className="p-8 text-center" style={{ color: 'var(--text-secondary)' }}>
                No roles found matching your criteria.
              </div>
            )}
          </div>

          {/* Role Modal */}
          {showRoleModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto"
                style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                <h3 className="text-lg font-semibold mb-4">
                  {editingRole ? 'Edit Role' : 'Create Role'}
                </h3>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Role Name</label>
                      <input
                        type="text"
                        value={roleForm.name}
                        onChange={(e) => setRoleForm({...roleForm, name: e.target.value})}
                        className="w-full px-3 py-2 rounded border"
                        style={{ 
                          background: 'var(--bg-primary)', 
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-primary)'
                        }}
                        placeholder="Enter role name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Description</label>
                      <input
                        type="text"
                        value={roleForm.description}
                        onChange={(e) => setRoleForm({...roleForm, description: e.target.value})}
                        className="w-full px-3 py-2 rounded border"
                        style={{ 
                          background: 'var(--bg-primary)', 
                          border: '1px solid var(--border-color)',
                          color: 'var(--text-primary)'
                        }}
                        placeholder="Enter role description"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <label className="text-sm font-medium">Permissions</label>
                      <div className="flex gap-2">
                        <button
                          onClick={() => applyPermissionTemplate('MANAGER_PERMISSIONS')}
                          className="px-3 py-1 text-xs rounded"
                          style={{ background: 'var(--accent-info)', color: 'white' }}
                        >
                          Manager Template
                        </button>
                        <button
                          onClick={() => applyPermissionTemplate('VIEWER_PERMISSIONS')}
                          className="px-3 py-1 text-xs rounded"
                          style={{ background: 'var(--accent-success)', color: 'white' }}
                        >
                          Viewer Template
                        </button>
                        <button
                          onClick={() => applyPermissionTemplate('ALL_PERMISSIONS')}
                          className="px-3 py-1 text-xs rounded"
                          style={{ background: 'var(--accent-warning)', color: 'white' }}
                        >
                          Full Access
                        </button>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4" style={{ borderColor: 'var(--border-color)' }}>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr>
                              <th className="text-left p-2 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                Resource
                              </th>
                              {ACTIONS.map(action => (
                                <th key={action.value} className="text-center p-2 text-xs" style={{ color: 'var(--text-primary)' }}>
                                  {action.label}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {RESOURCES.map(resource => (
                              <tr key={resource.value} className="border-t" style={{ borderColor: 'var(--border-color)' }}>
                                <td className="p-2">
                                  <div>
                                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                      {resource.label}
                                    </p>
                                    <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                                      {resource.description}
                                    </p>
                                  </div>
                                </td>
                                {ACTIONS.map(action => (
                                  <td key={action.value} className="p-2 text-center">
                                    <input
                                      type="checkbox"
                                      checked={hasResourcePermission(resource.value, action.value)}
                                      onChange={(e) => handlePermissionChange(resource.value, action.value, e.target.checked)}
                                      className="w-4 h-4"
                                    />
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 mt-6">
                  <button
                    onClick={() => setShowRoleModal(false)}
                    className="px-4 py-2 rounded text-sm"
                    style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveRole}
                    className="px-4 py-2 rounded text-sm"
                    style={{ background: 'var(--accent-primary)', color: 'white' }}
                  >
                    Save Role
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Permission Modal */}
          {showPermissionModal && selectedRoleForPermissions && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-6xl max-h-[90vh] overflow-y-auto"
                style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                <h3 className="text-lg font-semibold mb-4">
                  Permissions for "{selectedRoleForPermissions.name}"
                </h3>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                        <th className="text-left p-3 font-medium" style={{ color: 'var(--text-primary)' }}>
                          Resource
                        </th>
                        {ACTIONS.map(action => (
                          <th key={action.value} className="text-center p-3 text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                            <div className="flex flex-col items-center">
                              <span>{action.label}</span>
                              <span className="text-xs font-normal" style={{ color: 'var(--text-secondary)' }}>
                                {action.description}
                              </span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {RESOURCES.map(resource => (
                        <tr key={resource.value} className="border-b" style={{ borderColor: 'var(--border-color)' }}>
                          <td className="p-3">
                            <div>
                              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                                {resource.label}
                              </p>
                              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                                {resource.description}
                              </p>
                            </div>
                          </td>
                          {ACTIONS.map(action => (
                            <td key={action.value} className="p-3 text-center">
                              <div className="flex flex-col items-center">
                                {hasResourcePermission(resource.value, action.value) ? (
                                  <span className="text-green-500 text-lg">✓</span>
                                ) : (
                                  <span className="text-gray-400 text-lg">✗</span>
                                )}
                              </div>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={() => setShowPermissionModal(false)}
                    className="px-4 py-2 rounded text-sm"
                    style={{ background: 'var(--accent-primary)', color: 'white' }}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedComponent>
  );
};

export default RoleManagement;
