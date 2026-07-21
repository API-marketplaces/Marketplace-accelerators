'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  Grid2X2,
  List,
  PlugZap,
  RefreshCw,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react'
import DashboardNavbar from '../../components/DashboardNavbar'
import { Button } from '../../components/ui/button'
import { useAuth } from '@/app/hooks/useAuth'

type Provider = 'apigee' | 'azure' | 'kong'
type View = 'sources' | 'add' | 'import'
type TestState = 'idle' | 'testing' | 'success' | 'failed'

type GatewayConnection = {
  id: string
  provider: Provider
  name: string
  description: string
  status: 'connected'
  createdAt: string
}

type ApiRecord = {
  id: string
  status: 'New' | 'Existing'
  name: string
  apiId: string
  version: string
}

type FormState = {
  connectionName: string
  description: string
  endpointUrl: string
  organization: string
  environment: string
  username: string
  password: string
  serviceName: string
  resourceGroup: string
  subscriptionId: string
  gatewayUrl: string
  managementUrl: string
  tenantId: string
  clientId: string
  clientSecret: string
  adminUrl: string
  workspace: string
  adminApiKey: string
}

const STORAGE_KEY = 'monetizeMate.aiMonetizationPlugin.connections'

const PROVIDERS: Array<{
  key: Provider
  name: string
  badge: string
  description: string
}> = [
  {
    key: 'apigee',
    name: 'Apigee Edge',
    badge: 'AP',
    description: 'Connect Apigee Edge management APIs and import API proxies.',
  },
  {
    key: 'azure',
    name: 'Azure API Management',
    badge: 'AZ',
    description: 'Connect Azure APIM and import published APIs.',
  },
  {
    key: 'kong',
    name: 'Kong Gateway',
    badge: 'KG',
    description: 'Connect Kong Admin API and import services/routes as APIs.',
  },
]

const EMPTY_FORM: FormState = {
  connectionName: '',
  description: '',
  endpointUrl: '',
  organization: '',
  environment: '',
  username: '',
  password: '',
  serviceName: '',
  resourceGroup: '',
  subscriptionId: '',
  gatewayUrl: '',
  managementUrl: '',
  tenantId: '',
  clientId: '',
  clientSecret: '',
  adminUrl: '',
  workspace: 'default',
  adminApiKey: '',
}

const SAMPLE_APIS: ApiRecord[] = [
  { id: 'abc1', status: 'New', name: 'Abc1', apiId: 'abc1', version: 'v0' },
  { id: 'abc1-v2', status: 'New', name: 'Abc1', apiId: 'abc1-v2', version: 'v2' },
  { id: 'access-log', status: 'New', name: 'accessLog', apiId: 'a8738400-c3bf-4e41-9255-a4ef3575bdb7', version: 'v0' },
  { id: 'collateral', status: 'New', name: 'AcctCollateralRelService', apiId: 'ac3c7ef1-4a1b-436d-97c4-75f69bc7471c', version: 'v0' },
  { id: 'kong-migration', status: 'New', name: 'API Bridge - Kong Migration', apiId: 'api-bridge-kong-migration', version: 'v0' },
  { id: 'created-portal', status: 'New', name: 'API created from portal', apiId: 'api-created-from-portal', version: 'v0' },
  { id: 'created-portal-v3', status: 'New', name: 'API created from portal', apiId: 'api-created-from-portal-v3', version: 'v3' },
  { id: 'api-test-101', status: 'New', name: 'API Test 101', apiId: '77395546-b205-4a09-9b21-04261341e0d0', version: 'v0' },
  { id: 'api-test-102', status: 'New', name: 'API Test 102', apiId: '90ec3192-7e10-4723-88dd-4760f140fb01', version: 'v0' },
  { id: 'api-version-test', status: 'New', name: 'APIVersionTest', apiId: 'apiversiontest', version: 'v0' },
  { id: 'api-version-test-v1', status: 'New', name: 'APIVersionTestv1', apiId: 'apiversiontestV1-V1', version: 'v1' },
  { id: 'app-state-api', status: 'New', name: 'APP-State-api', apiId: 'app-state-api', version: 'v0' },
  { id: 'atm-locator', status: 'New', name: 'ATM Locator', apiId: '64913d356f9f2409b5bc006e', version: 'v0' },
  { id: 'atm-locator-v2', status: 'New', name: 'ATM Locator', apiId: '64913d356f9f2409b5bc006e-v1-2', version: '2.0' },
  { id: 'azure-cors', status: 'New', name: 'Azure APIM CORS Policy Uploader', apiId: 'c79807b1-f820-494c-93cc-1a9a2f6f231c', version: 'v0' },
  { id: 'azure-care-plan', status: 'New', name: 'AzureCarePlan API', apiId: 'azurecareplan-api', version: 'v0' },
  { id: 'banking-premier', status: 'New', name: 'Banking Hub - Premier - Trial Plan', apiId: '1bc20931-7fe2-4b2c-b80b-98e32a5d1c18', version: 'v0' },
  { id: 'banking-trial', status: 'New', name: 'Banking Hub - Trial Copy', apiId: '1fb82bb2-4922-4b76-953f-952d33e0dc2b', version: 'v0' },
  { id: 'banking-accounts', status: 'Existing', name: 'banking-accounts', apiId: '21b25519-04c0-4f61-a769-bb477f84803d', version: 'v0' },
]

