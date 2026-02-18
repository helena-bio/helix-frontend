import { Header, Footer } from '@/components'
import Link from 'next/link'
import { RequestDemoButton } from '@/components/marketing/RequestDemoButton'
import {
  Microscope, Clock, BrainCircuit, Stethoscope,
  Database, BookOpen, GitCompare, FileCheck,
  ShieldCheck, UserCheck, MessageSquare, HeartPulse,
  Lightbulb, TrendingUp, Users, Layers
} from 'lucide-react'

export const metadata = {
  title: 'For Geneticists | Helix Insight',
  description: 'Helix Insight amplifies your clinical expertise. Evidence gathering in minutes, so you can focus on what only you can do -- clinical interpretation.',
}

const helixDoes = [
  { icon: Database, text: 'Cross-references ClinVar, gnomAD, dbNSFP, and ClinGen in seconds' },
  { icon: BookOpen, text: 'Searches millions of PubMed publications for relevant literature' },
  { icon: GitCompare, text: 'Maps ACMG/AMP criteria against variant evidence systematically' },
  { icon: Layers, text: 'Matches patient phenotype (HPO) against gene-disease profiles' },
  { icon: FileCheck, text: 'Formats structured reports with full evidence attribution' },
  { icon: Clock, text: 'Completes evidence preparation in minutes, not days' },
]

const geneticistDoes = [
  { icon: BrainCircuit, text: 'Applies clinical judgment that no algorithm can replicate' },
  { icon: Stethoscope, text: 'Integrates patient history, family context, and clinical presentation' },
  { icon: Microscope, text: 'Evaluates edge cases where guidelines require expert interpretation' },
  { icon: UserCheck, text: 'Makes the final classification decision on every variant' },
  { icon: MessageSquare, text: 'Communicates findings to patients and referring physicians' },
  { icon: HeartPulse, text: 'Determines clinical actionability and management recommendations' },
]

const neverDoes = [
  'Make a diagnostic decision',
  'Override your clinical judgment',
  'Classify a variant without your confirmation',
  'Replace the context only you have about your patient',
  'Communicate results to patients or clinicians',
  'Determine treatment or management plans',
]

const amplifies = [
  {
    icon: Lightbulb,
    title: 'Deeper Evidence Access',
    description: 'Every variant is annotated with 60+ data points from established databases. Literature search covers millions of publications with pre-extracted gene and variant mentions. You see more evidence than manual search could surface in a day.',
  },
  {
    icon: TrendingUp,
    title: 'Consistent, Reproducible Workflow',
    description: 'The same variant gets the same evidence package every time -- no missed databases, no overlooked publications. Your clinical interpretation is built on a complete, standardized foundation rather than what time permitted.',
  },
  {
    icon: Users,
    title: 'More Time for Complex Cases',
    description: 'When routine evidence gathering takes minutes instead of hours, you have time for the cases that actually need your expertise -- rare variants, conflicting evidence, novel gene-disease associations, and challenging phenotypes.',
  },
  {
    icon: ShieldCheck,
    title: 'Full Audit Trail',
    description: 'Every database queried, every criterion applied, every publication cited is documented. When you sign a report, you can trace exactly where each piece of evidence came from. Your professional reputation is backed by complete transparency.',
  },
]

