// API scope interceptor: appends org scope to every request
// Convention: send X-Org-Unit-Ids header (comma-separated) and/or orgUnitIds[]= query params
import { apiClient } from '../api/client'
import { useOrgScope } from '../contexts/OrgScopeContext'

// Hook returns a scoped axios instance facade
export function useScopedApi() {
  const { allowedOrgUnitIds } = useOrgScope()

  function withScopeParams(params?: Record<string, any>) {
    return {
      ...(params || {}),
      orgUnitIds: allowedOrgUnitIds
    }
  }

  function withScopeHeaders(headers?: Record<string, any>) {
    return {
      ...(headers || {}),
      'X-Org-Unit-Ids': allowedOrgUnitIds.join(',')
    }
  }

  return {
    get: (url: string, config?: any) => apiClient.get(url, { ...(config || {}), params: withScopeParams(config?.params), headers: withScopeHeaders(config?.headers) }),
    post: (url: string, data?: any, config?: any) => apiClient.post(url, data, { ...(config || {}), params: withScopeParams(config?.params), headers: withScopeHeaders(config?.headers) }),
    put: (url: string, data?: any, config?: any) => apiClient.put(url, data, { ...(config || {}), params: withScopeParams(config?.params), headers: withScopeHeaders(config?.headers) }),
    delete: (url: string, config?: any) => apiClient.delete(url, { ...(config || {}), params: withScopeParams(config?.params), headers: withScopeHeaders(config?.headers) }),
  }
}