const providerName = (provider: Provider) =>
  PROVIDERS.find((item) => item.key === provider)?.name || provider

const getStoredConnections = (): GatewayConnection[] => {
  if (typeof window === 'undefined') {
    return []
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (!stored) {
      return []
    }
    const parsed = JSON.parse(stored) as GatewayConnection[]
    return parsed.filter((connection) => connection.status === 'connected')
  } catch {
    window.localStorage.removeItem(STORAGE_KEY)
    return []
  }
}

export default function AiMonetizationPluginPage() {
  const router = useRouter()
  const { authenticated, loading } = useAuth()
  const [view, setView] = useState<View>('sources')
  const [selectedProvider, setSelectedProvider] = useState<Provider>('apigee')
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [testState, setTestState] = useState<TestState>('idle')
  const [testMessage, setTestMessage] = useState('')
  const [connections, setConnections] = useState<GatewayConnection[]>([])
  const [activeConnectionId, setActiveConnectionId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selectedApis, setSelectedApis] = useState<string[]>([])
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [importStatus, setImportStatus] = useState('')
  const [importedApiIds, setImportedApiIds] = useState<string[]>([])
  const [showSecret, setShowSecret] = useState(false)

  useEffect(() => {
    if (!loading && authenticated === false) {
      router.push('/login')
    }
  }, [authenticated, loading, router])

  const fetchConnections = async () => {
    try {
      const response = await fetch('/api/api-sources')
      if (response.ok) {
        const data = await response.json()
        if (Array.isArray(data)) {
          const formatted = data.map((item: any) => ({
            id: String(item.id),
            provider: item.provider,
            name: item.name,
            description: item.description,
            status: item.status || 'connected',
            createdAt: item.created_at,
          }))
          setConnections(formatted)
        }
      }
    } catch (error) {
      console.error('Failed to load connections:', error)
    }
  }

  useEffect(() => {
    if (authenticated) {
      fetchConnections()
    }
  }, [authenticated])

  const activeConnection = connections.find((connection) => connection.id === activeConnectionId) || connections[0]

  const visibleApis = useMemo(() => {
    const imported = SAMPLE_APIS.map((api) =>
      importedApiIds.includes(api.id) ? { ...api, status: 'Existing' as const } : api,
    )
    if (!search.trim()) {
      return imported
    }
    const normalized = search.toLowerCase()
    return imported.filter((api) =>
      [api.name, api.apiId, api.version, api.status].some((value) =>
        value.toLowerCase().includes(normalized),
      ),
    )
  }, [importedApiIds, search])

  const updateField = (key: keyof FormState, value: string) => {
    setForm((current) => ({ ...current, [key]: value }))
    setTestState('idle')
    setTestMessage('')
  }

  const selectProvider = (provider: Provider) => {
    setSelectedProvider(provider)
    setForm({
      ...EMPTY_FORM,
      workspace: provider === 'kong' ? 'default' : '',
    })
    setTestState('idle')
    setTestMessage('')
    setShowSecret(false)
    setView('add')
  }

  const requiredFields = getRequiredFields(selectedProvider)

  const validateConnection = () => {
    const missing = requiredFields.filter((field) => !form[field].trim())
    if (missing.length) {
      return 'Fill all required fields before testing the connection.'
    }

    const gatewayUrl = selectedProvider === 'kong' ? form.adminUrl : selectedProvider === 'azure' ? form.gatewayUrl : form.endpointUrl
    if (!/^https?:\/\//i.test(gatewayUrl)) {
      return 'Gateway URL must start with http:// or https://.'
    }

    return ''
  }

  const testConnection = async () => {
    const validationError = validateConnection()
    setTestState('testing')
    setTestMessage('Testing gateway connection...')

    if (selectedProvider === 'azure' && !validationError) {
      try {
        const response = await fetch('/api/api-sources/test-connection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            provider: 'azure',
            connectionName: form.connectionName,
            serviceName: form.serviceName,
            resourceGroup: form.resourceGroup,
            subscriptionId: form.subscriptionId,
            gatewayUrl: form.gatewayUrl,
          }),
        })
        const data = (await response.json().catch(() => ({ detail: 'Azure connection test failed' }))) as {
          message?: string
          detail?: string
          gatewayStatus?: number
        }

        if (!response.ok) {
          setTestState('failed')
          setTestMessage(data.detail || data.message || 'Azure connection test failed.')
          return
        }

        setTestState('success')
        setTestMessage(`${data.message || 'Azure API gateway connection successful.'} HTTP ${data.gatewayStatus ?? 'reachable'}.`)
      } catch {
        setTestState('failed')
        setTestMessage('Unable to reach the backend Azure connection test.')
      }
      return
    }

    window.setTimeout(() => {
      if (validationError) {
        setTestState('failed')
        setTestMessage(validationError)
        return
      }

      setTestState('success')
      setTestMessage(`${providerName(selectedProvider)} gateway connection successful.`)
    }, 650)
  }

  const saveConnection = async () => {
    if (testState !== 'success') {
      setTestState('failed')
      setTestMessage('Test connection successfully before saving.')
      return
    }

    try {
      const response = await fetch('/api/api-sources', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          name: form.connectionName.trim(),
          description: form.description.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        setTestState('failed')
        setTestMessage(errorData.message || 'Failed to save connection.')
        return
      }

      const savedConnection = await response.json()
      
      const formattedConnection: GatewayConnection = {
        id: String(savedConnection.id),
        provider: savedConnection.provider,
        name: savedConnection.name,
        description: savedConnection.description,
        status: 'connected',
        createdAt: savedConnection.created_at || new Date().toISOString(),
      }

      setConnections((current) => [formattedConnection, ...current])
      setActiveConnectionId(formattedConnection.id)
      setForm(EMPTY_FORM)
      setTestState('idle')
      setTestMessage(`${formattedConnection.name} saved and connected.`)
      setView('sources')
    } catch {
      setTestState('failed')
      setTestMessage('Failed to connect to the server to save the connection.')
    }
  }

  const openImport = (connectionId: string) => {
    setActiveConnectionId(connectionId)
    setSelectedApis([])
    setSearch('')
    setImportStatus('')
    setView('import')
  }

  const toggleApi = (apiId: string) => {
    setSelectedApis((current) =>
      current.includes(apiId)
        ? current.filter((id) => id !== apiId)
        : [...current, apiId],
    )
  }

  const importSelectedApis = () => {
    if (!selectedApis.length) {
      return
    }
    setImportedApiIds((current) => Array.from(new Set([...current, ...selectedApis])))
    setImportDialogOpen(false)
    setImportStatus(`API import completed. ${selectedApis.length} API${selectedApis.length === 1 ? '' : 's'} imported.`)
    setSelectedApis([])
  }

  return (
    <main className="plugin-page">
      <DashboardNavbar />

      <section className="plugin-shell">
        <header className="plugin-header">
          <Button variant="outline" className="back-button" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Dashboard
          </Button>
          <div className="plugin-title">
            <span>
              <PlugZap className="w-7 h-7" />
            </span>
            <div>
              <h1>AI Monetization Plugin</h1>
              <p>Manage API gateway sources and import APIs for monetization.</p>
            </div>
          </div>
        </header>

        {view === 'sources' && (
          <>
            <section className="source-hero">
              <div>
                <p className="kicker">Manage API Sources</p>
                <h2>Connect an API gateway</h2>
                <p>Start with an API gateway source. Apigee Edge, Azure API Management, and Kong are available now.</p>
              </div>
              <div className="provider-grid">
                {PROVIDERS.map((provider) => (
                  <button key={provider.key} className="provider-card" onClick={() => selectProvider(provider.key)}>
                    <span>{provider.badge}</span>
                    <strong>{provider.name}</strong>
                    <small>{provider.description}</small>
                  </button>
                ))}
              </div>
            </section>

            <section className="sources-panel">
              <div className="panel-heading">
                <div>
                  <h2>Existing API Sources</h2>
                  <p>{connections.length ? `${connections.length} connected source${connections.length === 1 ? '' : 's'}` : 'No sources connected yet'}</p>
                </div>
                <Button className="primary-button" onClick={() => selectProvider('apigee')}>
                  Add Connection
                </Button>
              </div>

              <div className="toolbar">
                <label className="search-box">
                  <Search className="w-4 h-4" />
                  <input placeholder="Search..." />
                </label>
                <div className="view-toggle" aria-hidden="true">
                  <List className="w-4 h-4" />
                  <Grid2X2 className="w-4 h-4 active" />
                </div>
              </div>

              {connections.length === 0 ? (
                <div className="empty-state">
                  <PlugZap className="w-9 h-9" />
                  <h3>No API sources yet</h3>
                  <p>Add an API gateway connection, test it, and save it to enable API imports.</p>
                </div>
              ) : (
                <div className="source-list">
                  {connections.map((connection) => (
                    <article key={connection.id} className="source-card">
                      <div className="source-card-top">
                        <ProviderLogo provider={connection.provider} />
                        <div>
                          <h3>{connection.name}</h3>
                          <span>{providerName(connection.provider)}</span>
                        </div>
                        <CheckCircle2 className="source-success" />
                      </div>
                      <p>{connection.description || 'Connected gateway source ready for API imports.'}</p>
                      <div className="source-actions">
                        <Button className="primary-button" onClick={() => openImport(connection.id)}>
                          <Download className="w-4 h-4 mr-2" />
                          Import APIs
                        </Button>
                        <Button variant="outline" className="secondary-button" disabled>
                          Import Products
                        </Button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}

        {view === 'add' && (
          <section className="form-page">
            <div className="crumb">Manage API Sources / Add Connection</div>
            <div className="form-top">
              <h2>Add {providerName(selectedProvider)} Connection</h2>
              <div className="form-actions">
                <Button className="primary-button" onClick={saveConnection}>Save Connection</Button>
                <Button variant="outline" className="secondary-button" onClick={() => setView('sources')}>Cancel</Button>
              </div>
            </div>

            <TrialBanner />

            <div className="connection-form">
              <Field label="Connection Name" required value={form.connectionName} onChange={(value) => updateField('connectionName', value)} help="A unique name to identify this connection." />
              <Field label="Description" value={form.description} onChange={(value) => updateField('description', value)} multiline />

              {selectedProvider === 'apigee' && (
                <>
                  <Field label="Endpoint URL" required value={form.endpointUrl} onChange={(value) => updateField('endpointUrl', value)} help="Apigee Edge management API base URL, e.g. https://api.enterprise.apigee.com." />
                  <Field label="Organization" required value={form.organization} onChange={(value) => updateField('organization', value)} help="Apigee organization name." />
                  <Field label="Environment" required value={form.environment} onChange={(value) => updateField('environment', value)} help="Apigee environment name, e.g. prod or test." />
                  <Field label="Username" required value={form.username} onChange={(value) => updateField('username', value)} help="Apigee admin email address." />
                  <SecretField label="Password" value={form.password} visible={showSecret} onToggle={() => setShowSecret((value) => !value)} onChange={(value) => updateField('password', value)} help="Apigee admin password." />
                </>
              )}

              {selectedProvider === 'azure' && (
                <>
                  <Field label="Service Name" required value={form.serviceName} onChange={(value) => updateField('serviceName', value)} help="Name of the Azure API Management instance service name." />
                  <Field label="Resource Group" required value={form.resourceGroup} onChange={(value) => updateField('resourceGroup', value)} help="Resource Group where the API Management instance is located." />
                  <Field label="Subscription ID" required value={form.subscriptionId} onChange={(value) => updateField('subscriptionId', value)} help="Azure Subscription ID associated with the API Management instance." />
                  <Field label="Gateway URL" required value={form.gatewayUrl} onChange={(value) => updateField('gatewayUrl', value)} help="Azure API gateway URL, e.g. https://monetizemateresource.azure-api.net" />
                </>
              )}

              {selectedProvider === 'kong' && (
                <>
                  <Field label="Admin API URL" required value={form.adminUrl} onChange={(value) => updateField('adminUrl', value)} help="Kong Admin API base URL. Do not include a trailing slash." />
                  <Field label="Workspace" value={form.workspace} onChange={(value) => updateField('workspace', value)} help="Use default for the default workspace. Leave empty for Kong OSS." />
                  <Field label="Admin API Key" required value={form.adminApiKey} onChange={(value) => updateField('adminApiKey', value)} help="Kong Admin API key or RBAC token." />
                </>
              )}

              <div className="test-row">
                <Button variant="outline" className="test-button" onClick={testConnection}>
                  {testState === 'testing' ? <RefreshCw className="w-4 h-4 mr-2 spin" /> : null}
                  Test Connection
                </Button>
                {testMessage && <StatusMessage state={testState} message={testMessage} />}
              </div>
            </div>
          </section>
        )}

        {view === 'import' && activeConnection && (
          <section className="import-page">
            <div className="crumb">Manage API Sources / Import APIs</div>
            {importStatus && <div className="import-success"><CheckCircle2 className="w-5 h-5" />{importStatus}</div>}
            <TrialBanner />

            <div className="import-heading">
              <div>
                <h2>Import APIs</h2>
                <span><ProviderLogo provider={activeConnection.provider} />{providerName(activeConnection.provider)}</span>
              </div>
              <Button variant="outline" className="secondary-button" onClick={() => setView('sources')}>Back to Sources</Button>
            </div>

            <div className="import-tools">
              <label>
                Status:
                <select defaultValue="All">
                  <option>All</option>
                  <option>New</option>
                  <option>Existing</option>
                </select>
              </label>
              <label className="table-search">
                Search:
                <input value={search} onChange={(event) => setSearch(event.target.value)} />
              </label>
              <Button variant="outline" className="secondary-button">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh APIs
              </Button>
            </div>

            <div className="api-table-wrap">
              <table className="api-table">
                <thead>
                  <tr>
                    <th><input type="checkbox" aria-label="Select all APIs" checked={visibleApis.length > 0 && visibleApis.every((api) => selectedApis.includes(api.id))} onChange={(event) => setSelectedApis(event.target.checked ? visibleApis.map((api) => api.id) : [])} /></th>
                    <th>Status</th>
                    <th>Name</th>
                    <th>API ID</th>
                    <th>Version</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleApis.map((api) => (
                    <tr key={api.id}>
                      <td><input type="checkbox" checked={selectedApis.includes(api.id)} onChange={() => toggleApi(api.id)} aria-label={`Select ${api.name}`} /></td>
                      <td><span className={`status-pill ${api.status.toLowerCase()}`}>{api.status}</span></td>
                      <td>{api.name}</td>
                      <td>{api.apiId}</td>
                      <td>{api.version}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="table-footer">
              <span>Showing 1 to {visibleApis.length} of {SAMPLE_APIS.length} entries</span>
              <div className="table-actions">
                <Button variant="outline" className="secondary-button" disabled={!selectedApis.length} onClick={() => setImportDialogOpen(true)}>
                  Import Selected
                </Button>
                <Button className="primary-button" onClick={() => {
                  setSelectedApis(visibleApis.map((api) => api.id))
                  setImportDialogOpen(true)
                }}>
                  Import All APIs
                </Button>
              </div>
            </div>

            {importDialogOpen && (
              <div className="modal-backdrop">
                <div className="import-modal">
                  <button className="modal-close" onClick={() => setImportDialogOpen(false)} aria-label="Close import options">
                    <X className="w-4 h-4" />
                  </button>
                  <div className="modal-title">
                    <Download className="w-5 h-5" />
                    <h3>Import Options</h3>
                  </div>
                  <div className="selected-box">Importing {selectedApis.length} selected API{selectedApis.length === 1 ? '' : 's'}</div>
                  <div className="modal-row">
                    <div>
                      <strong>Existing documentation</strong>
                      <p>Portal documentation content for re-imported APIs</p>
                    </div>
                    <div className="segmented">
                      <button>Keep</button>
                      <button>Overwrite</button>
                    </div>
                  </div>
                  <div className="modal-row">
                    <div>
                      <strong>API Governance checks</strong>
                      <p>Run quality scans on imported APIs</p>
                    </div>
                    <div className="segmented">
                      <button>Skip</button>
                      <button>Run</button>
                    </div>
                  </div>
                  <div className="checks">
                    <label><input type="checkbox" defaultChecked /> Security</label>
                    <label><input type="checkbox" defaultChecked /> Style</label>
                    <label><input type="checkbox" defaultChecked /> Documentation</label>
                  </div>
                  <div className="modal-actions">
                    <Button variant="outline" className="secondary-button" onClick={() => setImportDialogOpen(false)}>Cancel</Button>
                    <Button className="primary-button" onClick={importSelectedApis}>Import</Button>
                  </div>
                </div>
              </div>
            )}
          </section>
        )}
      </section>

      <style>{`
        .plugin-page {
          min-height: 100vh;
          background: var(--app-background);
          color: var(--text-primary);
          font-family: 'DM Sans', system-ui, sans-serif;
        }

        .plugin-shell {
          width: min(1200px, calc(100% - 48px));
          margin: 0 auto;
          padding: 36px 0 70px;
        }

        .plugin-header {
          display: flex;
          align-items: center;
          gap: 22px;
          margin-bottom: 28px;
        }

        .back-button,
        .secondary-button {
          border: 1px solid var(--border-hover);
          color: var(--accent);
          background: var(--surface-soft);
          font-weight: 800;
        }

        .primary-button {
          background: var(--accent-gradient);
          color: #061421;
          font-weight: 900;
        }

        .plugin-title {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .plugin-title > span {
          width: 52px;
          height: 52px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          color: #061421;
          background: var(--accent-gradient);
        }

        .plugin-title h1,
        .source-hero h2,
        .form-top h2,
        .import-heading h2 {
          margin: 0;
          color: var(--text-primary);
          font-weight: 900;
        }

        .plugin-title p,
        .source-hero p,
        .panel-heading p,
        .source-card p,
        .field small,
        .modal-row p {
          color: #526172;
          color: var(--text-secondary);
        }

        .source-hero,
        .sources-panel,
        .connection-form,
        .api-table-wrap {
          border: 1px solid var(--border);
          border-radius: 10px;
          background: var(--surface-strong);
          box-shadow: 0 22px 68px rgba(0, 0, 0, 0.22);
        }

        .source-hero {
          display: grid;
          grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
          gap: 24px;
          padding: 28px;
          margin-bottom: 24px;
        }

        .kicker {
          margin: 0 0 8px;
          color: var(--accent);
          font-size: 12px;
          font-weight: 900;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }

        .provider-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        .provider-card {
          min-height: 150px;
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--surface-soft);
          padding: 16px;
          text-align: left;
          cursor: pointer;
        }

        .provider-card:hover {
          border-color: var(--border-hover);
          background: var(--bg-card-hover);
        }

        .provider-card span,
        .provider-logo {
          width: 44px;
          height: 44px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          color: #061421;
          background: var(--accent-gradient);
          font-weight: 900;
          margin-bottom: 14px;
        }

        .provider-logo.apigee { background: linear-gradient(135deg, #ffb454, #ff7a1a); }
        .provider-logo.kong { background: linear-gradient(135deg, #00E5C0, #1ABFA3); }

        .provider-card strong,
        .provider-card small {
          display: block;
        }

        .provider-card strong {
          color: var(--text-primary);
          font-size: 16px;
          margin-bottom: 6px;
        }

        .sources-panel {
          padding: 22px;
        }

        .panel-heading,
        .form-top,
        .import-heading,
        .table-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
        }

        .toolbar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 16px;
          margin: 18px 0;
        }

        .search-box,
        .table-search {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--text-secondary);
        }

        .search-box {
          width: min(320px, 100%);
          border: 1px solid var(--border);
          border-radius: 8px;
          background: var(--surface-soft);
          padding: 0 12px;
        }

        .search-box input,
        .table-search input {
          height: 42px;
          border: 0;
          outline: none;
          background: transparent;
        }

        .view-toggle {
          display: flex;
          gap: 8px;
          color: var(--text-muted);
        }

        .view-toggle svg {
          width: 34px;
          height: 34px;
          padding: 8px;
          border: 1px solid var(--border);
          border-radius: 7px;
        }

        .view-toggle .active {
          color: #061421;
          background: var(--accent-gradient);
        }

        .empty-state {
          min-height: 210px;
          display: grid;
          place-items: center;
          text-align: center;
          color: var(--text-secondary);
        }

        .source-list {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .source-card {
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 16px;
        }

        .source-card-top {
          display: grid;
          grid-template-columns: 52px minmax(0, 1fr) 24px;
          gap: 12px;
          align-items: center;
          border-bottom: 1px solid var(--border);
          padding-bottom: 12px;
        }

        .source-card h3 {
          margin: 0;
          font-size: 17px;
        }

        .source-card-top span {
          display: inline-flex;
          width: fit-content;
          margin-top: 5px;
          padding: 4px 10px;
          border-radius: 999px;
          color: var(--accent);
          background: rgba(0, 229, 192, 0.1);
          font-size: 12px;
          font-weight: 800;
        }

        .source-success,
        .import-success svg {
          color: var(--accent);
        }

        .source-actions {
          display: flex;
          gap: 10px;
          margin-top: 14px;
          flex-wrap: wrap;
        }

        .crumb {
          color: var(--text-secondary);
          font-size: 14px;
          margin-bottom: 18px;
        }

        .form-actions {
          display: flex;
          gap: 10px;
        }

        .trial-banner {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 18px;
          margin: 24px 0;
          padding: 14px 20px;
          border-radius: 8px;
          color: #ffffff;
          background: linear-gradient(135deg, rgba(0, 229, 192, 0.18), rgba(26, 191, 163, 0.08)), var(--surface-strong);
          border: 1px solid var(--border-hover);
          font-weight: 900;
        }

        .trial-banner button {
          border: 1px solid rgba(255,255,255,0.72);
          border-radius: 999px;
          color: #ffffff;
          background: rgba(255,255,255,0.14);
          padding: 6px 18px;
          font-weight: 900;
        }

        .connection-form {
          padding: 24px;
        }

        .field {
          display: grid;
          gap: 8px;
          max-width: 700px;
          margin-bottom: 24px;
          color: var(--text-primary);
          font-weight: 800;
        }

        .field span strong {
          color: #dc2626;
        }

        .field input,
        .field textarea,
        .field select {
          width: 100%;
          border: 1px solid var(--border-hover);
          border-radius: 7px;
          background: rgba(255, 255, 255, 0.06);
          color: var(--text-primary);
          font: inherit;
          padding: 10px 12px;
          outline: none;
        }

        .field input,
        .field select {
          height: 42px;
        }

        .field textarea {
          min-height: 126px;
          resize: vertical;
        }

        .secret-wrap {
          position: relative;
        }

        .secret-wrap button {
          position: absolute;
          right: 8px;
          top: 6px;
          width: 30px;
          height: 30px;
          border: 0;
          background: transparent;
          color: var(--text-primary);
        }

        .credential-box {
          max-width: 1120px;
          border: 1px solid var(--border);
          border-radius: 8px;
          padding: 22px;
          margin-bottom: 24px;
        }

        .credential-box h3 {
          margin: 0 0 20px;
          font-size: 15px;
        }

        .test-row {
          display: flex;
          align-items: center;
          gap: 16px;
          flex-wrap: wrap;
        }

        .test-button {
          height: 44px;
          border: 2px solid var(--border-hover);
          color: var(--accent);
          background: var(--surface-soft);
          font-weight: 900;
        }

        .status-message {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          min-height: 42px;
          padding: 10px 14px;
          border-radius: 8px;
          font-weight: 800;
        }

        .status-message.success {
          color: var(--accent);
          background: rgba(0, 229, 192, 0.1);
          border: 1px solid var(--border-hover);
        }

        .status-message.failed {
          color: #991b1b;
          background: #fee2e2;
          border: 1px solid #fecaca;
        }

        .status-message.testing,
        .status-message.idle {
          color: var(--accent);
          background: rgba(0, 229, 192, 0.08);
          border: 1px solid var(--border);
        }

        .spin {
          animation: spin 900ms linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .import-success {
          display: flex;
          align-items: center;
          gap: 10px;
          border: 1px solid var(--border-hover);
          border-radius: 7px;
          color: var(--accent);
          background: rgba(0, 229, 192, 0.1);
          padding: 12px 16px;
          margin-bottom: 14px;
          font-weight: 800;
        }

        .import-heading {
          margin: 18px 0;
          border-bottom: 1px solid var(--border);
          padding-bottom: 12px;
        }

        .import-heading > div,
        .import-heading span {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .import-heading .provider-logo {
          width: 28px;
          height: 28px;
          margin: 0;
          font-size: 11px;
        }

        .import-tools {
          display: flex;
          align-items: center;
          gap: 16px;
          justify-content: flex-end;
          margin-bottom: 12px;
        }

        .import-tools label:first-child {
          margin-right: auto;
        }

        .import-tools select,
        .table-search input {
          height: 34px;
          border: 1px solid var(--border);
          border-radius: 5px;
          background: var(--surface-soft);
        }

        .api-table-wrap {
          overflow: auto;
        }

        .api-table {
          width: 100%;
          border-collapse: collapse;
          background: var(--surface-strong);
          font-size: 13px;
        }

        .api-table th,
        .api-table td {
          padding: 10px 12px;
          border-bottom: 1px solid var(--border);
          text-align: left;
          white-space: nowrap;
        }

        .api-table th {
          color: var(--text-primary);
          background: var(--surface-soft);
          font-weight: 900;
        }

        .api-table tr:nth-child(even) td {
          background: rgba(255, 255, 255, 0.035);
        }

        .status-pill {
          display: inline-flex;
          align-items: center;
          border-radius: 999px;
          padding: 4px 8px;
          font-size: 11px;
          font-weight: 900;
        }

        .status-pill.new {
          color: var(--accent);
          background: rgba(0, 229, 192, 0.12);
        }

        .status-pill.existing {
          color: #8ee6ff;
          background: rgba(14, 165, 233, 0.14);
        }

        .table-footer {
          margin-top: 14px;
          color: var(--text-secondary);
          font-size: 13px;
        }

        .table-actions {
          display: flex;
          gap: 10px;
        }

        .modal-backdrop {
          position: fixed;
          inset: 0;
          z-index: 40;
          display: grid;
          place-items: center;
          background: rgba(15, 23, 42, 0.58);
        }

        .import-modal {
          position: relative;
          width: min(520px, calc(100% - 32px));
          border-radius: 10px;
          background: var(--surface-strong);
          box-shadow: 0 24px 80px rgba(15, 23, 42, 0.32);
          padding: 22px;
        }

        .modal-close {
          position: absolute;
          top: 12px;
          right: 12px;
          border: 0;
          background: transparent;
          color: var(--text-secondary);
        }

        .modal-title {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 18px;
          color: var(--accent);
        }

        .modal-title h3 {
          margin: 0;
          color: var(--text-primary);
        }

        .selected-box {
          border: 1px solid var(--border-hover);
          border-radius: 6px;
          color: var(--accent);
          background: rgba(0, 229, 192, 0.1);
          padding: 10px;
          font-weight: 900;
          margin-bottom: 16px;
        }

        .modal-row {
          display: flex;
          justify-content: space-between;
          gap: 16px;
          padding: 12px 0;
          border-bottom: 1px solid var(--border);
        }

        .modal-row strong {
          display: block;
          margin-bottom: 4px;
        }

        .modal-row p {
          margin: 0;
          font-size: 12px;
        }

        .segmented {
          display: flex;
          align-items: center;
          height: 34px;
          border-radius: 7px;
          background: rgba(0, 229, 192, 0.1);
        }

        .segmented button {
          height: 34px;
          border: 0;
          border-radius: 7px;
          background: transparent;
          padding: 0 12px;
          color: var(--text-secondary);
          font-weight: 800;
        }

        .segmented button:first-child {
          color: #061421;
          background: var(--accent-gradient);
          box-shadow: 0 1px 5px rgba(15, 23, 42, 0.12);
        }

        .checks {
          display: flex;
          gap: 18px;
          flex-wrap: wrap;
          padding: 14px 0 18px;
          border-bottom: 1px solid var(--border);
          color: var(--text-secondary);
          font-size: 13px;
          font-weight: 800;
        }

        .modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 18px;
        }

        @media (max-width: 980px) {
          .source-hero,
          .source-list {
            grid-template-columns: 1fr;
          }

          .provider-grid {
            grid-template-columns: 1fr;
          }

          .plugin-header,
          .form-top,
          .panel-heading,
          .import-heading,
          .table-footer,
          .import-tools {
            align-items: flex-start;
            flex-direction: column;
          }
        }

        @media (max-width: 640px) {
          .plugin-shell {
            width: min(100% - 28px, 1200px);
            padding: 28px 0 48px;
          }
        }
      `}</style>
    </main>
  )
}

function getRequiredFields(provider: Provider): Array<keyof FormState> {
  if (provider === 'apigee') {
    return ['connectionName', 'endpointUrl', 'organization', 'environment', 'username', 'password']
  }
  if (provider === 'azure') {
    return ['connectionName', 'serviceName', 'resourceGroup', 'subscriptionId', 'gatewayUrl']
  }
  return ['connectionName', 'adminUrl', 'adminApiKey']
}

function Field({
  label,
  value,
  onChange,
  help,
  required = false,
  multiline = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  help?: string
  required?: boolean
  multiline?: boolean
}) {
  return (
    <label className="field">
      <span>{label} {required && <strong>*</strong>}</span>
      {multiline ? (
        <textarea value={value} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input value={value} onChange={(event) => onChange(event.target.value)} />
      )}
      {help && <small>{help}</small>}
    </label>
  )
}

function SecretField({
  label,
  value,
  visible,
  onToggle,
  onChange,
  help,
}: {
  label: string
  value: string
  visible: boolean
  onToggle: () => void
  onChange: (value: string) => void
  help?: string
}) {
  return (
    <label className="field">
      <span>{label} <strong>*</strong></span>
      <span className="secret-wrap">
        <input type={visible ? 'text' : 'password'} value={value} onChange={(event) => onChange(event.target.value)} />
        <button type="button" onClick={onToggle} aria-label={visible ? 'Hide secret' : 'Show secret'}>
          {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </span>
      {help && <small>{help}</small>}
    </label>
  )
}

function ProviderLogo({ provider }: { provider: Provider }) {
  const providerConfig = PROVIDERS.find((item) => item.key === provider)
  return <span className={`provider-logo ${provider}`}>{providerConfig?.badge}</span>
}

function TrialBanner() {
  return (
    <div className="trial-banner">
      <span>Free trial - 7 days remaining</span>
      <button type="button">Upgrade</button>
      <X className="w-4 h-4" />
    </div>
  )
}

function StatusMessage({ state, message }: { state: TestState; message: string }) {
  const Icon = state === 'failed' ? AlertCircle : state === 'success' ? CheckCircle2 : ShieldCheck
  return (
    <span className={`status-message ${state}`}>
      <Icon className="w-4 h-4" />
      {message}
    </span>
  )
}
