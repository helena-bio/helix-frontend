import Link from 'next/link'

export const metadata = {
  title: 'Uploading a VCF File | Helix Insight Documentation',
  description: 'Supported VCF formats, genome build requirements, file size limits, and what happens after upload in Helix Insight.',
}

export default function UploadingVcfPage() {
  return (
    <div className="py-10 space-y-6">
      {/* Breadcrumb */}
      <div>
        <p className="text-sm text-muted-foreground">
          <Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
          {' / '}
          <Link href="/docs/getting-started" className="hover:text-primary transition-colors">Getting Started</Link>
          {' / '}
          <span className="text-foreground">Uploading a VCF File</span>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-primary mt-4">Uploading a VCF File</h1>
      </div>

      {/* Supported formats */}
      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Supported Formats</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Helix Insight accepts VCF files in version 4.1 and 4.2 format, either as plain text (.vcf) or bgzipped (.vcf.gz). Whole genome sequencing files containing approximately 4 million variants (1-2 GB compressed) are fully supported.
        </p>
      </section>

      {/* Genome build */}
      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Genome Build Requirement</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          GRCh38 (hg38) is the primary genome build. GRCh37 (hg19) files are also accepted -- the platform performs automatic liftover to GRCh38 during upload, so no manual conversion is required. The liftover step is transparent and reported in the processing summary.
        </p>
      </section>

      {/* Single sample */}
      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Single-Sample Analysis</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Helix Insight currently supports single-sample VCF files. If your file contains multiple samples, extract the sample of interest using a tool such as bcftools before uploading. Trio analysis (proband plus parents) is on the development roadmap.
        </p>
      </section>

      {/* What happens after upload */}
      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">What Happens After Upload</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Once the file is uploaded, it is validated for format compliance and the processing pipeline begins automatically. The six-stage pipeline parses the VCF, applies quality filtering, annotates variants with Ensembl VEP, enriches them with reference database data, classifies each variant using the ACMG framework, and exports the results for clinical review.
        </p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Expected chromosomes are chr1 through chr22, chrX, chrY, and chrM. Non-standard contigs such as decoys, alternative haplotypes, and unplaced scaffolds are skipped, with a count reported in the processing summary.
        </p>
      </section>

      {/* Data handling */}
      <section className="bg-card border border-border rounded-lg p-6 space-y-3">
        <p className="text-lg font-semibold text-foreground">Data Handling</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          The uploaded VCF file is deleted from the server after processing completes. Analysis results are retained for the duration specified in your service agreement. All processing occurs on dedicated EU-based infrastructure in Helsinki, Finland. No variant data is sent to external services during processing. See <Link href="/docs/data-and-privacy" className="text-primary hover:underline">Data and Privacy</Link> for full details.
        </p>
      </section>
    </div>
  )
}
