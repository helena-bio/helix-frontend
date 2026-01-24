"use client"

/**
 * PublicationDetailPanel - Comprehensive publication information view
 * Shows full details when user clicks a publication from chat results
 * 
 * Typography Scale:
 * text-3xl - Page title
 * text-lg - Section headers, card titles
 * text-base - Main content, instructions
 * text-md - Secondary descriptions
 * text-sm - Helper text, file info
 * text-xs - Technical metadata
 */

import { useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  ArrowLeft,
  ExternalLink,
  AlertCircle,
  Loader2,
  BookOpen,
  Users,
  FileText,
  Dna,
  Calendar,
  Tag,
  AlertTriangle,
} from 'lucide-react'
import { usePublication } from '@/hooks/queries'
import { getPubMedUrl, getPMCUrl, getDOIUrl } from '@/lib/api/literature'

interface PublicationDetailPanelProps {
  pmid: string
  onBack: () => void
}

const InfoRow = ({ label, value, mono = false }: { label: string; value: any; mono?: boolean }) => {
  if (value === null || value === undefined || value === '') return null

  return (
    <div className="flex justify-between items-start py-1.5 gap-4">
      <span className="text-base text-muted-foreground shrink-0">{label}</span>
      <span className={`text-md text-right ${mono ? 'font-mono' : ''}`}>
        {value}
      </span>
    </div>
  )
}

export function PublicationDetailPanel({ pmid, onBack }: PublicationDetailPanelProps) {
  const { data: publication, isLoading, error } = usePublication(pmid)

  // Parse authors
  const authorList = useMemo(() => {
    if (!publication?.authors) return []
    return publication.authors.split('|').map(a => a.trim()).filter(Boolean)
  }, [publication?.authors])

  // Parse MeSH terms
  const meshTerms = useMemo(() => {
    if (!publication?.mesh_terms) return []
    return publication.mesh_terms.split('|').map(t => t.trim()).filter(Boolean)
  }, [publication?.mesh_terms])

  // Parse publication types
  const pubTypes = useMemo(() => {
    if (!publication?.publication_types) return []
    return publication.publication_types.split('|').map(t => t.trim()).filter(Boolean)
  }, [publication?.publication_types])

  if (isLoading) {
    return (
      <div className="h-full flex flex-col bg-background">
        <div className="p-4 border-b">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="text-base">Back to Chat</span>
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (error || !publication) {
    return (
      <div className="h-full flex flex-col bg-background">
        <div className="p-4 border-b">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="text-base">Back to Chat</span>
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-lg font-medium">Failed to load publication</p>
            <p className="text-md text-muted-foreground mt-2">{error?.message}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Fixed Header */}
      <div className="flex-shrink-0 p-4 border-b space-y-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          <span className="text-base">Back to Chat</span>
        </Button>

        <div>
          <div className="flex items-start gap-3">
            <BookOpen className="h-5 w-5 text-primary mt-1 shrink-0" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold leading-tight">
                {publication.title}
              </h2>
              {publication.is_retracted && (
                <Badge variant="destructive" className="mt-2">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  RETRACTED
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 space-y-6">

          {/* Publication Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Publication Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <InfoRow label="Journal" value={publication.journal} />
              <InfoRow label="Date" value={publication.publication_date} />
              <InfoRow label="PMID" value={publication.pmid} mono />
              {publication.pmc_id && (
                <InfoRow label="PMC ID" value={publication.pmc_id} mono />
              )}
              {publication.doi && (
                <InfoRow label="DOI" value={publication.doi} mono />
              )}

              {/* External Links */}
              <div className="flex flex-wrap gap-3 pt-3 border-t">
                
                  <a href={getPubMedUrl(publication.pmid)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-base text-primary hover:underline"
                >
                  PubMed <ExternalLink className="h-3 w-3" />
                </a>
                {publication.pmc_id && (
                  
                    <a href={getPMCUrl(publication.pmc_id)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-base text-primary hover:underline"
                  >
                    Full Text (PMC) <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                {publication.doi && (
                  
                    <a href={getDOIUrl(publication.doi)!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-base text-primary hover:underline"
                  >
                    DOI <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Abstract */}
          {publication.abstract && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Abstract</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-base leading-relaxed text-foreground">
                  {publication.abstract}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Authors */}
          {authorList.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Authors ({authorList.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {authorList.map((author, idx) => (
                    <Badge key={idx} variant="secondary" className="text-md">
                      {author}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Gene Mentions */}
          {publication.gene_mentions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Dna className="h-5 w-5" />
                  Gene Mentions ({publication.gene_mentions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {publication.gene_mentions.map((gene, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="font-mono text-md">
                          {gene.gene_symbol}
                        </Badge>
                        {gene.association_type && (
                          <span className="text-md text-muted-foreground">
                            {gene.association_type}
                          </span>
                        )}
                      </div>
                      <div className="text-md text-muted-foreground">
                        {gene.mention_count} mentions
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Variant Mentions */}
          {publication.variant_mentions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Dna className="h-5 w-5" />
                  Variant Mentions ({publication.variant_mentions.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {publication.variant_mentions.map((variant, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-muted/50 rounded-lg border border-border/50"
                    >
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <Badge variant="outline" className="font-mono text-md">
                          {variant.gene_symbol}
                        </Badge>
                        {variant.hgvs_protein && (
                          <span className="text-md font-mono text-foreground">
                            {variant.hgvs_protein}
                          </span>
                        )}
                        {variant.clinical_significance && (
                          <Badge variant="secondary" className="text-sm">
                            {variant.clinical_significance}
                          </Badge>
                        )}
                      </div>
                      {variant.sentence_text && (
                        <p className="text-sm text-muted-foreground italic">
                          "{variant.sentence_text}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Publication Types */}
          {pubTypes.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Publication Types
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {pubTypes.map((type, idx) => (
                    <Badge key={idx} variant="outline" className="text-md">
                      {type}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* MeSH Terms */}
          {meshTerms.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Tag className="h-5 w-5" />
                  MeSH Terms ({meshTerms.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {meshTerms.map((term, idx) => (
                    <Badge key={idx} variant="secondary" className="text-sm">
                      {term}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

        </div>
      </div>
    </div>
  )
}
