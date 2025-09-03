import { useState, useCallback, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export interface NavigationItem {
  id: string;
  label: string;
  path: string;
  icon?: string;
  description?: string;
  level: number;
  parentId?: string;
  children?: string[];
  metadata?: Record<string, any>;
  requiredPermissions?: string[];
  isActive?: boolean;
  isDisabled?: boolean;
}

export interface BreadcrumbItem {
  id: string;
  label: string;
  path: string;
  isClickable: boolean;
  isActive: boolean;
}

export interface NavigationState {
  currentPath: string;
  currentSection: string;
  breadcrumbs: BreadcrumbItem[];
  availableNavigation: NavigationItem[];
  navigationHistory: string[];
  canGoBack: boolean;
  canGoForward: boolean;
}

export interface UseRoleNavigationFixOptions {
  basePath?: string;
  maxHistoryLength?: number;
  enableBreadcrumbs?: boolean;
  enableKeyboardNavigation?: boolean;
  autoFocusOnNavigation?: boolean;
  preserveScrollPosition?: boolean;
}

export interface UseRoleNavigationFixReturn {
  // Navigation state
  navigationState: NavigationState;
  
  // Navigation actions
  navigateTo: (path: string, options?: { replace?: boolean; state?: any }) => void;
  goBack: () => void;
  goForward: () => void;
  goToSection: (sectionId: string) => void;
  goToRoot: () => void;
  
  // Breadcrumbs
  generateBreadcrumbs: (path: string) => BreadcrumbItem[];
  navigateToBreadcrumb: (breadcrumbId: string) => void;
  
  // Navigation menu
  getNavigationItems: (userPermissions?: string[]) => NavigationItem[];
  getActiveNavigationItem: () => NavigationItem | null;
  getNavigationItemByPath: (path: string) => NavigationItem | null;
  
  // Utility functions
  isCurrentPath: (path: string) => boolean;
  isParentPath: (path: string) => boolean;
  getRelativeNavigation: (currentPath: string) => {
    previous?: NavigationItem;
    next?: NavigationItem;
    siblings: NavigationItem[];
    parent?: NavigationItem;
    children: NavigationItem[];
  };
  
  // History management
  clearHistory: () => void;
  getNavigationHistory: () => string[];
  
  // Keyboard navigation
  enableKeyboardNavigation: boolean;
  setEnableKeyboardNavigation: (enabled: boolean) => void;
  
  // Error handling
  navigationError: string | null;
  clearNavigationError: () => void;
}

// Default navigation structure for role management
const DEFAULT_ROLE_NAVIGATION: NavigationItem[] = [
  {
    id: 'role-management',
    label: 'Role Management',
    path: '/roles',
    icon: 'users',
    description: 'Manage user roles and permissions',
    level: 0,
    children: ['roles-list', 'roles-create', 'permissions-overview'],
    requiredPermissions: ['roles.view']
  },
  {
    id: 'roles-list',
    label: 'All Roles',
    path: '/roles/list',
    icon: 'list',
    description: 'View and manage all user roles',
    level: 1,
    parentId: 'role-management',
    children: ['role-details'],
    requiredPermissions: ['roles.view']
  },
  {
    id: 'roles-create',
    label: 'Create Role',
    path: '/roles/create',
    icon: 'plus',
    description: 'Create a new user role',
    level: 1,
    parentId: 'role-management',
    requiredPermissions: ['roles.create']
  },
  {
    id: 'role-details',
    label: 'Role Details',
    path: '/roles/:roleId',
    icon: 'user',
    description: 'View and edit role details',
    level: 2,
    parentId: 'roles-list',
    children: ['role-edit', 'role-permissions', 'role-users'],
    requiredPermissions: ['roles.view']
  },
  {
    id: 'role-edit',
    label: 'Edit Role',
    path: '/roles/:roleId/edit',
    icon: 'edit',
    description: 'Edit role information',
    level: 3,
    parentId: 'role-details',
    requiredPermissions: ['roles.edit']
  },
  {
    id: 'role-permissions',
    label: 'Role Permissions',
    path: '/roles/:roleId/permissions',
    icon: 'key',
    description: 'Manage role permissions',
    level: 3,
    parentId: 'role-details',
    requiredPermissions: ['roles.permissions']
  },
  {
    id: 'role-users',
    label: 'Role Users',
    path: '/roles/:roleId/users',
    icon: 'users',
    description: 'Manage users assigned to this role',
    level: 3,
    parentId: 'role-details',
    requiredPermissions: ['roles.users']
  },
  {
    id: 'permissions-overview',
    label: 'Permissions Overview',
    path: '/roles/permissions',
    icon: 'shield',
    description: 'Overview of all system permissions',
    level: 1,
    parentId: 'role-management',
    children: ['permission-details'],
    requiredPermissions: ['permissions.view']
  },
  {
    id: 'permission-details',
    label: 'Permission Details',
    path: '/roles/permissions/:permissionId',
    icon: 'info',
    description: 'View permission details and usage',
    level: 2,
    parentId: 'permissions-overview',
    requiredPermissions: ['permissions.view']
  },
  {
    id: 'role-assignments',
    label: 'Role Assignments',
    path: '/roles/assignments',
    icon: 'user-check',
    description: 'Bulk role assignments and management',
    level: 1,
    parentId: 'role-management',
    requiredPermissions: ['roles.assign']
  },
  {
    id: 'role-templates',
    label: 'Role Templates',
    path: '/roles/templates',
    icon: 'template',
    description: 'Predefined role templates',
    level: 1,
    parentId: 'role-management',
    children: ['template-details'],
    requiredPermissions: ['roles.templates']
  },
  {
    id: 'template-details',
    label: 'Template Details',
    path: '/roles/templates/:templateId',
    icon: 'file-text',
    description: 'View and manage role template',
    level: 2,
    parentId: 'role-templates',
    requiredPermissions: ['roles.templates']
  },
  {
    id: 'role-audit',
    label: 'Role Audit Log',
    path: '/roles/audit',
    icon: 'clock',
    description: 'Audit log for role changes',
    level: 1,
    parentId: 'role-management',
    requiredPermissions: ['roles.audit']
  }
];

export function useRoleNavigationFix(options: UseRoleNavigationFixOptions = {}): UseRoleNavigationFixReturn {
  const {
    basePath = '/roles',
    maxHistoryLength = 50,
    enableBreadcrumbs = true,
    enableKeyboardNavigation = true,
    autoFocusOnNavigation = false,
    preserveScrollPosition = true
  } = options;

  const location = useLocation();
  const navigate = useNavigate();

  const [navigationItems] = useState<NavigationItem[]>(DEFAULT_ROLE_NAVIGATION);
  const [navigationHistory, setNavigationHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [navigationError, setNavigationError] = useState<string | null>(null);
  const [keyboardNavigationEnabled, setKeyboardNavigationEnabled] = useState(enableKeyboardNavigation);
  const [scrollPositions, setScrollPositions] = useState<Map<string, number>>(new Map());

  // Get current navigation state
  const navigationState = useMemo((): NavigationState => {
    const currentPath = location.pathname;
    const currentSection = getCurrentSection(currentPath, basePath);
    const breadcrumbs = enableBreadcrumbs ? generateBreadcrumbsForPath(currentPath) : [];
    const availableNavigation = getFilteredNavigationItems();

    return {
      currentPath,
      currentSection,
      breadcrumbs,
      availableNavigation,
      navigationHistory: [...navigationHistory],
      canGoBack: historyIndex > 0,
      canGoForward: historyIndex < navigationHistory.length - 1
    };
  }, [location.pathname, basePath, enableBreadcrumbs, navigationHistory, historyIndex]);

  // Get current section from path
  const getCurrentSection = useCallback((path: string, base: string): string => {
    const relativePath = path.replace(base, '').replace(/^\//, '');
    const segments = relativePath.split('/').filter(Boolean);
    return segments[0] || 'overview';
  }, []);

  // Generate breadcrumbs for a given path
  const generateBreadcrumbsForPath = useCallback((path: string): BreadcrumbItem[] => {
    const breadcrumbs: BreadcrumbItem[] = [];
    const pathSegments = path.split('/').filter(Boolean);
    
    // Always start with root
    breadcrumbs.push({
      id: 'root',
      label: 'Dashboard',
      path: '/',
      isClickable: true,
      isActive: false
    });

    // Add role management root
    breadcrumbs.push({
      id: 'role-management',
      label: 'Role Management',
      path: basePath,
      isClickable: true,
      isActive: false
    });

    // Build breadcrumbs from path segments
    let currentPath = basePath;
    for (let i = 1; i < pathSegments.length; i++) { // Start from 1 to skip 'roles'
      const segment = pathSegments[i];
      currentPath += `/${segment}`;
      
      const navItem = getNavigationItemByPath(currentPath);
      if (navItem) {
        breadcrumbs.push({
          id: navItem.id,
          label: navItem.label,
          path: currentPath,
          isClickable: !navItem.isDisabled,
          isActive: currentPath === path
        });
      } else if (segment !== 'edit' && segment !== 'permissions' && segment !== 'users') {
        // Handle dynamic segments (like IDs)
        const parentPath = currentPath.replace(`/${segment}`, '');
        const parentItem = getNavigationItemByPath(parentPath);
        
        if (parentItem) {
          // Try to get entity name from path or use generic label
          const entityLabel = getEntityLabelFromPath(currentPath, segment);
          breadcrumbs.push({
            id: `${parentItem.id}-${segment}`,
            label: entityLabel,
            path: currentPath,
            isClickable: true,
            isActive: currentPath === path
          });
        }
      }
    }

    return breadcrumbs;
  }, [basePath]);

  // Get entity label from path (e.g., role name, permission name)
  const getEntityLabelFromPath = useCallback((path: string, segment: string): string => {
    // In a real implementation, this would fetch the entity name from an API or store
    // For now, return a formatted version of the segment
    if (path.includes('/roles/') && !path.includes('/permissions/')) {
      return `Role: ${segment.toUpperCase()}`;
    } else if (path.includes('/permissions/')) {
      return `Permission: ${segment.replace(/[._-]/g, ' ').toUpperCase()}`;
    } else if (path.includes('/templates/')) {
      return `Template: ${segment.replace(/[._-]/g, ' ').toUpperCase()}`;
    }
    
    return segment.charAt(0).toUpperCase() + segment.slice(1);
  }, []);

  // Get filtered navigation items based on permissions
  const getFilteredNavigationItems = useCallback((userPermissions?: string[]): NavigationItem[] => {
    if (!userPermissions) {
      return navigationItems; // Return all items if no permissions specified
    }

    return navigationItems.filter(item => {
      if (!item.requiredPermissions || item.requiredPermissions.length === 0) {
        return true; // No permissions required
      }

      return item.requiredPermissions.some(permission => 
        userPermissions.includes(permission)
      );
    }).map(item => ({
      ...item,
      isActive: item.path === location.pathname,
      isDisabled: false // Could add logic for dynamic disabling
    }));
  }, [navigationItems, location.pathname]);

  // Navigate to a path
  const navigateTo = useCallback((path: string, options: { replace?: boolean; state?: any } = {}) => {
    try {
      // Preserve scroll position if enabled
      if (preserveScrollPosition) {
        setScrollPositions(prev => new Map(prev).set(location.pathname, window.scrollY));
      }

      // Add to history if not replacing
      if (!options.replace) {
        setNavigationHistory(prev => {
          const newHistory = prev.slice(0, historyIndex + 1);
          newHistory.push(path);
          
          // Limit history length
          if (newHistory.length > maxHistoryLength) {
            newHistory.shift();
          }
          
          return newHistory;
        });
        setHistoryIndex(prev => Math.min(prev + 1, maxHistoryLength - 1));
      }

      // Navigate
      navigate(path, options);

      // Clear any navigation errors
      setNavigationError(null);

      // Restore scroll position or focus if enabled
      setTimeout(() => {
        if (preserveScrollPosition) {
          const savedPosition = scrollPositions.get(path);
          if (savedPosition !== undefined) {
            window.scrollTo(0, savedPosition);
          }
        }

        if (autoFocusOnNavigation) {
          const mainContent = document.querySelector('[role="main"]') as HTMLElement;
          mainContent?.focus();
        }
      }, 100);
    } catch (error) {
      setNavigationError(error instanceof Error ? error.message : 'Navigation failed');
    }
  }, [
    location.pathname,
    navigate,
    preserveScrollPosition,
    autoFocusOnNavigation,
    historyIndex,
    maxHistoryLength,
    scrollPositions
  ]);

  // Go back in navigation history
  const goBack = useCallback(() => {
    if (historyIndex > 0) {
      const previousPath = navigationHistory[historyIndex - 1];
      setHistoryIndex(prev => prev - 1);
      navigate(previousPath);
    }
  }, [historyIndex, navigationHistory, navigate]);

  // Go forward in navigation history
  const goForward = useCallback(() => {
    if (historyIndex < navigationHistory.length - 1) {
      const nextPath = navigationHistory[historyIndex + 1];
      setHistoryIndex(prev => prev + 1);
      navigate(nextPath);
    }
  }, [historyIndex, navigationHistory, navigate]);

  // Go to specific section
  const goToSection = useCallback((sectionId: string) => {
    const navItem = navigationItems.find(item => item.id === sectionId);
    if (navItem) {
      navigateTo(navItem.path);
    } else {
      setNavigationError(`Section '${sectionId}' not found`);
    }
  }, [navigationItems, navigateTo]);

  // Go to root
  const goToRoot = useCallback(() => {
    navigateTo(basePath);
  }, [basePath, navigateTo]);

  // Generate breadcrumbs for current path
  const generateBreadcrumbs = useCallback((path: string) => {
    return generateBreadcrumbsForPath(path);
  }, [generateBreadcrumbsForPath]);

  // Navigate to breadcrumb
  const navigateToBreadcrumb = useCallback((breadcrumbId: string) => {
    const breadcrumbs = generateBreadcrumbsForPath(location.pathname);
    const breadcrumb = breadcrumbs.find(b => b.id === breadcrumbId);
    
    if (breadcrumb && breadcrumb.isClickable) {
      navigateTo(breadcrumb.path);
    }
  }, [location.pathname, generateBreadcrumbsForPath, navigateTo]);

  // Get navigation items with permission filtering
  const getNavigationItems = useCallback((userPermissions?: string[]) => {
    return getFilteredNavigationItems(userPermissions);
  }, [getFilteredNavigationItems]);

  // Get active navigation item
  const getActiveNavigationItem = useCallback((): NavigationItem | null => {
    return navigationItems.find(item => item.path === location.pathname) || null;
  }, [navigationItems, location.pathname]);

  // Get navigation item by path
  const getNavigationItemByPath = useCallback((path: string): NavigationItem | null => {
    // First try exact match
    let item = navigationItems.find(item => item.path === path);
    
    // If not found, try pattern matching for dynamic routes
    if (!item) {
      item = navigationItems.find(item => {
        if (item.path.includes(':')) {
          const pattern = item.path.replace(/:[\w]+/g, '[^/]+');
          const regex = new RegExp(`^${pattern}$`);
          return regex.test(path);
        }
        return false;
      });
    }
    
    return item || null;
  }, [navigationItems]);

  // Check if current path
  const isCurrentPath = useCallback((path: string): boolean => {
    return location.pathname === path;
  }, [location.pathname]);

  // Check if parent path
  const isParentPath = useCallback((path: string): boolean => {
    return location.pathname.startsWith(path) && location.pathname !== path;
  }, [location.pathname]);

  // Get relative navigation
  const getRelativeNavigation = useCallback((currentPath: string) => {
    const currentItem = getNavigationItemByPath(currentPath);
    if (!currentItem) {
      return { siblings: [], children: [] };
    }

    const siblings = navigationItems.filter(item => 
      item.parentId === currentItem.parentId && item.id !== currentItem.id
    );

    const children = navigationItems.filter(item => 
      item.parentId === currentItem.id
    );

    const parent = currentItem.parentId ? 
      navigationItems.find(item => item.id === currentItem.parentId) : 
      undefined;

    const currentIndex = siblings.findIndex(item => item.id === currentItem.id);
    const previous = currentIndex > 0 ? siblings[currentIndex - 1] : undefined;
    const next = currentIndex < siblings.length - 1 ? siblings[currentIndex + 1] : undefined;

    return { previous, next, siblings, parent, children };
  }, [navigationItems, getNavigationItemByPath]);

  // Clear navigation history
  const clearHistory = useCallback(() => {
    setNavigationHistory([]);
    setHistoryIndex(-1);
  }, []);

  // Get navigation history
  const getNavigationHistory = useCallback(() => {
    return [...navigationHistory];
  }, [navigationHistory]);

  // Clear navigation error
  const clearNavigationError = useCallback(() => {
    setNavigationError(null);
  }, []);

  // Keyboard navigation effect
  useEffect(() => {
    if (!keyboardNavigationEnabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Alt + Left Arrow: Go back
      if (event.altKey && event.key === 'ArrowLeft') {
        event.preventDefault();
        goBack();
      }
      
      // Alt + Right Arrow: Go forward
      else if (event.altKey && event.key === 'ArrowRight') {
        event.preventDefault();
        goForward();
      }
      
      // Alt + Home: Go to root
      else if (event.altKey && event.key === 'Home') {
        event.preventDefault();
        goToRoot();
      }
      
      // Alt + U: Go up one level (to parent)
      else if (event.altKey && event.key === 'u') {
        event.preventDefault();
        const currentItem = getActiveNavigationItem();
        if (currentItem?.parentId) {
          goToSection(currentItem.parentId);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    keyboardNavigationEnabled,
    goBack,
    goForward,
    goToRoot,
    getActiveNavigationItem,
    goToSection
  ]);

  // Initialize history with current path
  useEffect(() => {
    if (navigationHistory.length === 0) {
      setNavigationHistory([location.pathname]);
      setHistoryIndex(0);
    }
  }, [location.pathname, navigationHistory.length]);

  return {
    navigationState,
    navigateTo,
    goBack,
    goForward,
    goToSection,
    goToRoot,
    generateBreadcrumbs,
    navigateToBreadcrumb,
    getNavigationItems,
    getActiveNavigationItem,
    getNavigationItemByPath,
    isCurrentPath,
    isParentPath,
    getRelativeNavigation,
    clearHistory,
    getNavigationHistory,
    enableKeyboardNavigation: keyboardNavigationEnabled,
    setEnableKeyboardNavigation: setKeyboardNavigationEnabled,
    navigationError,
    clearNavigationError
  };
}
