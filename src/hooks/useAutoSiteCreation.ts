import { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  normalizeSiteCode, 
  suggestSiteCode, 
  validateSiteCode, 
  checkSiteCodeConflicts,
  COMMON_SUFFIXES 
} from '../utils/siteCodeUtils';

export interface SiteTemplate {
  id: string;
  name: string;
  description: string;
  type: 'residential' | 'commercial' | 'infrastructure' | 'industrial' | 'mixed';
  defaultValues: {
    estimatedDuration?: number; // in days
    estimatedBudget?: number;
    defaultEquipment?: string[];
    defaultRoles?: string[];
    requiredDocuments?: string[];
    milestoneTemplates?: Array<{
      name: string;
      description: string;
      estimatedDays: number;
      dependencies?: string[];
    }>;
  };
  autoPopulateFields: string[];
}

export interface AutoSiteData {
  code: string;
  name: string;
  location: string;
  type: 'residential' | 'commercial' | 'infrastructure' | 'industrial' | 'mixed';
  startDate: string;
  estimatedEndDate: string;
  estimatedBudget: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  manager: string;
  client: string;
  status: 'planning' | 'approved' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  equipment: string[];
  roles: string[];
  milestones: Array<{
    id: string;
    name: string;
    description: string;
    startDate: string;
    endDate: string;
    status: 'pending' | 'in_progress' | 'completed' | 'delayed';
  }>;
  documents: Array<{
    id: string;
    name: string;
    type: string;
    required: boolean;
    status: 'pending' | 'uploaded' | 'approved' | 'rejected';
  }>;
}

export interface UseAutoSiteCreationOptions {
  templates?: SiteTemplate[];
  existingSites?: Array<{ id: string; code: string; name: string }>;
  defaultManagers?: string[];
  availableEquipment?: string[];
  availableRoles?: string[];
  enableSmartDefaults?: boolean;
  autoGenerateCodes?: boolean;
  validateOnChange?: boolean;
}

export interface UseAutoSiteCreationReturn {
  // Form data
  siteData: Partial<AutoSiteData>;
  setSiteData: (data: Partial<AutoSiteData>) => void;
  updateField: (field: keyof AutoSiteData, value: any) => void;
  
  // Templates
  templates: SiteTemplate[];
  selectedTemplate: SiteTemplate | null;
  applyTemplate: (templateId: string) => void;
  
  // Smart defaults
  generateSmartDefaults: () => void;
  suggestedCodes: string[];
  regenerateSuggestedCodes: () => void;
  
  // Validation
  validation: {
    isValid: boolean;
    errors: Record<string, string[]>;
    warnings: Record<string, string[]>;
  };
  validateForm: () => boolean;
  
  // Auto-population
  autoPopulate: {
    fromLocation: (location: string) => void;
    fromClient: (client: string) => void;
    fromBudget: (budget: number) => void;
    fromStartDate: (date: string) => void;
  };
  
  // Site creation
  isCreating: boolean;
  createSite: () => Promise<{ success: boolean; siteId?: string; error?: string }>;
  
  // Utils
  reset: () => void;
  isDirty: boolean;
  canCreate: boolean;
}

