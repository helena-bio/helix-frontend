"use client"

/**
 * Gene Panels View
 *
 * Admin component for managing organization gene panels.
 * Lists all panels (builtin + org-specific), allows creating new panels,
 * expanding to see genes, and adding/removing genes from custom panels.
 *
 * Builtin panels are read-only. Org panels can be fully managed.
 */

import { useState, useEffect, useCallback } from 'react'
import {
  Loader2, Plus, ChevronDown, Trash2, X, ListTree, Search,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { toast } from 'sonner'
import {
  fetchGenePanels,
  fetchPanelGenes,
  searchGenes,
  type GenePanelResponse,
  type GenePanelGeneResponse,
  type GeneSearchResult,
} from '@/lib/api/screening'
import { tokenUtils } from '@/lib/auth/token'

const SCREENING_API_URL = process.env.NEXT_PUBLIC_SCREENING_API_URL || 'http://localhost:9002'

// =========================================================================
// API helpers (admin-only operations)
// =========================================================================

async function createPanel(data: {
  name: string
  description?: string
  panel_type: string
  is_builtin?: boolean
}): Promise<GenePanelResponse> {
  const token = tokenUtils.get()
  const response = await fetch(`${SCREENING_API_URL}/api/v1/gene-panels/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Failed to create panel' }))
    throw new Error(err.detail || `HTTP ${response.status}`)
  }
  return response.json()
}

async function deletePanel(panelId: string): Promise<void> {
  const token = tokenUtils.get()
  const response = await fetch(`${SCREENING_API_URL}/api/v1/gene-panels/${panelId}`, {
    method: 'DELETE',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  })
  if (!response.ok && response.status !== 204) {
    const err = await response.json().catch(() => ({ detail: 'Failed to delete panel' }))
    throw new Error(err.detail || `HTTP ${response.status}`)
  }
}

async function addGeneToPanel(panelId: string, data: {
  gene_symbol: string
  disease_name?: string
  priority_score?: number
}): Promise<GenePanelGeneResponse> {
  const token = tokenUtils.get()
  const response = await fetch(`${SCREENING_API_URL}/api/v1/gene-panels/${panelId}/genes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  })
  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: 'Failed to add gene' }))
    throw new Error(err.detail || `HTTP ${response.status}`)
  }
  return response.json()
}

