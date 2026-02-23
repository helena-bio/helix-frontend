import Link from 'next/link'

export const metadata = {
  title: 'Age-Aware Prioritization | Helix Insight Documentation',
  description: 'How patient age drives gene relevance scoring with curated gene lists for neonatal, pediatric, adult, and elderly screening.',
}

export default function AgeAwarePrioritizationPage() {
  return (
    <div className="py-10 space-y-6">
      <div>
        <p className="text-md text-muted-foreground">
          <Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
          {' / '}
          <Link href="/docs/screening" className="hover:text-primary transition-colors">Screening</Link>
          {' / '}
          <span className="text-foreground">Age-Aware Prioritization</span>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-primary mt-4">Age-Aware Prioritization</h1>
      </div>

      <section className="space-y-3">
        <p className="text-base text-muted-foreground leading-relaxed">
          Not all genetic findings are equally relevant at every age. A BRCA1 variant is critical for an adult's cancer screening but irrelevant for a newborn's immediate care. A CFTR variant matters urgently in a neonate but is primarily a carrier finding in an adult. Helix Insight uses patient age to adjust which genes receive the highest relevance scores during screening.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Age Groups</p>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Group</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Age Range</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Clinical Focus</th>
              </tr>
            </thead>
            <tbody>
              {[
                { group: 'Neonatal', range: '0-28 days', focus: 'Metabolic emergencies, early-onset conditions, actionable newborn findings' },
                { group: 'Infant', range: '29 days - 1 year', focus: 'Early-onset diseases, developmental conditions' },
                { group: 'Child', range: '1-12 years', focus: 'Childhood-onset, inherited metabolic disorders' },
                { group: 'Adolescent', range: '12-18 years', focus: 'Pediatric-onset, cardiac screening genes' },
                { group: 'Adult', range: '18-65 years', focus: 'Cancer predisposition, cardiac, pharmacogenomics' },
                { group: 'Elderly', range: '65+ years', focus: 'Cardiac (high priority), cancer (reduced), immediately actionable only' },
              ].map((row, i) => (
                <tr key={row.group} className={i < 5 ? 'border-b border-border' : ''}>
                  <td className="px-4 py-2 text-md font-medium text-foreground">{row.group}</td>
                  <td className="px-4 py-2 text-md text-muted-foreground">{row.range}</td>
                  <td className="px-4 py-2 text-md text-muted-foreground">{row.focus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Neonatal */}
      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Neonatal Scoring</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          For neonates, early-onset disease genes and treatable metabolic conditions receive the highest relevance. ACMG Secondary Findings genes receive moderate relevance because while important for future care, they are not immediately actionable in a newborn.
        </p>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Gene Category</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Score</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Example Genes</th>
              </tr>
            </thead>
            <tbody>
              {[
                { cat: 'Early-onset disease', score: '1.0', genes: 'CFTR, SMN1, GAA, GBA, HEXA, F8, F9, DMD, BTD, GCH1' },
                { cat: 'Treatable metabolic', score: '0.95', genes: 'PAH, GALT, BCKDHA, IVD, MMUT, PCCA, PCCB' },
                { cat: 'ACMG Secondary Findings', score: '0.5', genes: '81 genes (BRCA1/2, MYBPC3, LDLR, etc.)' },
                { cat: 'Other genes', score: '0.1', genes: 'All other genes' },
              ].map((row, i) => (
                <tr key={i} className={i < 3 ? 'border-b border-border' : ''}>
                  <td className="px-4 py-2 text-md font-medium text-foreground">{row.cat}</td>
                  <td className="px-4 py-2 text-md font-medium text-foreground">{row.score}</td>
                  <td className="px-4 py-2 text-md text-muted-foreground">{row.genes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Pediatric */}
      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Pediatric Scoring</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          For infants, children, and adolescents, childhood-onset disease genes receive the highest relevance. Early-onset genes remain elevated because many early-onset conditions also present in later childhood.
        </p>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Gene Category</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Score</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Example Genes</th>
              </tr>
            </thead>
            <tbody>
              {[
                { cat: 'Childhood-onset disease', score: '1.0', genes: 'NF1, PKD1, PKD2, COL4A5, FMR1, TSC1, TSC2' },
                { cat: 'Early-onset disease', score: '0.8', genes: 'CFTR, SMN1, GAA, DMD, BTD, GCH1' },
                { cat: 'ACMG Secondary Findings', score: '0.6', genes: '81 genes' },
                { cat: 'Other genes', score: '0.2', genes: 'All other genes' },
              ].map((row, i) => (
                <tr key={i} className={i < 3 ? 'border-b border-border' : ''}>
                  <td className="px-4 py-2 text-md font-medium text-foreground">{row.cat}</td>
                  <td className="px-4 py-2 text-md font-medium text-foreground">{row.score}</td>
                  <td className="px-4 py-2 text-md text-muted-foreground">{row.genes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Adult */}
      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Adult Scoring</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          For adults, cancer predisposition and cardiac genes receive the highest relevance. These are the conditions where early detection and intervention have the greatest impact on outcomes.
        </p>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Gene Category</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Score</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Example Genes</th>
              </tr>
            </thead>
            <tbody>
              {[
                { cat: 'Cancer high-risk', score: '1.0', genes: 'BRCA1, BRCA2, MLH1, MSH2, MSH6, PMS2, PALB2, ATM, CHEK2, TP53, CDH1' },
                { cat: 'Cardiac', score: '0.9', genes: 'KCNH2, KCNQ1, SCN5A, MYBPC3, MYH7, LMNA, FBN1, DSP, PKP2' },
                { cat: 'ACMG Secondary Findings', score: '0.7', genes: '81 genes' },
                { cat: 'Other genes', score: '0.3', genes: 'All other genes' },
              ].map((row, i) => (
                <tr key={i} className={i < 3 ? 'border-b border-border' : ''}>
                  <td className="px-4 py-2 text-md font-medium text-foreground">{row.cat}</td>
                  <td className="px-4 py-2 text-md font-medium text-foreground">{row.score}</td>
                  <td className="px-4 py-2 text-md text-muted-foreground">{row.genes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Elderly */}
      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Elderly Scoring</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          For patients over 65, cardiac genes receive the highest relevance because sudden cardiac death risk remains actionable at any age. Cancer predisposition genes receive reduced relevance because many cancer screening interventions have diminishing returns in elderly patients. Only immediately actionable findings are prioritized.
        </p>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Gene Category</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Score</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Rationale</th>
              </tr>
            </thead>
            <tbody>
              {[
                { cat: 'Cardiac genes', score: '1.0', rationale: 'Sudden cardiac death risk is actionable at any age' },
                { cat: 'Cancer high-risk', score: '0.4', rationale: 'Reduced screening benefit; shared decision-making recommended' },
                { cat: 'Other genes', score: '0.2', rationale: 'Only immediately actionable findings prioritized' },
              ].map((row, i) => (
                <tr key={i} className={i < 2 ? 'border-b border-border' : ''}>
                  <td className="px-4 py-2 text-md font-medium text-foreground">{row.cat}</td>
                  <td className="px-4 py-2 text-md font-medium text-foreground">{row.score}</td>
                  <td className="px-4 py-2 text-md text-muted-foreground">{row.rationale}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">ACMG Secondary Findings (v3.2)</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          The ACMG recommends reporting pathogenic and likely pathogenic variants in 81 genes regardless of the primary indication for testing. These genes represent conditions where early identification can lead to medical interventions that improve outcomes. Helix Insight includes all 81 ACMG SF v3.2 genes in the age relevance scoring, organized into three categories: Cancer Predisposition (25 genes), Cardiac (34 genes), and Metabolic (8 genes), plus additional genes across categories.
        </p>
      </section>

      <section className="bg-card border border-border rounded-lg p-5 space-y-2">
        <p className="text-base font-medium text-foreground">Precision for Neonates</p>
        <p className="text-md text-muted-foreground leading-relaxed">
          Age group assignment uses day-precision for the neonatal period: patients 0-28 days old are classified as Neonatal, while 29 days to 1 year are classified as Infant. This distinction matters because neonatal screening protocols differ significantly from infant screening -- certain metabolic emergencies require intervention within the first weeks of life.
        </p>
      </section>
    </div>
  )
}