const DEFAULT_TEMPLATES: SiteTemplate[] = [
  {
    id: 'residential-house',
    name: 'Single Family House',
    description: 'Standard residential house construction',
    type: 'residential',
    defaultValues: {
      estimatedDuration: 180,
      estimatedBudget: 250000,
      defaultEquipment: ['excavator', 'concrete-mixer', 'crane', 'scaffolding'],
      defaultRoles: ['site-manager', 'foreman', 'electrician', 'plumber', 'carpenter'],
      requiredDocuments: ['building-permit', 'architectural-plans', 'structural-drawings'],
      milestoneTemplates: [
        { name: 'Foundation', description: 'Foundation and basement work', estimatedDays: 30 },
        { name: 'Framing', description: 'Structural framing', estimatedDays: 21, dependencies: ['Foundation'] },
        { name: 'Roofing', description: 'Roof installation', estimatedDays: 14, dependencies: ['Framing'] },
        { name: 'Utilities', description: 'Electrical and plumbing rough-in', estimatedDays: 28, dependencies: ['Framing'] },
        { name: 'Insulation', description: 'Insulation and drywall', estimatedDays: 21, dependencies: ['Utilities'] },
        { name: 'Flooring', description: 'Floor installation', estimatedDays: 14, dependencies: ['Insulation'] },
        { name: 'Final', description: 'Final inspections and cleanup', estimatedDays: 7, dependencies: ['Flooring'] }
      ]
    },
    autoPopulateFields: ['estimatedEndDate', 'milestones', 'equipment', 'roles', 'documents']
  },
  {
    id: 'commercial-office',
    name: 'Office Building',
    description: 'Multi-story commercial office building',
    type: 'commercial',
    defaultValues: {
      estimatedDuration: 365,
      estimatedBudget: 2000000,
      defaultEquipment: ['tower-crane', 'concrete-pump', 'scaffolding', 'lift-equipment'],
      defaultRoles: ['project-manager', 'site-supervisor', 'safety-officer', 'quality-inspector'],
      requiredDocuments: ['commercial-permit', 'fire-safety-plan', 'architectural-drawings', 'mep-drawings'],
      milestoneTemplates: [
        { name: 'Site Prep', description: 'Site preparation and excavation', estimatedDays: 45 },
        { name: 'Foundation', description: 'Foundation and underground work', estimatedDays: 60, dependencies: ['Site Prep'] },
        { name: 'Structure', description: 'Structural framework', estimatedDays: 120, dependencies: ['Foundation'] },
        { name: 'Envelope', description: 'Building envelope and facade', estimatedDays: 90, dependencies: ['Structure'] },
        { name: 'MEP', description: 'Mechanical, electrical, plumbing', estimatedDays: 75, dependencies: ['Structure'] },
        { name: 'Interiors', description: 'Interior fit-out and finishes', estimatedDays: 60, dependencies: ['MEP', 'Envelope'] },
        { name: 'Final', description: 'Final inspections and commissioning', estimatedDays: 30, dependencies: ['Interiors'] }
      ]
    },
    autoPopulateFields: ['estimatedEndDate', 'milestones', 'equipment', 'roles', 'documents']
  },
  {
    id: 'infrastructure-road',
    name: 'Road Construction',
    description: 'Highway or major road construction project',
    type: 'infrastructure',
    defaultValues: {
      estimatedDuration: 240,
      estimatedBudget: 5000000,
      defaultEquipment: ['bulldozer', 'grader', 'roller', 'asphalt-paver', 'dump-truck'],
      defaultRoles: ['project-engineer', 'survey-crew', 'equipment-operator', 'flagman'],
      requiredDocuments: ['environmental-assessment', 'traffic-management-plan', 'survey-data'],
      milestoneTemplates: [
        { name: 'Survey', description: 'Land surveying and marking', estimatedDays: 21 },
        { name: 'Clearing', description: 'Land clearing and preparation', estimatedDays: 30, dependencies: ['Survey'] },
        { name: 'Earthwork', description: 'Cut and fill operations', estimatedDays: 60, dependencies: ['Clearing'] },
        { name: 'Drainage', description: 'Drainage system installation', estimatedDays: 45, dependencies: ['Earthwork'] },
        { name: 'Base Course', description: 'Base course preparation', estimatedDays: 30, dependencies: ['Drainage'] },
        { name: 'Paving', description: 'Asphalt paving', estimatedDays: 21, dependencies: ['Base Course'] },
        { name: 'Striping', description: 'Line striping and signage', estimatedDays: 7, dependencies: ['Paving'] }
      ]
    },
    autoPopulateFields: ['estimatedEndDate', 'milestones', 'equipment', 'roles', 'documents']
  }
];

