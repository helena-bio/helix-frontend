import Link from 'next/link'

export const metadata = {
  title: 'Screening Modes | Helix Insight Documentation',
  description: 'Six screening modes in Helix Insight with mode-specific weight profiles for diagnostic, neonatal, pediatric, adult, carrier, and pharmacogenomics screening.',
}

export default function ScreeningModesPage() {
  return (
    <div className="py-10 space-y-6">
      <div>
        <p className="text-md text-muted-foreground">
          <Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
          {' / '}
          <Link href="/docs/screening" className="hover:text-primary transition-colors">Screening</Link>
          {' / '}
          <span className="text-foreground">Screening Modes</span>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-primary mt-4">Screening Modes</h1>
      </div>

      <section className="space-y-3">
        <p className="text-base text-muted-foreground leading-relaxed">
          The screening mode determines how the seven component scores are weighted. Different clinical scenarios require different prioritization strategies. A diagnostic case with known symptoms should emphasize phenotype matching, while a proactive adult screening should emphasize cancer and cardiac gene relevance.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Available Modes</p>
        <div className="space-y-3">
          {[
            { mode: 'Diagnostic', desc: 'Patient has HPO phenotype terms. Phenotype matching dominates scoring -- variants in genes matching the patient\'s symptoms are strongly prioritized.' },
            { mode: 'Neonatal Screening', desc: 'Newborn screening program (0-28 days). Emphasizes early-onset disease genes, treatable metabolic conditions, and gene constraint.' },
            { mode: 'Pediatric Screening', desc: 'Child and adolescent screening. Similar emphasis to neonatal with broader childhood-onset gene coverage.' },
            { mode: 'Proactive Adult', desc: 'Adult health screening without specific symptoms. Emphasizes cancer predisposition, cardiac genes, and age-appropriate actionable findings. Default mode.' },
            { mode: 'Carrier Screening', desc: 'Recessive carrier identification for reproductive planning. Focuses on common carrier conditions.' },
            { mode: 'Pharmacogenomics', desc: 'Drug response variant screening. Focuses on pharmacogenomically relevant genes.' },
          ].map((item) => (
            <div key={item.mode} className="bg-card border border-border rounded-lg p-4 space-y-1">
              <p className="text-base font-medium text-foreground">{item.mode}</p>
              <p className="text-md text-muted-foreground leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Weight Profiles</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Each mode assigns different weights to the seven scoring components. All weights sum to exactly 1.0. The dominant weight in each profile is highlighted.
        </p>
        <div className="bg-card border border-border rounded-lg overflow-hidden overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-3 py-2 text-md font-semibold text-foreground">Component</th>
                <th className="text-center px-3 py-2 text-md font-semibold text-foreground">Diagnostic</th>
                <th className="text-center px-3 py-2 text-md font-semibold text-foreground">Neonatal</th>
                <th className="text-center px-3 py-2 text-md font-semibold text-foreground">Pediatric</th>
                <th className="text-center px-3 py-2 text-md font-semibold text-foreground">Adult</th>
                <th className="text-center px-3 py-2 text-md font-semibold text-foreground">Elderly</th>
              </tr>
            </thead>
            <tbody>
              {[
                { comp: 'Constraint', diag: '0.20', neo: '0.25', ped: '0.25', adult: '0.20', elderly: '0.15' },
                { comp: 'Deleteriousness', diag: '0.20', neo: '0.20', ped: '0.20', adult: '0.25', elderly: '0.20' },
                { comp: 'Phenotype', diag: '0.40', neo: '0.10', ped: '0.10', adult: '0.10', elderly: '0.10' },
                { comp: 'Dosage', diag: '0.10', neo: '0.15', ped: '0.15', adult: '0.10', elderly: '0.10' },
                { comp: 'Consequence', diag: '0.05', neo: '0.10', ped: '0.10', adult: '0.10', elderly: '0.10' },
                { comp: 'Compound Het', diag: '0.05', neo: '0.05', ped: '0.05', adult: '0.05', elderly: '0.05' },
                { comp: 'Age Relevance', diag: '0.00', neo: '0.15', ped: '0.15', adult: '0.20', elderly: '0.30' },
              ].map((row, i) => {
                const vals = [row.diag, row.neo, row.ped, row.adult, row.elderly]
                const maxVal = Math.max(...vals.map(v => parseFloat(v)))
                return (
                  <tr key={row.comp} className={i < 6 ? 'border-b border-border' : ''}>
                    <td className="px-3 py-2 text-md font-medium text-foreground">{row.comp}</td>
                    {vals.map((v, j) => (
                      <td key={j} className={`px-3 py-2 text-md text-center ${parseFloat(v) === maxVal && maxVal > 0.15 ? 'font-semibold text-primary' : 'text-muted-foreground'}`}>{v}</td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-card border border-border rounded-lg p-5 space-y-2">
        <p className="text-base font-medium text-foreground">Automatic Mode Selection</p>
        <p className="text-md text-muted-foreground leading-relaxed">
          When the clinician provides HPO phenotype terms, Diagnostic mode is automatically selected regardless of the requested screening mode. This ensures that phenotype matching always receives the highest weight when symptom data is available. Without HPO terms, the selected mode's weight profile is used. The Proactive Adult profile is the default when no mode is specified.
        </p>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Design Principle</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Age relevance weight increases with patient age: 0.00 (diagnostic), 0.15 (neonatal/pediatric), 0.20 (adult), 0.30 (elderly). This reflects the clinical reality that older patients benefit most from narrowly actionable findings, while younger patients warrant broader screening. In diagnostic mode, phenotype match replaces age relevance entirely as the dominant signal.
        </p>
      </section>
    </div>
  )
}
