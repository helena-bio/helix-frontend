import Link from 'next/link'

export const metadata = {
  title: 'gnomAD | Helix Insight Documentation',
  description: 'gnomAD v4.1 population frequency and gene constraint databases -- allele frequencies and gene-level tolerance metrics used for ACMG classification.',
}

const frequencyColumns = [
  { name: 'global_af', type: 'FLOAT', description: 'Global allele frequency across all populations. Primary field for BA1 (>5%), BS1, and PM2 (<0.01%) criteria.' },
  { name: 'global_ac', type: 'INTEGER', description: 'Global allele count. Number of times the alternate allele was observed across all samples.' },
  { name: 'global_an', type: 'INTEGER', description: 'Global allele number. Total number of alleles genotyped at this position. Used to assess coverage adequacy.' },
  { name: 'global_hom', type: 'INTEGER', description: 'Global homozygote count. Number of individuals homozygous for the alternate allele. Used for BS2 (>15 homozygotes).' },
  { name: 'af_grpmax', type: 'FLOAT', description: 'Maximum allele frequency across ancestry groups. Identifies population-specific enrichment that global AF might mask.' },
  { name: 'popmax', type: 'VARCHAR', description: 'Population with the highest allele frequency. Reports which ancestry group shows the highest frequency for this variant.' },
]

const constraintColumns = [
  { name: 'pLI', type: 'FLOAT', description: 'Probability of Loss-of-function Intolerance. Ranges 0 to 1. Values > 0.9 indicate the gene is highly intolerant to loss-of-function variants. Used for PVS1 (> 0.9), PP2 (> 0.5), and BP1 (< 0.1).' },
  { name: 'LOEUF (oe_lof_upper)', type: 'FLOAT', description: 'Loss-of-function Observed/Expected Upper bound Fraction. Lower values indicate stronger constraint. Values < 0.35 trigger PVS1 as an alternative to pLI. The preferred constraint metric in recent literature.' },
  { name: 'oe_lof', type: 'FLOAT', description: 'Loss-of-function observed/expected ratio. The point estimate of how many LoF variants are observed versus expected. LOEUF is the upper confidence bound of this ratio.' },
  { name: 'mis_z', type: 'FLOAT', description: 'Missense Z-score. Positive values indicate the gene has fewer missense variants than expected (missense-constrained). Used in the Screening Service for gene relevance scoring.' },
]

const ancestryGroups = [
  { code: 'AFR', name: 'African / African American', samples: '~30,000' },
  { code: 'AMR', name: 'Admixed American / Latino', samples: '~16,000' },
  { code: 'ASJ', name: 'Ashkenazi Jewish', samples: '~5,000' },
  { code: 'EAS', name: 'East Asian', samples: '~10,000' },
  { code: 'FIN', name: 'Finnish', samples: '~13,000' },
  { code: 'MID', name: 'Middle Eastern', samples: '~3,000' },
  { code: 'NFE', name: 'Non-Finnish European', samples: '~450,000' },
  { code: 'SAS', name: 'South Asian', samples: '~19,000' },
]