export default function ForGeneticistsPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">

        {/* Hero with Video */}
        <section className="pt-28 pb-16 px-6">
          <div className="max-w-3xl mx-auto text-center space-y-8">
            <h1 className="text-3xl font-bold tracking-tight text-primary">
              Your Expertise Is Irreplaceable. Your Time Is Not.
            </h1>
            <div className="w-full aspect-video bg-muted/30 border border-border rounded-lg overflow-hidden shadow-lg">
              <video
                className="w-full h-full object-cover"
                controls
                preload="metadata"
                poster=""
              >
                <source src="/video/Build_for_the_geneticists.mp4" type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            </div>
            <div className="space-y-4">
              <p className="text-base text-muted-foreground leading-relaxed">
                Interpreting genetic variants requires years of specialized training, deep clinical knowledge, and the kind of judgment that cannot be automated. What can be automated is the hours spent cross-referencing databases, searching literature, and compiling evidence before your interpretation begins.
              </p>
              <p className="text-base text-muted-foreground leading-relaxed">
                Helix Insight handles the evidence gathering. You do what only you can do.
              </p>
            </div>
          </div>
        </section>

        {/* The Real Bottleneck */}
        <section className="py-16 px-6 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 space-y-3">
              <h2 className="text-3xl font-bold text-primary">
                The Real Bottleneck
              </h2>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                Clinical variant interpretation is not slow because geneticists think slowly. It is slow because evidence gathering is manual, repetitive, and time-consuming.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-lg p-8 space-y-6">
                <div className="text-center">
                  <p className="text-lg font-semibold text-foreground">Without Helix Insight</p>
                  <p className="text-md text-muted-foreground">Per case, typical workflow</p>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-base text-muted-foreground">ClinVar lookup per variant</span>
                    <span className="text-base font-medium text-foreground">~2 hours</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-base text-muted-foreground">PubMed literature search</span>
                    <span className="text-base font-medium text-foreground">~3 hours</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-base text-muted-foreground">gnomAD frequency checks</span>
                    <span className="text-base font-medium text-foreground">~1 hour</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-base text-muted-foreground">ACMG criteria mapping</span>
                    <span className="text-base font-medium text-foreground">~2 hours</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-base text-muted-foreground">Report compilation</span>
                    <span className="text-base font-medium text-foreground">~1 hour</span>
                  </div>
                  <div className="flex justify-between items-center pt-3">
                    <span className="text-base font-semibold text-foreground">Total evidence gathering</span>
                    <span className="text-base font-bold text-foreground">5 -- 10 days</span>
                  </div>
                </div>
              </div>

              <div className="bg-card border-2 border-primary/30 rounded-lg p-8 space-y-6">
                <div className="text-center">
                  <p className="text-lg font-semibold text-foreground">With Helix Insight</p>
                  <p className="text-md text-muted-foreground">Same case, same rigor</p>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-base text-muted-foreground">Automated evidence gathering</span>
                    <span className="text-base font-medium text-primary">~30 minutes</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-base text-muted-foreground">Your clinical review</span>
                    <span className="text-base font-medium text-foreground">30 -- 60 minutes</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-border">
                    <span className="text-base text-muted-foreground">Your interpretation</span>
                    <span className="text-base font-medium text-foreground">Your expertise</span>
                  </div>
                  <div className="flex justify-between items-center pt-3">
                    <span className="text-base font-semibold text-foreground">Total time to report</span>
                    <span className="text-base font-bold text-primary">Under 2 hours</span>
                  </div>
                </div>
                <p className="text-md text-muted-foreground text-center pt-2">
                  Same evidence. Same standards. Your clinical judgment throughout.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Side by Side: What Each Does */}
        <section className="py-16 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12 space-y-3">
              <h2 className="text-3xl font-bold text-primary">
                Clear Division of Responsibility
              </h2>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                Helix Insight is a tool, not a colleague. It has a clearly defined scope -- and everything outside that scope is yours.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Helix Column */}
              <div className="space-y-4">
                <div className="bg-muted/50 rounded-lg px-6 py-3 text-center">
                  <p className="text-lg font-semibold text-foreground">What Helix Insight Does</p>
                  <p className="text-md text-muted-foreground">Automated evidence gathering</p>
                </div>
                <div className="space-y-3">
                  {helixDoes.map((item) => {
                    const Icon = item.icon
                    return (
                      <div key={item.text} className="flex items-start gap-3 bg-card border border-border rounded-lg p-4">
                        <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <p className="text-base text-muted-foreground leading-relaxed">{item.text}</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Geneticist Column */}
              <div className="space-y-4">
                <div className="bg-primary/10 rounded-lg px-6 py-3 text-center">
                  <p className="text-lg font-semibold text-foreground">What You Do</p>
                  <p className="text-md text-primary">Clinical expertise that cannot be automated</p>
                </div>
                <div className="space-y-3">
                  {geneticistDoes.map((item) => {
                    const Icon = item.icon
                    return (
                      <div key={item.text} className="flex items-start gap-3 bg-card border border-border rounded-lg p-4">
                        <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <p className="text-base text-muted-foreground leading-relaxed">{item.text}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Your Expertise Amplified */}
        <section className="py-16 px-6 bg-muted/30">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12 space-y-3">
              <h2 className="text-3xl font-bold text-primary">
                Your Expertise, Amplified
              </h2>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                Helix Insight does not make geneticists faster by cutting corners. It makes them faster by removing the bottleneck that has nothing to do with clinical skill.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {amplifies.map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.title} className="bg-card border border-border rounded-lg p-8 space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                        <Icon className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1 space-y-2">
                        <h3 className="text-lg font-semibold text-foreground">
                          {item.title}
                        </h3>
                        <p className="text-base text-muted-foreground leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* What Helix Insight Never Does */}
        <section className="py-16 px-6">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-12 space-y-3">
              <h2 className="text-3xl font-bold text-primary">
                What Always Stays in Your Hands
              </h2>
              <p className="text-base text-muted-foreground max-w-2xl mx-auto">
                These are not limitations of the software. These are design decisions. Clinical genetics requires human judgment, and Helix Insight is built to respect that.
              </p>
            </div>

            <div className="bg-card border border-border rounded-lg p-8">
              <p className="text-lg font-semibold text-foreground mb-6">Helix Insight will never:</p>
              <div className="space-y-4">
                {neverDoes.map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <div className="w-6 h-6 border-2 border-primary/30 rounded flex items-center justify-center shrink-0 mt-0.5">
                      <div className="w-2 h-2 bg-primary rounded-full" />
                    </div>
                    <p className="text-base text-muted-foreground leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 pt-6 border-t border-border">
                <p className="text-base text-foreground font-medium text-center leading-relaxed">
                  The geneticist decides. Helix Insight does the research.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 px-6 bg-muted/30">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl font-bold text-primary">
              See How It Supports Your Workflow
            </h2>
            <p className="text-base text-muted-foreground">
              Request a demo to see Helix Insight process a real case -- and see exactly what lands on your desk for review.
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