export function useAutoSiteCreation(options: UseAutoSiteCreationOptions = {}): UseAutoSiteCreationReturn {
  const {
    templates = DEFAULT_TEMPLATES,
    existingSites = [],
    defaultManagers = [],
    availableEquipment = [],
    availableRoles = [],
    enableSmartDefaults = true,
    autoGenerateCodes = true,
    validateOnChange = true
  } = options;

  const [siteData, setSiteDataState] = useState<Partial<AutoSiteData>>({
    type: 'residential',
    priority: 'medium',
    status: 'planning',
    startDate: new Date().toISOString().split('T')[0],
    equipment: [],
    roles: [],
    milestones: [],
    documents: []
  });

  const [selectedTemplate, setSelectedTemplate] = useState<SiteTemplate | null>(null);
  const [suggestedCodes, setSuggestedCodes] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [initialData, setInitialData] = useState<Partial<AutoSiteData>>({});
  const [validation, setValidation] = useState({
    isValid: true,
    errors: {} as Record<string, string[]>,
    warnings: {} as Record<string, string[]>
  });

  // Track if form is dirty
  const isDirty = useMemo(() => {
    return JSON.stringify(siteData) !== JSON.stringify(initialData);
  }, [siteData, initialData]);

  // Check if site can be created
  const canCreate = useMemo(() => {
    return validation.isValid && 
           siteData.name && 
           siteData.code && 
           siteData.location && 
           siteData.manager;
  }, [validation.isValid, siteData]);

  // Generate suggested codes based on current site data
  const regenerateSuggestedCodes = useCallback(() => {
    if (siteData.name) {
      const suggestions = suggestSiteCode({
        name: siteData.name,
        location: siteData.location,
        type: siteData.type,
        startDate: siteData.startDate
      });
      
      // Filter out existing codes
      const availableSuggestions = suggestions.filter(code => {
        const conflicts = checkSiteCodeConflicts(code, existingSites);
        return !conflicts.hasConflict;
      });
      
      setSuggestedCodes(availableSuggestions);
    }
  }, [siteData.name, siteData.location, siteData.type, siteData.startDate, existingSites]);

  // Update site data
  const setSiteData = useCallback((newData: Partial<AutoSiteData>) => {
    setSiteDataState(prev => {
      const updated = { ...prev, ...newData };
      
      // Auto-generate code if enabled and name is provided
      if (autoGenerateCodes && newData.name && !updated.code) {
        const suggestions = suggestSiteCode({
          name: newData.name,
          location: updated.location,
          type: updated.type,
          startDate: updated.startDate
        });
        if (suggestions.length > 0) {
          updated.code = suggestions[0];
        }
      }
      
      return updated;
    });
  }, [autoGenerateCodes]);

  // Update single field
  const updateField = useCallback((field: keyof AutoSiteData, value: any) => {
    setSiteData({ [field]: value });
  }, [setSiteData]);

  // Apply template
  const applyTemplate = useCallback((templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;

    setSelectedTemplate(template);
    
    const templateData: Partial<AutoSiteData> = {
      type: template.type,
      estimatedBudget: template.defaultValues.estimatedBudget,
      equipment: [...(template.defaultValues.defaultEquipment || [])],
      roles: [...(template.defaultValues.defaultRoles || [])]
    };

    // Auto-calculate end date if duration is provided
    if (template.defaultValues.estimatedDuration && siteData.startDate) {
      const startDate = new Date(siteData.startDate);
      const endDate = new Date(startDate.getTime() + template.defaultValues.estimatedDuration * 24 * 60 * 60 * 1000);
      templateData.estimatedEndDate = endDate.toISOString().split('T')[0];
    }

    // Generate milestones from template
    if (template.defaultValues.milestoneTemplates) {
      const startDate = new Date(siteData.startDate || Date.now());
      let currentDate = new Date(startDate);
      
      templateData.milestones = template.defaultValues.milestoneTemplates.map((milestone, index) => {
        const milestoneStart = new Date(currentDate);
        const milestoneEnd = new Date(currentDate.getTime() + milestone.estimatedDays * 24 * 60 * 60 * 1000);
        currentDate = new Date(milestoneEnd.getTime() + 24 * 60 * 60 * 1000); // Next day after milestone ends
        
        return {
          id: `milestone-${index + 1}`,
          name: milestone.name,
          description: milestone.description,
          startDate: milestoneStart.toISOString().split('T')[0],
          endDate: milestoneEnd.toISOString().split('T')[0],
          status: 'pending' as const
        };
      });
    }

    // Generate required documents
    if (template.defaultValues.requiredDocuments) {
      templateData.documents = template.defaultValues.requiredDocuments.map((docName, index) => ({
        id: `doc-${index + 1}`,
        name: docName.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        type: docName,
        required: true,
        status: 'pending' as const
      }));
    }

    setSiteData(templateData);
  }, [templates, siteData.startDate, setSiteData]);

  // Generate smart defaults based on current data
  const generateSmartDefaults = useCallback(() => {
    if (!enableSmartDefaults) return;

    const updates: Partial<AutoSiteData> = {};

    // Smart manager assignment
    if (!siteData.manager && defaultManagers.length > 0) {
      // Simple round-robin assignment or least loaded manager
      updates.manager = defaultManagers[0];
    }

    // Smart budget estimation based on type and size
    if (!siteData.estimatedBudget && siteData.type) {
      const budgetEstimates = {
        residential: 200000,
        commercial: 1500000,
        infrastructure: 3000000,
        industrial: 2000000,
        mixed: 1000000
      };
      updates.estimatedBudget = budgetEstimates[siteData.type];
    }

    // Smart priority based on budget and client
    if (!siteData.priority && siteData.estimatedBudget) {
      if (siteData.estimatedBudget > 5000000) {
        updates.priority = 'critical';
      } else if (siteData.estimatedBudget > 1000000) {
        updates.priority = 'high';
      } else if (siteData.estimatedBudget > 500000) {
        updates.priority = 'medium';
      } else {
        updates.priority = 'low';
      }
    }

    // Smart description generation
    if (!siteData.description && siteData.name && siteData.location && siteData.type) {
      updates.description = `${siteData.type.charAt(0).toUpperCase() + siteData.type.slice(1)} construction project for ${siteData.name} located in ${siteData.location}.`;
    }

    // Smart end date calculation
    if (!siteData.estimatedEndDate && siteData.startDate && siteData.type) {
      const durationDays = {
        residential: 180,
        commercial: 365,
        infrastructure: 240,
        industrial: 300,
        mixed: 270
      };
      
      const startDate = new Date(siteData.startDate);
      const endDate = new Date(startDate.getTime() + durationDays[siteData.type] * 24 * 60 * 60 * 1000);
      updates.estimatedEndDate = endDate.toISOString().split('T')[0];
    }

    if (Object.keys(updates).length > 0) {
      setSiteData(updates);
    }
  }, [
    enableSmartDefaults,
    siteData,
    defaultManagers,
    setSiteData
  ]);

  // Auto-population functions
  const autoPopulate = {
    fromLocation: useCallback((location: string) => {
      const updates: Partial<AutoSiteData> = { location };
      
      // Try to infer type from location keywords
      const locationLower = location.toLowerCase();
      if (locationLower.includes('residential') || locationLower.includes('house') || locationLower.includes('home')) {
        updates.type = 'residential';
      } else if (locationLower.includes('commercial') || locationLower.includes('office') || locationLower.includes('retail')) {
        updates.type = 'commercial';
      } else if (locationLower.includes('highway') || locationLower.includes('road') || locationLower.includes('bridge')) {
        updates.type = 'infrastructure';
      } else if (locationLower.includes('factory') || locationLower.includes('plant') || locationLower.includes('warehouse')) {
        updates.type = 'industrial';
      }

      setSiteData(updates);
      regenerateSuggestedCodes();
    }, [setSiteData, regenerateSuggestedCodes]),

    fromClient: useCallback((client: string) => {
      const updates: Partial<AutoSiteData> = { client };
      
      // Assign manager based on client if not set
      if (!siteData.manager && defaultManagers.length > 0) {
        // Could implement client-manager mapping logic here
        updates.manager = defaultManagers[0];
      }

      setSiteData(updates);
    }, [siteData.manager, defaultManagers, setSiteData]),

    fromBudget: useCallback((budget: number) => {
      const updates: Partial<AutoSiteData> = { estimatedBudget: budget };
      
      // Adjust priority based on budget
      if (budget > 5000000) {
        updates.priority = 'critical';
      } else if (budget > 1000000) {
        updates.priority = 'high';
      } else if (budget > 500000) {
        updates.priority = 'medium';
      } else {
        updates.priority = 'low';
      }

      setSiteData(updates);
    }, [setSiteData]),

    fromStartDate: useCallback((date: string) => {
      const updates: Partial<AutoSiteData> = { startDate: date };
      
      // Recalculate end date if we have duration info
      if (siteData.type) {
        const durationDays = {
          residential: 180,
          commercial: 365,
          infrastructure: 240,
          industrial: 300,
          mixed: 270
        };
        
        const startDate = new Date(date);
        const endDate = new Date(startDate.getTime() + durationDays[siteData.type] * 24 * 60 * 60 * 1000);
        updates.estimatedEndDate = endDate.toISOString().split('T')[0];
      }

      setSiteData(updates);
      regenerateSuggestedCodes();
    }, [siteData.type, setSiteData, regenerateSuggestedCodes])
  };

  // Validation
  const validateForm = useCallback(() => {
    const errors: Record<string, string[]> = {};
    const warnings: Record<string, string[]> = {};

    // Required field validation
    if (!siteData.name?.trim()) {
      errors.name = ['Site name is required'];
    }

    if (!siteData.code?.trim()) {
      errors.code = ['Site code is required'];
    } else {
      const codeValidation = validateSiteCode(siteData.code, {
        existingCodes: existingSites.map(s => s.code)
      });
      
      if (!codeValidation.isValid) {
        errors.code = codeValidation.errors;
      }
      
      if (codeValidation.warnings.length > 0) {
        warnings.code = codeValidation.warnings;
      }
    }

    if (!siteData.location?.trim()) {
      errors.location = ['Location is required'];
    }

    if (!siteData.manager?.trim()) {
      errors.manager = ['Site manager is required'];
    }

    if (!siteData.startDate) {
      errors.startDate = ['Start date is required'];
    } else {
      const startDate = new Date(siteData.startDate);
      if (startDate < new Date()) {
        warnings.startDate = ['Start date is in the past'];
      }
    }

    if (siteData.estimatedEndDate && siteData.startDate) {
      const startDate = new Date(siteData.startDate);
      const endDate = new Date(siteData.estimatedEndDate);
      
      if (endDate <= startDate) {
        errors.estimatedEndDate = ['End date must be after start date'];
      }
    }

    if (siteData.estimatedBudget && siteData.estimatedBudget <= 0) {
      errors.estimatedBudget = ['Budget must be greater than zero'];
    }

    // Business logic warnings
    if (siteData.estimatedBudget && siteData.estimatedBudget > 10000000) {
      warnings.estimatedBudget = ['Large budget project may require additional approvals'];
    }

    if (siteData.milestones && siteData.milestones.length === 0 && siteData.type !== 'mixed') {
      warnings.milestones = ['Consider adding project milestones for better tracking'];
    }

    const newValidation = {
      isValid: Object.keys(errors).length === 0,
      errors,
      warnings
    };

    setValidation(newValidation);
    return newValidation.isValid;
  }, [siteData, existingSites]);

  // Create site
  const createSite = useCallback(async (): Promise<{ success: boolean; siteId?: string; error?: string }> => {
    if (!validateForm()) {
      return { success: false, error: 'Form validation failed' };
    }

    setIsCreating(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const siteId = `site-${Date.now()}`;
      
      // In real implementation, this would make an API call
      console.log('Creating site:', { ...siteData, id: siteId });
      
      return { success: true, siteId };
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create site' 
      };
    } finally {
      setIsCreating(false);
    }
  }, [validateForm, siteData]);

  // Reset form
  const reset = useCallback(() => {
    const resetData = {
      type: 'residential' as const,
      priority: 'medium' as const,
      status: 'planning' as const,
      startDate: new Date().toISOString().split('T')[0],
      equipment: [],
      roles: [],
      milestones: [],
      documents: []
    };
    setSiteDataState(resetData);
    setInitialData(resetData);
    setSelectedTemplate(null);
    setSuggestedCodes([]);
    setValidation({
      isValid: true,
      errors: {},
      warnings: {}
    });
  }, []);

  // Initialize
  useEffect(() => {
    setInitialData({ ...siteData });
    if (autoGenerateCodes) {
      regenerateSuggestedCodes();
    }
  }, []); // Only run once on mount

  // Auto-validate on change
  useEffect(() => {
    if (validateOnChange) {
      validateForm();
    }
  }, [siteData, validateOnChange, validateForm]);

  // Auto-generate smart defaults when type changes
  useEffect(() => {
    if (enableSmartDefaults && siteData.type) {
      generateSmartDefaults();
    }
  }, [siteData.type]); // Only when type changes

  return {
    siteData,
    setSiteData,
    updateField,
    templates,
    selectedTemplate,
    applyTemplate,
    generateSmartDefaults,
    suggestedCodes,
    regenerateSuggestedCodes,
    validation,
    validateForm,
    autoPopulate,
    isCreating,
    createSite,
    reset,
    isDirty,
    canCreate
  };
}
