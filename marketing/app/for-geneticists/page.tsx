import { Header, Footer } from '@/components'
import Link from 'next/link'
import { RequestDemoButton } from '@/components/marketing/RequestDemoButton'

export const metadata = {
  title: 'For Geneticists | Helix Insight',
  description: 'Helix Insight is built for geneticists -- not instead of them. Evidence gathering in minutes, clinical decisions always yours.',
}

export default function ForGeneticistsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">

        {/* Hero */}
        <section className="pt-28 pb-16 px-6">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-primary">
              Built for Geneticists
            </h1>
            <p className="text-base text-muted-foreground leading-relaxed">
              Not instead of them.
            </p>
          </div>
        </section>

        {/* The work nobody talks about */}
        <section className="py-16 px-6 bg-muted/30">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold text-primary text-center">
              The Work Nobody Talks About
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed text-justify">
              You spent years learning to interpret genetic variants. You understand the clinical nuance behind a VUS that sits right on the edge of pathogenicity. You know when a family history changes everything. You have the instinct to pause on a variant that looks benign on paper but does not fit the clinical picture.
            </p>
            <p className="text-base text-muted-foreground leading-relaxed text-justify">
              And yet, most of your working hours are not spent doing any of that. They are spent copying variant identifiers into ClinVar. Scrolling through gnomAD for population frequencies. Running the same PubMed searches you ran last week for a different patient. Manually mapping ACMG criteria against evidence you already gathered but need to document again. Formatting reports.
            </p>
            <p className="text-base text-muted-foreground leading-relaxed text-justify">
              This is not clinical genetics. This is data entry with a PhD.
            </p>
            <p className="text-base text-muted-foreground leading-relaxed text-justify">
              Helix Insight was built by people who understand that distinction. The system handles the repetitive evidence gathering -- the database lookups, the literature searches, the criteria mapping, the report formatting. Not because these tasks are unimportant, but because they do not require the thing that makes you irreplaceable: your clinical judgment.
            </p>
          </div>
        </section>

        {/* What does not change */}
        <section className="py-16 px-6">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold text-primary text-center">
              What Does Not Change
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed text-justify">
              You still review every variant. You still make the classification decision. You still decide what is clinically actionable for this specific patient with this specific history. You still sign the report. The system does not make diagnostic decisions -- not because it cannot be built to try, but because that is not what clinical genetics needs. Clinical genetics needs your expertise applied to better-prepared evidence. That is what Helix Insight provides.
            </p>
            <p className="text-base text-muted-foreground leading-relaxed text-justify">
              Every ACMG criterion the system applies is traceable. Every literature reference links to its PMID. Every phenotype match shows you exactly which HPO terms contributed to the score. If you disagree with any finding, you override it. The final report carries your name, your interpretation, your professional judgment. The system is the research assistant. You are the geneticist.
            </p>
          </div>
        </section>

        {/* What does change */}
        <section className="py-16 px-6 bg-muted/30">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold text-primary text-center">
              What Does Change
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed text-justify">
              You stop spending hours on evidence gathering that adds no clinical value beyond what the first 15 minutes already gave you. You stop worrying about whether you missed a publication because you did not have time to search one more database. You stop re-doing the same gnomAD lookups for the fifth time this week.
            </p>
            <p className="text-base text-muted-foreground leading-relaxed text-justify">
              Instead, you open a case and the evidence is already there. Sixty data points per variant, pulled from ClinVar, gnomAD, dbNSFP, ClinGen, and millions of PubMed publications. Phenotype correlations computed against the HPO ontology. ACMG criteria pre-mapped with full transparency into why each criterion was applied. Everything organized, everything cited, everything auditable.
            </p>
            <p className="text-base text-muted-foreground leading-relaxed text-justify">
              You spend your time where it matters -- reviewing the evidence, thinking about the case, making decisions that only you can make. The complex cases that used to get rushed because three more were waiting in the queue now get the attention they deserve.
            </p>
          </div>
        </section>

        {/* The question nobody asks out loud */}
        <section className="py-16 px-6">
          <div className="max-w-3xl mx-auto space-y-6">
            <h2 className="text-3xl font-bold text-primary text-center">
              The Question Nobody Asks Out Loud
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed text-justify">
              If a tool can gather evidence in 30 minutes, does the laboratory still need the same number of geneticists?
            </p>
            <p className="text-base text-muted-foreground leading-relaxed text-justify">
              The honest answer: yes, and probably more. The bottleneck in clinical genetics has never been a shortage of tools. It has been a shortage of trained geneticists relative to the volume of cases. Laboratories are not turning away work because evidence gathering is too easy. They are turning away work because there are not enough hours in the day. Faster evidence preparation means each geneticist can review more cases, take on more complex analyses, and spend more time on the clinical interpretation that patients are actually waiting for.
            </p>
            <p className="text-base text-muted-foreground leading-relaxed text-justify">
              This is not about doing the same work with fewer people. It is about doing more work -- better work -- with the people who are already there.
            </p>
          </div>
        </section>

        {/* Closing */}
        <section className="py-16 px-6 bg-muted/30">
          <div className="max-w-3xl mx-auto">
            <div className="bg-card border border-border rounded-lg p-8 text-center space-y-4">
              <p className="text-lg font-semibold text-foreground leading-relaxed">
                The geneticist decides. Helix Insight does the research.
              </p>
              <p className="text-base text-muted-foreground leading-relaxed">
                This is not a slogan. It is how the system is architected. Every pipeline stage produces traceable output. Every classification requires human confirmation. Every report carries your name, not ours.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-6">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl font-bold text-primary">
              See It for Yourself
            </h2>
            <p className="text-base text-muted-foreground">
              Request a demo and see exactly what lands on your desk -- the evidence, the citations, the full audit trail. Then decide if it is useful.
            </p>
            <div className="flex items-center justify-center gap-4">
              <RequestDemoButton />
              <Link
                href="/contact"
                className="px-6 py-3 border border-border text-foreground rounded-md text-base font-medium hover:bg-muted transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  )
}
