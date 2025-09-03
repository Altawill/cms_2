import React, { useState } from 'react';
import { ChevronDownIcon, BuildingOfficeIcon, GlobeAltIcon, ClipboardDocumentListIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { useOrganization } from '../../contexts/OrganizationContext';
import { useTranslation } from 'react-i18next';
import type { OrgSwitcherProps, OrgUnit } from '../../types/organization';
import { ORG_UNIT_TYPES } from '../../types/organization';

export const OrgSwitcher: React.FC<OrgSwitcherProps> = ({
  currentScope,
  onScopeChange,
  availableScopes,
  showBreadcrumb = true,
  compact = false
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const { getScopeAncestors } = useOrganization();

  // Get icon for org unit type
  const getOrgIcon = (type: string) => {
    switch (type) {
      case 'PMO':
        return <BuildingOfficeIcon className="h-4 w-4" />;
      case 'AREA':
        return <GlobeAltIcon className="h-4 w-4" />;
      case 'PROJECT':
        return <ClipboardDocumentListIcon className="h-4 w-4" />;
      case 'ZONE':
        return <MapPinIcon className="h-4 w-4" />;
      default:
        return <BuildingOfficeIcon className="h-4 w-4" />;
    }
  };

  // Get color class for org unit type
  const getOrgColor = (type: string) => {
    const colors = {
      PMO: 'text-purple-600 bg-purple-50 border-purple-200',
      AREA: 'text-blue-600 bg-blue-50 border-blue-200',
      PROJECT: 'text-green-600 bg-green-50 border-green-200',
      ZONE: 'text-orange-600 bg-orange-50 border-orange-200'
    };
    return colors[type as keyof typeof colors] || colors.PMO;
  };

  // Find current scope details
  const currentScopeUnit = availableScopes.find(scope => scope.id === currentScope);
  const breadcrumbPath = currentScope ? getScopeAncestors(currentScope).concat([currentScopeUnit].filter(Boolean)) : [];

  const handleScopeSelect = (scopeId: string) => {
    onScopeChange(scopeId);
    setIsOpen(false);
  };

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm leading-4 font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {currentScopeUnit && getOrgIcon(currentScopeUnit.type)}
          <span className="ml-2">{currentScopeUnit?.name || t('selectScope')}</span>
          <ChevronDownIcon className="ml-2 h-4 w-4" />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
            <div className="py-1">
              {availableScopes.map((scope) => (
                <button
                  key={scope.id}
                  onClick={() => handleScopeSelect(scope.id)}
                  className={`flex items-center px-4 py-2 text-sm w-full text-left hover:bg-gray-100 ${
                    currentScope === scope.id ? 'bg-indigo-50 text-indigo-900' : 'text-gray-900'
                  }`}
                >
                  {getOrgIcon(scope.type)}
                  <div className="ml-3">
                    <div className="font-medium">{scope.name}</div>
                    {scope.code && <div className="text-xs text-gray-500">{scope.code}</div>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          {/* Breadcrumb */}
          {showBreadcrumb && breadcrumbPath.length > 0 && (
            <nav className="flex items-center space-x-2 text-sm">
              <span className="text-gray-500">{t('scope')}:</span>
              {breadcrumbPath.map((unit, index) => (
                <React.Fragment key={unit?.id}>
                  {index > 0 && <span className="text-gray-400">/</span>}
                  <button
                    onClick={() => unit && handleScopeSelect(unit.id)}
                    className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${
                      unit?.id === currentScope
                        ? getOrgColor(unit.type)
                        : 'text-gray-600 bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {unit && getOrgIcon(unit.type)}
                    <span className="ml-1">{unit?.name}</span>
                  </button>
                </React.Fragment>
              ))}
            </nav>
          )}

          {/* Scope Selector */}
          <div className="relative">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {currentScopeUnit && getOrgIcon(currentScopeUnit.type)}
              <span className="ml-2">
                {currentScopeUnit ? 
                  `${t(currentScopeUnit.type.toLowerCase())} - ${currentScopeUnit.name}` : 
                  t('selectScope')
                }
              </span>
              <ChevronDownIcon className="ml-2 h-4 w-4" />
            </button>

            {isOpen && (
              <div className="absolute right-0 mt-2 w-72 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                <div className="py-1 max-h-64 overflow-y-auto">
                  <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-100">
                    {t('availableScopes')}
                  </div>
                  {availableScopes.map((scope) => (
                    <button
                      key={scope.id}
                      onClick={() => handleScopeSelect(scope.id)}
                      className={`flex items-center px-4 py-3 text-sm w-full text-left hover:bg-gray-50 ${
                        currentScope === scope.id ? 'bg-indigo-50 text-indigo-900' : 'text-gray-900'
                      }`}
                    >
                      <div className={`p-2 rounded-md ${getOrgColor(scope.type)} mr-3`}>
                        {getOrgIcon(scope.type)}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{scope.name}</div>
                        <div className="text-xs text-gray-500">
                          {t(scope.type.toLowerCase())}
                          {scope.code && ` • ${scope.code}`}
                          {scope.region && ` • ${scope.region}`}
                        </div>
                      </div>
                      {currentScope === scope.id && (
                        <div className="w-2 h-2 bg-indigo-600 rounded-full ml-2" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Click outside to close */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

// Context chips component for showing active scope
export const ScopeChip: React.FC<{
  scope: OrgUnit;
  onRemove?: () => void;
  variant?: 'default' | 'outline' | 'secondary';
}> = ({ scope, onRemove, variant = 'default' }) => {
  const { t } = useTranslation();

  const getOrgIcon = (type: string) => {
    switch (type) {
      case 'PMO':
        return <BuildingOfficeIcon className="h-3 w-3" />;
      case 'AREA':
        return <GlobeAltIcon className="h-3 w-3" />;
      case 'PROJECT':
        return <ClipboardDocumentListIcon className="h-3 w-3" />;
      case 'ZONE':
        return <MapPinIcon className="h-3 w-3" />;
      default:
        return <BuildingOfficeIcon className="h-3 w-3" />;
    }
  };

  const baseClasses = "inline-flex items-center px-2 py-1 rounded-md text-xs font-medium";
  const variantClasses = {
    default: "bg-indigo-100 text-indigo-800 border border-indigo-200",
    outline: "bg-white text-gray-700 border border-gray-300",
    secondary: "bg-gray-100 text-gray-700 border border-gray-200"
  };

  return (
    <span className={`${baseClasses} ${variantClasses[variant]}`}>
      {getOrgIcon(scope.type)}
      <span className="ml-1">{scope.name}</span>
      {scope.code && <span className="ml-1 text-gray-500">({scope.code})</span>}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 inline-flex items-center justify-center w-4 h-4 text-gray-400 hover:text-gray-600"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  );
};
