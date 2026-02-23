import Link from 'next/link'

export const metadata = {
  title: 'Glossary | Helix Insight Documentation',
  description: 'Definitions of key terms used throughout the Helix Insight documentation -- ACMG criteria, genomics concepts, and platform-specific terminology.',
}

const terms = [
  { term: 'ACMG', definition: 'American College of Medical Genetics and Genomics. Publisher of the 2015 variant classification guidelines used by Helix Insight.' },
  { term: 'ACMG Secondary Findings (SF)', definition: 'A curated list of 81 genes (v3.2) where pathogenic variants should be reported regardless of the primary testing indication, because early identification can lead to medical interventions.' },
  { term: 'Allele Frequency (AF)', definition: 'The proportion of a specific allele in a population. Used for BA1 (>5%), BS1, and PM2 (<0.01%) criteria. Sourced from gnomAD.' },
  { term: 'AlphaMissense', definition: 'A protein structure-based pathogenicity predictor from DeepMind. Displayed for clinical reference in Helix Insight but does not contribute to ACMG classification.' },
  { term: 'BayesDel_noAF', definition: 'The ClinGen SVI-calibrated computational meta-predictor used by Helix Insight for PP3 and BP4 ACMG criteria. The "_noAF" suffix indicates allele frequency is excluded from its model.' },
  { term: 'Benign', definition: 'ACMG classification indicating the variant is not disease-causing. Requires strong benign evidence (Bayesian points <= -7).' },
  { term: 'BP4', definition: 'ACMG benign supporting criterion: computational evidence suggests no impact on gene or gene product. In Helix Insight, triggered by BayesDel_noAF score <= -0.180.' },
  { term: 'ClinGen', definition: 'Clinical Genome Resource. Provides dosage sensitivity scores and gene-specific ACMG classification specifications (VCEP). Funded by NIH.' },
  { term: 'ClinVar', definition: 'NCBI database of clinical significance assertions for genetic variants. Helix Insight uses ClinVar for PS1, PP5, BP6 criteria and classification override.' },
  { term: 'Compound Heterozygote', definition: 'An individual carrying two different pathogenic variants in the same gene, one on each chromosome. Relevant for autosomal recessive conditions.' },
  { term: 'Confidence Score', definition: 'A continuous score (0.0-1.0) reflecting how far a variant is from the classification boundary. Higher scores indicate more certain classifications.' },
  { term: 'Consequence', definition: 'The predicted effect of a variant on the gene product, determined by Ensembl VEP. Examples: missense_variant, frameshift_variant, splice_donor_variant.' },
  { term: 'DANN', definition: 'Deep Annotation of Noncoding Variants. A deep neural network pathogenicity score applicable to any single nucleotide variant. Displayed for reference.' },
  { term: 'dbNSFP', definition: 'Database for Nonsynonymous SNPs Functional Predictions. Version 4.9c provides BayesDel, SIFT, AlphaMissense, MetaSVM, DANN, PhyloP, and GERP scores.' },
  { term: 'DuckDB', definition: 'An in-process analytical database engine used by Helix Insight for variant storage and querying. Each analysis session uses an isolated DuckDB file.' },
  { term: 'Ensembl VEP', definition: 'Variant Effect Predictor from EMBL-EBI. Determines variant consequences, transcript selection, and functional annotations. Runs locally with offline cache.' },
  { term: 'GERP', definition: 'Genomic Evolutionary Rate Profiling. Measures evolutionary constraint at a genomic position. Scores >4.0 indicate strongly constrained sites.' },
  { term: 'gnomAD', definition: 'Genome Aggregation Database. Version 4.1 provides population allele frequencies from 807,162 individuals across 8 genetic ancestry groups.' },
  { term: 'GRCh38', definition: 'Genome Reference Consortium Human Build 38 (hg38). The current standard human reference genome used by Helix Insight.' },
  { term: 'Haploinsufficiency', definition: 'A condition where loss of one gene copy (one allele) is sufficient to cause disease. ClinGen curates haploinsufficiency scores (0-3).' },
  { term: 'HGVS', definition: 'Human Genome Variation Society nomenclature. Standard notation for describing variants at the genomic (g.), coding DNA (c.), and protein (p.) levels.' },
  { term: 'HPO', definition: 'Human Phenotype Ontology. A standardized vocabulary of over 17,000 phenotypic abnormalities used for phenotype matching and PP4 criteria.' },
  { term: 'Impact', definition: 'VEP-assigned severity category: HIGH (frameshift, stop gained), MODERATE (missense), LOW (synonymous), MODIFIER (intronic, UTR).' },
  { term: 'Likely Benign', definition: 'ACMG classification indicating the variant is probably not disease-causing. Bayesian points between -1 and -6.' },
  { term: 'Likely Pathogenic', definition: 'ACMG classification indicating the variant is probably disease-causing. Bayesian points between 6 and 9.' },
  { term: 'LOEUF', definition: 'Loss-of-function Observed/Expected Upper bound Fraction. Lower values indicate stronger gene constraint. Values < 0.35 are considered highly constrained.' },
  { term: 'MetaSVM', definition: 'A Support Vector Machine meta-predictor combining 10 individual prediction tools. Displayed for clinical reference.' },
  { term: 'Pathogenic', definition: 'ACMG classification indicating the variant is disease-causing. Requires Bayesian points >= 10 or BA1 stand-alone benign override.' },
  { term: 'PhyloP', definition: 'Phylogenetic P-value. Measures evolutionary conservation across 100 vertebrate species. Scores >2.0 indicate conserved positions.' },
  { term: 'pLI', definition: 'Probability of Loss-of-function Intolerance. Ranges 0-1. Values > 0.9 indicate the gene is highly intolerant to loss-of-function variants.' },
  { term: 'PP3', definition: 'ACMG pathogenic supporting criterion: computational evidence supports a deleterious effect. In Helix Insight, triggered by BayesDel_noAF or SpliceAI scores.' },
  { term: 'PVS1', definition: 'ACMG very strong pathogenic criterion: null variant in a gene where loss-of-function is a known mechanism. Requires pLI > 0.9 or LOEUF < 0.35.' },
  { term: 'Screening Tier', definition: 'Priority ranking assigned by the Screening Service. Tier 1 (immediate review), Tier 2 (moderate priority), Tier 3 (low priority), Tier 4 (very low priority).' },
  { term: 'SIFT', definition: 'Sorting Intolerant From Tolerant. Predicts amino acid substitution tolerance based on sequence homology. Scores < 0.05 are Deleterious.' },
  { term: 'SpliceAI', definition: 'A deep learning model predicting splice site disruption. Produces four delta scores. Threshold >= 0.2 triggers PP3_splice in Helix Insight.' },
  { term: 'VCF', definition: 'Variant Call Format. The standard file format for genomic variant data. Helix Insight accepts VCF 4.1 and 4.2 files (plain text or bgzipped).' },
  { term: 'VCEP', definition: 'Variant Curation Expert Panel. ClinGen panels that define gene-specific ACMG classification thresholds.' },
  { term: 'VUS', definition: 'Variant of Uncertain Significance. ACMG classification indicating insufficient evidence to classify as pathogenic or benign. Bayesian points between 0 and 5.' },
  { term: 'WES', definition: 'Whole Exome Sequencing. Captures coding regions of the genome. Typically produces 40,000-60,000 variants per sample.' },
  { term: 'WGS', definition: 'Whole Genome Sequencing. Captures the entire genome. Typically produces 4-5 million variants per sample.' },
]

export default function GlossaryPage() {
  return (
    <div className="py-10 space-y-6">
      <div>
        <p className="text-md text-muted-foreground">
          <Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
          {' / '}
          <span className="text-foreground">Glossary</span>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-primary mt-4">Glossary</h1>
        <p className="text-base text-muted-foreground leading-relaxed mt-3">
          Key terms used throughout the Helix Insight documentation.
        </p>
      </div>

      <section className="space-y-2">
        {terms.map((item) => (
          <div key={item.term} className="bg-card border border-border rounded-lg p-4 space-y-1">
            <p className="text-base font-semibold text-foreground">{item.term}</p>
            <p className="text-md text-muted-foreground leading-relaxed">{item.definition}</p>
          </div>
        ))}
      </section>
    </div>
  )
}
