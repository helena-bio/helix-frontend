import Link from 'next/link'
import {
  BookOpen, Database, FlaskConical, Layers,
  Activity, Filter, FileText, Shield,
  AlertTriangle, BookMarked, HelpCircle, History, List
} from 'lucide-react'

export const metadata = {
  title: 'Documentation | Helix Insight',
  description: 'Complete documentation for Helix Insight clinical genetics platform. Getting started, classification methodology, reference databases, and clinical workflows.',
}

const sections = [
  {
    title: 'Getting Started',
    description: 'Upload your first VCF file, set patient phenotype, and understand your results.',
    href: '/docs/getting-started',
    icon: BookOpen,
  },
  {
    title: 'Classification',
    description: 'ACMG/AMP framework, 28 evidence criteria, combining rules, and ClinVar integration.',
    href: '/docs/classification',
    icon: FlaskConical,
  },
  {
    title: 'Computational Predictors',
    description: 'BayesDel, SpliceAI, SIFT, AlphaMissense, and conservation scores used in PP3/BP4.',
    href: '/docs/predictors',
    icon: Activity,
  },
  {
    title: 'Reference Databases',
    description: 'gnomAD, ClinVar, dbNSFP, HPO, ClinGen, and Ensembl VEP. Versions and update policy.',
    href: '/docs/databases',
    icon: Database,
  },
  {
    title: 'Phenotype Matching',
    description: 'HPO-based semantic similarity, clinical tier assignment, and score interpretation.',
    href: '/docs/phenotype-matching',
    icon: Layers,
  },
  {
    title: 'Screening',
    description: 'Multi-dimensional variant prioritization, tier system, and clinical screening modes.',
    href: '/docs/screening',
    icon: Filter,
  },
  {
    title: 'Literature Evidence',
    description: 'Local PubMed database, relevance scoring, and evidence strength mapping to ACMG.',
    href: '/docs/literature',
    icon: FileText,
  },
  {
    title: 'AI Clinical Assistant',
    description: 'Natural language queries, clinical interpretation, and report generation.',
    href: '/docs/ai-assistant',
    icon: BookMarked,
  },
  {
    title: 'Data and Privacy',
    description: 'EU infrastructure, GDPR compliance, data retention, and zero external API calls.',
    href: '/docs/data-and-privacy',
    icon: Shield,
  },
  {
    title: 'Limitations',
    description: 'What the platform cannot do. Honest documentation for clinical trust.',
    href: '/docs/limitations',
    icon: AlertTriangle,
  },
  {
    title: 'Glossary',
    description: 'Quick reference for genetics and platform terminology.',
    href: '/docs/glossary',
    icon: List,
  },
  {
    title: 'FAQ',
    description: 'Common questions from laboratory directors and clinical geneticists.',
    href: '/docs/faq',
    icon: HelpCircle,
  },
  {
    title: 'Changelog',
    description: 'Versioned history of all methodology and database changes.',
    href: '/docs/changelog',
    icon: History,
  },
]

export default function DocsPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-12">
      {/* Hero */}
      <section className="space-y-4">
        <h1 className="text-3xl font-semibold tracking-tight text-primary">
          Documentation
        </h1>
        <p className="text-base text-muted-foreground leading-relaxed max-w-2xl">
          Complete documentation for the Helix Insight clinical genetics platform. Every threshold, database version, and classification rule used in production is documented here. This documentation is intended for clinical geneticists, laboratory directors, accreditation auditors, and bioinformaticians.
        </p>
        <p className="text-base text-muted-foreground leading-relaxed max-w-2xl">
          For the full classification methodology with all criteria thresholds and combining rules, see the dedicated <Link href="/methodology" className="text-primary hover:underline font-medium">Methodology</Link> page.
        </p>
      </section>

      {/* Section grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className="bg-card border border-border rounded-lg p-5 space-y-2 hover:border-primary/30 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <section.icon className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
              <p className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                {section.title}
              </p>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {section.description}
            </p>
          </Link>
        ))}
      </section>

      {/* Principles */}
      <section className="bg-card border border-border rounded-lg p-6 space-y-3">
        <p className="text-lg font-semibold text-foreground">Documentation Principles</p>
        <p className="text-base text-muted-foreground leading-relaxed">
          This documentation provides full transparency on what Helix Insight does and how it makes classification decisions. Every database version is specified, every threshold is documented with its exact value, and every limitation is acknowledged. The platform is a clinical decision support tool -- the reviewing geneticist always has the final word.
        </p>
      </section>
    </div>
  )
}
