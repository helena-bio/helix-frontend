"use client"

/**
 * Analysis Page - Main Variant Analysis Workflow
 * 
 * Flow:
 * 1. FileUpload -> Upload VCF + create session
 * 2. ProcessingStatus -> Poll task until complete
 * 3. QCMetrics -> Show QC results
 * 4. VariantsList -> Display analyzed variants
 */

import { useState, useEffect } from 'react'
import { useAnalysis } from '@/contexts/AnalysisContext'
import { useStartProcessing } from '@/hooks/mutations'
import { useSession, useQCMetrics } from '@/hooks/queries'
import { 
  FileUpload, 
  ProcessingStatus, 
  QCMetrics,
  VariantsList 
} from '@/components/analysis'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

type AnalysisStep = 'upload' | 'processing' | 'qc' | 'results'

export default function AnalysisPage() {
  const { currentSessionId, setCurrentSessionId } = useAnalysis()
  const [step, setStep] = useState<AnalysisStep>('upload')
  const [taskId, setTaskId] = useState<string | null>(null)

  const startProcessingMutation = useStartProcessing()

  const sessionQuery = useSession(currentSessionId || '', {
    enabled: !!currentSessionId && step !== 'upload',
  })

  const qcQuery = useQCMetrics(currentSessionId || '', {
    enabled: !!currentSessionId && (step === 'qc' || step === 'results'),
  })

  useEffect(() => {
    if (currentSessionId && sessionQuery.data) {
      const status = sessionQuery.data.status
      
      if (status === 'uploaded') {
        setStep('upload')
      } else if (status === 'processing') {
        setStep('processing')
      } else if (status === 'completed') {
        setStep('results')
      }
    }
  }, [currentSessionId, sessionQuery.data])

  const handleUploadSuccess = async (sessionId: string) => {
    setCurrentSessionId(sessionId)
    
    const session = sessionQuery.data
    if (!session?.vcf_file_path) {
      console.error('No VCF file path in session')
      return
    }

    try {
      const result = await startProcessingMutation.mutateAsync({
        sessionId,
        vcfFilePath: session.vcf_file_path,
      })
      
      setTaskId(result.task_id)
      setStep('processing')
    } catch (error) {
      console.error('Failed to start processing:', error)
    }
  }

  const handleProcessingComplete = () => {
    setStep('qc')
  }

  const handleViewResults = () => {
    setStep('results')
  }

  const handleStartOver = () => {
    setCurrentSessionId(null)
    setTaskId(null)
    setStep('upload')
  }

  const renderContent = () => {
    switch (step) {
      case 'upload':
        return <FileUpload onUploadSuccess={handleUploadSuccess} />

      case 'processing':
        if (!currentSessionId || !taskId) {
          return <div>Error: Missing session or task ID</div>
        }
        
        return (
          <ProcessingStatus
            taskId={taskId}
            sessionId={currentSessionId}
            onComplete={handleProcessingComplete}
          />
        )

      case 'qc':
        if (!currentSessionId || !qcQuery.data) {
          return <div>Loading QC metrics...</div>
        }

        return (
          <div className="max-w-4xl mx-auto p-8">
            <QCMetrics
              metrics={qcQuery.data}
              fileName={sessionQuery.data?.vcf_file_path?.split('/').pop()}
              onPhenotypeClick={handleViewResults}
            />
            
            <div className="mt-6 flex justify-center">
              <Button onClick={handleViewResults} size="lg">
                View Analyzed Variants
              </Button>
            </div>
          </div>
        )

      case 'results':
        if (!currentSessionId) {
          return <div>Error: No session selected</div>
        }

        return (
          <div className="p-8">
            <div className="mb-6">
              <Button variant="ghost" onClick={() => setStep('qc')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to QC Results
              </Button>
            </div>

            <VariantsList sessionId={currentSessionId} />

            <div className="mt-6 text-center">
              <Button variant="outline" onClick={handleStartOver}>
                Start New Analysis
              </Button>
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return <div className="min-h-screen">{renderContent()}</div>
}
