import Link from 'next/link'

export const metadata = {
  title: 'Combining Rules | Helix Insight Documentation',
  description: 'How ACMG criteria are combined using the Bayesian point system to determine variant classification.',
}

export default function CombiningRulesPage() {
  return (
    <div className="py-10 space-y-6">
      <div>
        <p className="text-md text-muted-foreground">
          <Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
          {' / '}
          <Link href="/docs/classification" className="hover:text-primary transition-colors">Classification</Link>
          {' / '}
          <span className="text-foreground">Combining Rules</span>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-primary mt-4">Combining Rules</h1>
      </div>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Bayesian Point System</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Helix Insight uses the Bayesian point-based classification framework (Tavtigian et al. 2018, 2020). Each evidence criterion contributes points based on its strength level. The total point sum determines the final classification.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-lg p-4 space-y-2">
            <p className="text-md font-medium text-foreground">Pathogenic Evidence Points</p>
            {[
              { level: 'Very Strong (PVS)', points: '+8' },
              { level: 'Strong (PS)', points: '+4' },
              { level: 'Moderate (PM)', points: '+2' },
              { level: 'Supporting (PP)', points: '+1' },
            ].map((e) => (
              <div key={e.level} className="flex justify-between items-center px-3 py-1.5 bg-muted/50 rounded text-md">
                <span className="text-muted-foreground">{e.level}</span>
                <span className="font-mono text-foreground">{e.points}</span>
              </div>
            ))}
          </div>
          <div className="bg-card border border-border rounded-lg p-4 space-y-2">
            <p className="text-md font-medium text-foreground">Benign Evidence Points</p>
            {[
              { level: 'Stand-alone (BA1)', points: 'Override to Benign' },
              { level: 'Strong (BS)', points: '-4' },
              { level: 'Supporting (BP)', points: '-1' },
            ].map((e) => (
              <div key={e.level} className="flex justify-between items-center px-3 py-1.5 bg-muted/50 rounded text-md">
                <span className="text-muted-foreground">{e.level}</span>
                <span className="font-mono text-foreground">{e.points}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">Classification Thresholds</p>
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Classification</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Point Range</th>
                <th className="text-left px-4 py-2 text-md font-semibold text-foreground">Confidence Range</th>
              </tr>
            </thead>
            <tbody>
              {[
                { cls: 'Pathogenic', range: '>= 10', conf: '0.80-0.99' },
                { cls: 'Likely Pathogenic', range: '6 to 9', conf: '0.70-0.90' },
                { cls: 'VUS', range: '0 to 5', conf: '0.30-0.60' },
                { cls: 'Likely Benign', range: '-1 to -5', conf: '0.70-0.90' },
                { cls: 'Benign', range: '<= -6', conf: '0.80-0.99' },
              ].map((row, i) => (
                <tr key={row.cls} className={i < 4 ? 'border-b border-border' : ''}>
                  <td className="px-4 py-2 text-md font-medium text-foreground">{row.cls}</td>
                  <td className="px-4 py-2 text-md font-mono text-muted-foreground">{row.range} pts</td>
                  <td className="px-4 py-2 text-md font-mono text-muted-foreground">{row.conf}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <p className="text-lg font-semibold text-foreground">ACMG 2015 Combining Rules (Reference)</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          The original 18 ACMG combining rules are a special case of the Bayesian point system -- every rule produces the same classification under both approaches. They are retained as a reference.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card border border-border rounded-lg p-4 space-y-2">
            <p className="text-md font-medium text-foreground">Pathogenic (8 rules)</p>
            {[
              'P1: 1 Very Strong + >= 1 Strong',
              'P2: 1 Very Strong + >= 2 Moderate',
              'P3: 1 Very Strong + 1 Moderate + 1 Supporting',
              'P4: 1 Very Strong + >= 2 Supporting',
              'P5: >= 2 Strong',
              'P6: 1 Strong + >= 3 Moderate',
              'P7: 1 Strong + 2 Moderate + >= 2 Supporting',
              'P8: 1 Strong + >= 4 Moderate',
            ].map((rule) => (
              <p key={rule} className="text-sm text-muted-foreground font-mono">{rule}</p>
            ))}
          </div>
          <div className="bg-card border border-border rounded-lg p-4 space-y-2">
            <p className="text-md font-medium text-foreground">Likely Pathogenic (6 rules)</p>
            {[
              'LP1: 1 Very Strong + 1 Moderate',
              'LP2: 1 Strong + 1-2 Moderate',
              'LP3: 1 Strong + >= 2 Supporting',
              'LP4: >= 3 Moderate',
              'LP5: 2 Moderate + >= 2 Supporting',
              'LP6: 1 Moderate + >= 4 Supporting',
            ].map((rule) => (
              <p key={rule} className="text-sm text-muted-foreground font-mono">{rule}</p>
            ))}
          </div>
          <div className="bg-card border border-border rounded-lg p-4 space-y-2">
            <p className="text-md font-medium text-foreground">Benign (2 rules)</p>
            <p className="text-sm text-muted-foreground font-mono">B1: 1 Stand-alone (BA1)</p>
            <p className="text-sm text-muted-foreground font-mono">B2: &gt;= 2 Strong benign</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-4 space-y-2">
            <p className="text-md font-medium text-foreground">Likely Benign (2 rules)</p>
            <p className="text-sm text-muted-foreground font-mono">LB1: 1 Strong benign + 1 Supporting benign</p>
            <p className="text-sm text-muted-foreground font-mono">LB2: &gt;= 2 Supporting benign</p>
          </div>
        </div>
      </section>

      <section className="bg-card border border-border rounded-lg p-5 space-y-2">
        <p className="text-base font-medium text-foreground">Why the Point System</p>
        <p className="text-md text-muted-foreground leading-relaxed">
          The original 18 ACMG rules left gaps -- certain evidence combinations had no defined classification. The Bayesian point system fills these gaps while producing identical results for all combinations covered by the original rules. It also handles conflicting evidence more naturally through point summation rather than binary VUS defaults.
        </p>
      </section>
    </div>
  )
}