export default function GnomadPage() {
  return (
    <div className="py-10 space-y-6">
      <div>
        <p className="text-md text-muted-foreground">
          <Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
          {' / '}
          <Link href="/docs/databases" className="hover:text-primary transition-colors">Reference Databases</Link>
          {' / '}
          <span className="text-foreground">gnomAD</span>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-primary mt-4">gnomAD</h1>
        <p className="text-base text-muted-foreground leading-relaxed mt-3">
          Helix Insight uses two separate gnomAD datasets: variant-level population frequencies for assessing how common a variant is in healthy individuals, and gene-level constraint metrics for assessing how tolerant a gene is to different types of mutations. Both are loaded locally and queried without external API calls.
        </p>
      </div>

      {/* ============================================================ */}
      {/* SECTION 1: gnomAD Variant Frequencies                        */}
      {/* ============================================================ */}

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">gnomAD Variant Frequencies</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Population allele frequencies from 807,162 individuals across 8 genetic ancestry groups. This is the primary source for population frequency evidence in ACMG classification. A variant observed at high frequency in healthy individuals is unlikely to cause a rare genetic disorder.
        </p>
      </section>

      <section className="space-y-3">
        <div className="bg-card border border-border rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground w-32">Version</span>
            <span className="text-md text-muted-foreground">v4.1.0</span>
          </div>
          <div className="border-t border-border/50" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground w-32">Records</span>
            <span className="text-md text-muted-foreground">~759 million variants</span>
          </div>
          <div className="border-t border-border/50" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground w-32">Individuals</span>
            <span className="text-md text-muted-foreground">807,162 across 8 ancestry groups</span>
          </div>
          <div className="border-t border-border/50" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground w-32">Genome Build</span>
            <span className="text-md text-muted-foreground">GRCh38</span>
          </div>
          <div className="border-t border-border/50" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground w-32">Match Key</span>
            <span className="text-md text-muted-foreground">chromosome + position + reference allele + alternate allele</span>
          </div>
          <div className="border-t border-border/50" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground w-32">Source</span>
            <span className="text-md text-primary">gnomad.broadinstitute.org</span>
          </div>
          <div className="border-t border-border/50" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground w-32">Producer</span>
            <span className="text-md text-muted-foreground">Broad Institute of MIT and Harvard</span>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">ACMG Criteria Using Variant Frequencies</p>
        <div className="space-y-3">
          {[
            { code: 'BA1', strength: 'Stand-alone Benign', desc: 'Global allele frequency > 5%. This single criterion classifies the variant as Benign regardless of all other evidence.' },
            { code: 'BS1', strength: 'Strong Benign', desc: 'Frequency higher than expected for the disorder. Inheritance-aware thresholds: >= 0.1% for autosomal dominant (haploinsufficiency score = 3), >= 5% for autosomal recessive.' },
            { code: 'BS2', strength: 'Strong Benign', desc: 'Observed in > 15 homozygous individuals in the healthy population. Indicates the homozygous state is tolerated.' },
            { code: 'PM2', strength: 'Moderate Pathogenic', desc: 'Absent from controls or at extremely low frequency (global AF < 0.01%). Frequency data must be present (non-NULL) to trigger.' },
          ].map((item) => (
            <div key={item.code} className="bg-card border border-border rounded-lg p-4 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-foreground">{item.code}</span>
                <span className="px-2 py-0.5 text-sm rounded bg-muted text-muted-foreground">{item.strength}</span>
              </div>
              <p className="text-md text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Frequency Columns (6)</p>
        <div className="space-y-3">
          {frequencyColumns.map((col) => (
            <div key={col.name} className="bg-card border border-border rounded-lg p-4 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-md font-semibold text-foreground">{col.name}</span>
                <span className="px-2 py-0.5 text-xs rounded bg-muted text-muted-foreground">{col.type}</span>
              </div>
              <p className="text-md text-muted-foreground leading-relaxed">{col.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Ancestry Groups</p>
        <p className="text-md text-muted-foreground leading-relaxed">
          gnomAD v4.1 categorizes individuals into 8 genetic ancestry groups. The popmax field reports which group shows the highest allele frequency for a given variant, which can be clinically relevant for population-specific disease prevalence.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 pr-3 font-medium text-foreground">Code</th>
                <th className="text-left py-2 pr-3 font-medium text-foreground">Ancestry Group</th>
                <th className="text-left py-2 font-medium text-foreground">Approximate Samples</th>
              </tr>
            </thead>
            <tbody>
              {ancestryGroups.map((group) => (
                <tr key={group.code} className="border-b border-border/50">
                  <td className="py-2 pr-3 text-md text-foreground">{group.code}</td>
                  <td className="py-2 pr-3 text-md text-muted-foreground">{group.name}</td>
                  <td className="py-2 text-md text-muted-foreground">{group.samples}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-primary/80">
          Note: Non-Finnish European (NFE) represents the majority of the cohort. Variants enriched in underrepresented populations may have less precise frequency estimates.
        </p>
      </section>

      {/* ============================================================ */}
      {/* SECTION 2: gnomAD Gene Constraint                            */}
      {/* ============================================================ */}

      <section className="space-y-3 pt-4 border-t border-border">
        <p className="text-lg font-semibold text-foreground">gnomAD Gene Constraint</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          A separate gnomAD dataset provides gene-level constraint metrics derived from the same population data. While variant frequencies tell you how common a specific variant is, constraint metrics tell you how tolerant the gene itself is to different types of mutations. A gene with very few observed loss-of-function variants relative to expectation is likely essential for normal function, and loss-of-function variants in that gene are more likely to be pathogenic.
        </p>
      </section>

      <section className="space-y-3">
        <div className="bg-card border border-border rounded-lg p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground w-32">Version</span>
            <span className="text-md text-muted-foreground">v4.1.0</span>
          </div>
          <div className="border-t border-border/50" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground w-32">Records</span>
            <span className="text-md text-muted-foreground">~18,200 genes</span>
          </div>
          <div className="border-t border-border/50" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground w-32">Match Key</span>
            <span className="text-md text-muted-foreground">gene_symbol</span>
          </div>
          <div className="border-t border-border/50" />
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-foreground w-32">Source</span>
            <span className="text-md text-primary">gnomad.broadinstitute.org/downloads#v4-constraint</span>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">ACMG Criteria Using Gene Constraint</p>
        <div className="space-y-3">
          {[
            { code: 'PVS1', strength: 'Very Strong Pathogenic', desc: 'Loss-of-function variant in a gene intolerant to LoF. Requires pLI > 0.9 OR LOEUF < 0.35. The strongest automated pathogenic criterion.' },
            { code: 'PP2', strength: 'Supporting Pathogenic', desc: 'Missense variant in a gene with constraint against missense variation. Requires pLI > 0.5.' },
            { code: 'BP1', strength: 'Supporting Benign', desc: 'Missense variant in a gene tolerant to loss-of-function (pLI < 0.1). If LoF variants are tolerated, missense variants are even less likely to be pathogenic.' },
          ].map((item) => (
            <div key={item.code} className="bg-card border border-border rounded-lg p-4 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-foreground">{item.code}</span>
                <span className="px-2 py-0.5 text-sm rounded bg-muted text-muted-foreground">{item.strength}</span>
              </div>
              <p className="text-md text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Constraint Columns (4)</p>
        <div className="space-y-3">
          {constraintColumns.map((col) => (
            <div key={col.name} className="bg-card border border-border rounded-lg p-4 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-md font-semibold text-foreground">{col.name}</span>
                <span className="px-2 py-0.5 text-xs rounded bg-muted text-muted-foreground">FLOAT</span>
              </div>
              <p className="text-md text-muted-foreground leading-relaxed">{col.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-card border border-border rounded-lg p-5 space-y-2">
        <p className="text-base font-medium text-foreground">pLI vs. LOEUF</p>
        <p className="text-md text-muted-foreground leading-relaxed">
          Both pLI and LOEUF measure gene intolerance to loss-of-function variants, but they use different statistical approaches. pLI is a probability (0 to 1) from a discrete classification model. LOEUF is the upper confidence bound of the observed/expected ratio and provides a continuous measure of constraint. Recent literature favors LOEUF because it better captures the spectrum of constraint rather than forcing genes into discrete categories. Helix Insight accepts either metric for PVS1 (pLI {'>'} 0.9 OR LOEUF {'<'} 0.35) to maximize sensitivity.
        </p>
      </section>

      {/* ============================================================ */}
      {/* Limitations (covers both datasets)                           */}
      {/* ============================================================ */}

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Limitations</p>
        <div className="bg-card border border-border rounded-lg p-4 space-y-2">
          {[
            'gnomAD excludes individuals with known Mendelian disease diagnoses, but does not screen for carrier status or late-onset conditions.',
            'Coverage varies across the genome. Low-coverage regions may have NULL frequency data, which prevents PM2 from triggering.',
            'Structural variants and complex rearrangements are not represented in the SNV/indel dataset.',
            'Population ancestry group assignment is based on principal component analysis, not self-reported ethnicity.',
            'Rare variants in underrepresented populations may have inflated or absent frequency estimates due to smaller sample sizes.',
            'Gene constraint metrics reflect population-level observations. A gene with low pLI may still harbor pathogenic variants in specific domains or functional regions.',
            'Constraint metrics are gene-wide averages. They do not capture regional variation in constraint within a gene.',
          ].map((lim, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-1 h-1 bg-muted-foreground/40 rounded-full shrink-0 mt-1.5" />
              <p className="text-md text-muted-foreground">{lim}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <p className="text-lg font-semibold text-foreground">References</p>
        <p className="text-md text-muted-foreground leading-relaxed">
          Chen S, et al. &quot;A genomic mutational constraint map using variation in 76,156 human genomes.&quot; <span className="italic">Nature</span>. 2024;625:92-100. <a href="https://pubmed.ncbi.nlm.nih.gov/38057664/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">PMID: 38057664</a>
        </p>
        <p className="text-md text-muted-foreground leading-relaxed">
          Karczewski KJ, et al. &quot;The mutational constraint spectrum quantified from variation in 141,456 humans.&quot; <span className="italic">Nature</span>. 2020;581:434-443. <a href="https://pubmed.ncbi.nlm.nih.gov/32461654/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">PMID: 32461654</a>
        </p>
      </section>
    </div>
  )
}