async function removeGeneFromPanel(panelId: string, geneSymbol: string): Promise<void> {
  const token = tokenUtils.get()
  const response = await fetch(
    `${SCREENING_API_URL}/api/v1/gene-panels/${panelId}/genes/${geneSymbol}`,
    {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  )
  if (!response.ok && response.status !== 204) {
    const err = await response.json().catch(() => ({ detail: 'Failed to remove gene' }))
    throw new Error(err.detail || `HTTP ${response.status}`)
  }
}

// =========================================================================
// COMPONENT
// =========================================================================

interface GenePanelsContentProps {
  mode?: 'admin' | 'platform'
}

export function GenePanelsContent({ mode = 'admin' }: GenePanelsContentProps) {
  const isPlatform = mode === 'platform'
  const [panels, setPanels] = useState<GenePanelResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Panel search
  const [panelSearch, setPanelSearch] = useState('')

  // Expanded panels and cached genes
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const [genesCache, setGenesCache] = useState<Record<string, GenePanelGeneResponse[]>>({})
  const [genesLoading, setGenesLoading] = useState<Set<string>>(new Set())

  // Create panel form
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [newPanelName, setNewPanelName] = useState('')
  const [newPanelDescription, setNewPanelDescription] = useState('')
  const [newPanelType, setNewPanelType] = useState('custom')
  const [creating, setCreating] = useState(false)

  // Add gene form (per panel)
  const [addGenePanel, setAddGenePanel] = useState<string | null>(null)
  const [newGeneSymbol, setNewGeneSymbol] = useState('')
  const [newGenePriority, setNewGenePriority] = useState('0.8')
  const [addingGene, setAddingGene] = useState(false)
  const [geneSearchResults, setGeneSearchResults] = useState<GeneSearchResult[]>([])
  const [geneSearching, setGeneSearching] = useState(false)

  // Load panels
  useEffect(() => {
    loadPanels()
  }, [])

  const loadPanels = async () => {
    try {
      setLoading(true)
      setError('')
      const data = await fetchGenePanels()
      setPanels(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load gene panels')
    } finally {
      setLoading(false)
    }
  }

  // Gene symbol search with debounce
  useEffect(() => {
    if (!addGenePanel) return
    const symbol = newGeneSymbol.trim()
    if (symbol.length < 2) {
      setGeneSearchResults([])
      return
    }
    const timer = setTimeout(() => {
      setGeneSearching(true)
      searchGenes(symbol, 8)
        .then(setGeneSearchResults)
        .catch(() => setGeneSearchResults([]))
        .finally(() => setGeneSearching(false))
    }, 150)
    return () => clearTimeout(timer)
  }, [newGeneSymbol, addGenePanel])

  // Toggle expand
  const handleToggleExpand = useCallback((panelId: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(panelId)) {
        next.delete(panelId)
      } else {
        next.add(panelId)
      }
      return next
    })

    // Fetch genes if not cached
    if (!genesCache[panelId]) {
      setGenesLoading(prev => new Set(prev).add(panelId))
      fetchPanelGenes(panelId)
        .then((genes) => {
          setGenesCache(prev => ({ ...prev, [panelId]: genes }))
        })
        .catch((err) => {
          console.error('Failed to fetch panel genes:', err)
        })
        .finally(() => {
          setGenesLoading(prev => {
            const next = new Set(prev)
            next.delete(panelId)
            return next
          })
        })
    }
  }, [genesCache])

  // Create panel
  const handleCreatePanel = async () => {
    if (!newPanelName.trim()) return
    setCreating(true)
    try {
      const created = await createPanel({
        name: newPanelName.trim(),
        description: newPanelDescription.trim() || undefined,
        panel_type: newPanelType,
        is_builtin: isPlatform,
      })
      setPanels(prev => [...prev, created])
      setNewPanelName('')
      setNewPanelDescription('')
      setShowCreateForm(false)
      toast.success('Panel created: ' + created.name)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create panel')
    } finally {
      setCreating(false)
    }
  }

  // Delete panel
  const handleDeletePanel = async (panelId: string, panelName: string) => {
    if (!confirm('Delete panel "' + panelName + '"? This cannot be undone.')) return
    try {
      await deletePanel(panelId)
      setPanels(prev => prev.filter(p => p.id !== panelId))
      setGenesCache(prev => {
        const next = { ...prev }
        delete next[panelId]
        return next
      })
      toast.success('Panel deleted: ' + panelName)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete panel')
    }
  }

  // Add gene to panel
  const handleAddGene = async (panelId: string) => {
    const symbol = newGeneSymbol.trim().toUpperCase()
    if (!symbol) return
    setAddingGene(true)
    try {
      const gene = await addGeneToPanel(panelId, {
        gene_symbol: symbol,
        priority_score: parseFloat(newGenePriority) || 0.8,
      })
      setGenesCache(prev => ({
        ...prev,
        [panelId]: [...(prev[panelId] || []), gene],
      }))
      // Update gene count in panel list
      setPanels(prev => prev.map(p =>
        p.id === panelId ? { ...p, gene_count: (p.gene_count || 0) + 1 } : p
      ))
      setNewGeneSymbol('')
      toast.success('Added ' + symbol)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add gene')
    } finally {
      setAddingGene(false)
    }
  }

  // Remove gene from panel
  const handleRemoveGene = async (panelId: string, geneSymbol: string) => {
    try {
      await removeGeneFromPanel(panelId, geneSymbol)
      setGenesCache(prev => ({
        ...prev,
        [panelId]: (prev[panelId] || []).filter(g => g.gene_symbol !== geneSymbol),
      }))
      setPanels(prev => prev.map(p =>
        p.id === panelId ? { ...p, gene_count: Math.max(0, (p.gene_count || 1) - 1) } : p
      ))
      toast.success('Removed ' + geneSymbol)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to remove gene')
    }
  }

  // =========================================================================
  // RENDER
  // =========================================================================

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-base text-destructive">{error}</div>
    )
  }

  const builtinPanels = panels.filter(p => p.is_builtin)
  const orgPanels = panels.filter(p => !p.is_builtin)

  // In platform mode: builtin panels are the "editable" ones, org panels hidden
  // In admin mode: org panels are editable, builtin are read-only
  const editablePanels = isPlatform ? builtinPanels : orgPanels
  const readOnlyPanels = isPlatform ? [] : builtinPanels

  // Filter by panel search
  const q = panelSearch.toLowerCase()
  const filteredEditable = q
    ? editablePanels.filter(p => p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q))
    : editablePanels
  const filteredReadOnly = q
    ? readOnlyPanels.filter(p => p.name.toLowerCase().includes(q) || (p.description || '').toLowerCase().includes(q))
    : readOnlyPanels

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search gene panels..."
            value={panelSearch}
            onChange={(e) => setPanelSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-3 text-base bg-background border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>

        {/* New Panel button */}
        <Button
          onClick={() => setShowCreateForm(!showCreateForm)}
          variant={showCreateForm ? 'outline' : 'default'}
          className="text-base shrink-0 px-4 h-10"
        >
          {showCreateForm ? 'Cancel' : (
            <>
              <Plus className="h-4 w-4 mr-1.5" />
              New Panel
            </>
          )}
        </Button>
      </div>

      {/* Create panel form */}
      {showCreateForm && (
        <Card>
          <CardContent className="space-y-4">
            <p className="text-base font-medium text-foreground">Create a new gene panel</p>
            <div>
              <label className="block text-base font-medium text-muted-foreground mb-1">Panel name</label>
              <Input
                value={newPanelName}
                onChange={(e) => setNewPanelName(e.target.value)}
                placeholder="e.g. Cardiac Arrhythmia Panel"
                className="text-base"
              />
            </div>
            <div>
              <label className="block text-base font-medium text-muted-foreground mb-1">Description</label>
              <Input
                value={newPanelDescription}
                onChange={(e) => setNewPanelDescription(e.target.value)}
                placeholder="Brief description of the panel purpose"
                className="text-base"
              />
            </div>
            <div>
              <label className="block text-base font-medium text-muted-foreground mb-1">Panel type</label>
              <Input
                value={newPanelType}
                onChange={(e) => setNewPanelType(e.target.value)}
                placeholder="e.g. cardiology, neurology, custom"
                className="text-base"
              />
            </div>
            <Button
              onClick={handleCreatePanel}
              disabled={!newPanelName.trim() || creating}
              className="text-base"
            >
              {creating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Panel'
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Editable panels */}
      {filteredEditable.length > 0 && (
        <div className="space-y-3">
          {!isPlatform && (
            <p className="text-base font-medium text-muted-foreground">Your organization panels</p>
          )}
          {filteredEditable.map((panel) => {
            const isExpanded = expandedIds.has(panel.id)
            const cachedGenes = genesCache[panel.id]
            const isLoadingGenes = genesLoading.has(panel.id)

            return (
              <Card key={panel.id}>
                <CardContent className="p-0">
                  {/* Panel header */}
                  <div className="flex items-center gap-3 p-4">
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleToggleExpand(panel.id)}
                    >
                      <div className="flex items-center gap-2">
                        <ListTree className="h-4 w-4 text-muted-foreground" />
                        <span className="text-base font-medium text-foreground">{panel.name}</span>
                        <Badge variant="secondary" className="text-tiny px-1.5 py-0">
                          {panel.gene_count || 0} genes
                        </Badge>
                      </div>
                      {panel.description && (
                        <p className="text-md text-muted-foreground mt-0.5 ml-6">{panel.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDeletePanel(panel.id, panel.name)}
                        className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded"
                        title="Delete panel"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleToggleExpand(panel.id)}
                        className="p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded"
                      >
                        <ChevronDown className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Expanded: gene list + add gene */}
                  {isExpanded && (
                    <div className="border-t px-4 pb-4 pt-3 space-y-3">
                      {isLoadingGenes && !cachedGenes ? (
                        <div className="flex items-center gap-2 py-2">
                          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                          <span className="text-md text-muted-foreground">Loading genes...</span>
                        </div>
                      ) : cachedGenes && cachedGenes.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {cachedGenes.map((gene) => (
                            <Tooltip key={gene.gene_symbol}>
                              <TooltipTrigger asChild>
                                <Badge
                                  variant="outline"
                                  className="text-sm px-2 py-0.5 gap-1 cursor-help"
                                >
                                  {gene.gene_symbol}
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      handleRemoveGene(panel.id, gene.gene_symbol)
                                    }}
                                    className="text-muted-foreground hover:text-destructive transition-colors ml-0.5"
                                  >
                                    <X className="h-2.5 w-2.5" />
                                  </button>
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <div className="space-y-1">
                                  <p className="text-sm font-medium">{gene.gene_symbol}</p>
                                  {gene.disease_name && (
                                    <p className="text-xs text-muted-foreground">{gene.disease_name}</p>
                                  )}
                                  <p className="text-xs">Priority: {gene.priority_score.toFixed(2)}</p>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </div>
                      ) : (
                        <p className="text-md text-muted-foreground">No genes added yet.</p>
                      )}

                      {/* Add gene input with autocomplete */}
                      <div className="relative pt-1">
                        <div className="flex gap-2">
                          <Input
                            value={addGenePanel === panel.id ? newGeneSymbol : ''}
                            onChange={(e) => {
                              setAddGenePanel(panel.id)
                              setNewGeneSymbol(e.target.value)
                            }}
                            onFocus={() => setAddGenePanel(panel.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault()
                                handleAddGene(panel.id)
                              }
                              if (e.key === 'Escape') {
                                setGeneSearchResults([])
                              }
                            }}
                            placeholder="Search gene symbol..."
                            className="text-base flex-1"
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleAddGene(panel.id)}
                            disabled={addingGene || !(addGenePanel === panel.id && newGeneSymbol.trim())}
                            className="px-3"
                          >
                            {addingGene && addGenePanel === panel.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Plus className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                        {addGenePanel === panel.id && geneSearchResults.length > 0 && (
                          <div className="absolute z-10 left-0 right-12 mt-1 bg-background border rounded-md shadow-lg max-h-48 overflow-y-auto">
                            {geneSearchResults.map((result) => (
                              <button
                                key={result.approved_symbol}
                                onClick={() => {
                                  setNewGeneSymbol(result.approved_symbol)
                                  setGeneSearchResults([])
                                  handleAddGene(panel.id)
                                }}
                                className="w-full text-left px-3 py-2 hover:bg-accent transition-colors flex items-center justify-between"
                              >
                                <span className="text-base font-medium">{result.approved_symbol}</span>
                                {result.is_alias && (
                                  <span className="text-xs text-muted-foreground">alias: {result.symbol}</span>
                                )}
                              </button>
                            ))}
                          </div>
                        )}

                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Read-only panels (builtin in admin mode) */}
      {filteredReadOnly.length > 0 && (
        <div className="space-y-3">
          <p className="text-base font-medium text-muted-foreground">
            Built-in panels
            <span className="text-md ml-1">(read-only)</span>
          </p>
          {filteredReadOnly.map((panel) => {
            const isExpanded = expandedIds.has(panel.id)
            const cachedGenes = genesCache[panel.id]
            const isLoadingGenes = genesLoading.has(panel.id)

            return (
              <Card key={panel.id} className="opacity-90">
                <CardContent className="p-0">
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer"
                    onClick={() => handleToggleExpand(panel.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <ListTree className="h-4 w-4 text-muted-foreground" />
                        <span className="text-base font-medium text-foreground">{panel.name}</span>
                        <Badge variant="outline" className="text-tiny px-1.5 py-0">Built-in</Badge>
                        <Badge variant="secondary" className="text-tiny px-1.5 py-0">
                          {panel.gene_count || 0} genes
                        </Badge>
                      </div>
                      {panel.description && (
                        <p className="text-md text-muted-foreground mt-0.5 ml-6">{panel.description}</p>
                      )}
                    </div>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>

                  {isExpanded && (
                    <div className="border-t px-4 pb-4 pt-3">
                      {isLoadingGenes && !cachedGenes ? (
                        <div className="flex items-center gap-2 py-2">
                          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                          <span className="text-md text-muted-foreground">Loading genes...</span>
                        </div>
                      ) : cachedGenes && cachedGenes.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {cachedGenes.map((gene) => (
                            <Tooltip key={gene.gene_symbol}>
                              <TooltipTrigger asChild>
                                <Badge
                                  variant="outline"
                                  className="text-sm px-2 py-0.5 cursor-help"
                                >
                                  {gene.gene_symbol}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent side="top" className="max-w-xs">
                                <div className="space-y-1">
                                  <p className="text-sm font-medium">{gene.gene_symbol}</p>
                                  {gene.disease_name && (
                                    <p className="text-xs text-muted-foreground">{gene.disease_name}</p>
                                  )}
                                  <p className="text-xs">Priority: {gene.priority_score.toFixed(2)}</p>
                                  {gene.age_group_relevance && (
                                    <p className="text-xs">Age group: {gene.age_group_relevance}</p>
                                  )}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          ))}
                        </div>
                      ) : (
                        <p className="text-md text-muted-foreground">No genes in this panel.</p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {panels.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <ListTree className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-base text-muted-foreground">No gene panels available.</p>
            <p className="text-md text-muted-foreground mt-1">Create your first panel to get started.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export function GenePanelsView() {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="w-full max-w-3xl mx-auto px-6 py-8">
        <GenePanelsContent />
      </div>
    </div>
  )
}
