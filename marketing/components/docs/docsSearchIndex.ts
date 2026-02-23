/**
 * Docs search index.
 * Each entry has: href, title, section (parent), and content (searchable text).
 * Content includes headings, key terms, and representative sentences.
 * Extend this file when adding new docs pages.
 */

export interface SearchEntry {
  href: string
  title: string
  section: string
  content: string
}

export const docsSearchIndex: SearchEntry[] = [
  // Getting Started
  {
    href: '/docs/getting-started',
    title: 'Getting Started',
    section: 'Getting Started',
    content: 'VCF file upload pipeline six stages parsing quality filtering annotation reference database enrichment ACMG classification export gene panels WES WGS processing time maximum sensitivity no pre-filtering',
  },
  {
    href: '/docs/getting-started/uploading-vcf',
    title: 'Uploading a VCF File',
    section: 'Getting Started',
    content: 'VCF 4.1 4.2 plain text bgzipped vcf.gz whole genome sequencing GRCh38 hg38 GRCh37 hg19 automatic liftover single sample bcftools trio analysis chromosomes chr1 chr22 chrX chrY chrM decoys contigs data handling EU infrastructure Helsinki Finland deleted after processing',
  },
  {
    href: '/docs/getting-started/setting-hpo-terms',
    title: 'Setting HPO Terms',
    section: 'Getting Started',
    content: 'Human Phenotype Ontology HPO standardized clinical vocabulary phenotypic abnormalities PP4 criterion phenotype matching screening prioritization seizure neurodevelopmental cardiology nephrology metabolic neonatal autocomplete free-text clinical description negation detection five to fifteen terms',
  },
  {
    href: '/docs/getting-started/understanding-results',
    title: 'Understanding Results',
    section: 'Getting Started',
    content: 'gene-centric view variant annotations ACMG classification criteria confidence score consequence impact HGVS notation genotype heterozygous homozygous population frequency gnomAD ClinVar significance computational predictors SpliceAI gene constraint pLI LOEUF phenotype match score screening tier literature evidence Tier 1 shortlist',
  },
  {
    href: '/docs/getting-started/quality-presets',
    title: 'Quality Presets',
    section: 'Getting Started',
    content: 'quality filtering strict balanced permissive QUAL depth DP genotype quality GQ thresholds 30 20 10 ClinVar rescue mechanism pathogenic likely pathogenic rescued variants Sanger sequencing confirmation low coverage',
  },
  // Classification
  {
    href: '/docs/classification',
    title: 'Classification',
    section: 'Classification',
    content: 'ACMG AMP 2015 guidelines Bayesian point-based framework Tavtigian ClinGen SVI Pejaver Walker evidence-based classification priority order BA1 stand-alone conflict check ClinVar override Bayesian point system pathogenic likely pathogenic VUS likely benign benign',
  },
  {
    href: '/docs/classification/acmg-framework',
    title: 'ACMG Framework',
    section: 'Classification',
    content: 'ACMG AMP 2015 Richards Genetics in Medicine international standard 28 evidence criteria strength levels very strong strong moderate supporting stand-alone pathogenic benign 19 automated 9 manual Bayesian Tavtigian BayesDel ClinGen SVI computational predictor PP3 BP4 VCEP gene-specific specifications expert panel',
  },
  {
    href: '/docs/classification/criteria-reference',
    title: 'Criteria Reference',
    section: 'Classification',
    content: 'PVS1 null variant loss-of-function frameshift stop_gained splice pLI LOEUF PS1 same amino acid ClinVar pathogenic PS2 de novo PS3 functional studies PS4 prevalence PM1 functional domain Pfam PM2 absent controls gnomAD frequency 0.0001 PM3 trans compound heterozygote PM4 protein length PM5 disabled PM6 de novo PP1 cosegregation PP2 missense constraint PP3 BayesDel SpliceAI PP4 phenotype HPO PP5 reputable source BA1 frequency 5% BS1 BS2 homozygote BS3 BS4 BP1 missense truncating BP2 trans dominant BP3 in-frame repetitive BP4 BayesDel BP5 alternate BP6 benign BP7 synonymous splice',
  },
  {
    href: '/docs/classification/combining-rules',
    title: 'Combining Rules',
    section: 'Classification',
    content: 'Bayesian point system Tavtigian 2018 2020 very strong +8 strong +4 moderate +2 supporting +1 benign strong -4 supporting -1 BA1 override pathogenic 10 points likely pathogenic 6-9 VUS 0-5 likely benign -1 to -5 benign -6 original 18 ACMG combining rules mathematically equivalent',
  },
  {
    href: '/docs/classification/clinvar-integration',
    title: 'ClinVar Integration',
    section: 'Classification',
    content: 'ClinVar evidence criteria PS1 PP5 BP6 classification override quality filter rescue review stars 0 1 2 3 4 single submitter expert panel practice guideline conflicting computational evidence BA1 overrides ClinVar VUS does not override transparency criteria string version 2025-01',
  },
  {
    href: '/docs/classification/conflicting-evidence',
    title: 'Conflicting Evidence',
    section: 'Classification',
    content: 'conflicting evidence pathogenic benign criteria two-level approach high-confidence conflict safety check strong very strong manual review Bayesian point summation net total BA1 exception false positives clinical safety invasive procedures cascade testing',
  },
  {
    href: '/docs/classification/confidence-scores',
    title: 'Confidence Scores',
    section: 'Classification',
    content: 'confidence score continuous Bayesian point distance classification boundary 0.80-0.99 pathogenic 0.70-0.90 likely pathogenic 0.30-0.60 VUS reclassification additional evidence functional studies family segregation probability disease causation phenotype inheritance clinical context',
  },
  // Computational Predictors
  {
    href: '/docs/predictors',
    title: 'Computational Predictors',
    section: 'Computational Predictors',
    content: 'computational predictors PP3 BP4 ACMG criteria BayesDel noAF ClinGen SVI calibrated classification tool SpliceAI splice impact SIFT AlphaMissense MetaSVM DANN PhyloP GERP displayed reference clinical context evidence strength modulation strong moderate supporting Pejaver 2022 circular reasoning allele frequency',
  },
  {
    href: '/docs/predictors/spliceai',
    title: 'SpliceAI',
    section: 'Computational Predictors',
    content: 'SpliceAI deep learning mRNA splicing Illumina Jaganathan 2019 delta scores acceptor gain acceptor loss donor gain donor loss DS_AG DS_AL DS_DG DS_DL PP3_splice supporting pathogenic threshold 0.2 BP4 guard BP7 guard PVS1 double-counting ClinGen SVI 2023 Walker precomputed MANE transcript Ensembl Release 113 RT-PCR minigene assay splice disruption intronic',
  },
  {
    href: '/docs/predictors/sift',
    title: 'SIFT',
    section: 'Computational Predictors',
    content: 'SIFT Sorting Intolerant From Tolerant amino acid substitution sequence homology conservation protein function deleterious tolerated score 0.05 threshold displayed clinical reference not ACMG classification BayesDel missense gain-of-function',
  },
  {
    href: '/docs/predictors/alphamissense',
    title: 'AlphaMissense',
    section: 'Computational Predictors',
    content: 'AlphaMissense Google DeepMind AlphaFold protein structure pathogenicity prediction Cheng 2023 Science three-dimensional structural information missense variants pathogenic benign ambiguous displayed clinical reference not ACMG classification BayesDel benchmark ClinVar validation',
  },
  {
    href: '/docs/predictors/metasvm',
    title: 'MetaSVM',
    section: 'Computational Predictors',
    content: 'MetaSVM meta-predictor ensemble Support Vector Machine SVM 10 individual predictors consensus score deleterious tolerated positive negative displayed clinical reference not ACMG classification BayesDel Dong 2015',
  },
  {
    href: '/docs/predictors/dann',
    title: 'DANN',
    section: 'Computational Predictors',
    content: 'DANN deep neural network pathogenicity genomic annotations CADD single nucleotide variant coding non-coding intronic UTR score 0.95 damaging 0.5 ambiguous benign displayed clinical reference not ACMG classification BayesDel Quang 2015',
  },
  {
    href: '/docs/predictors/conservation-scores',
    title: 'Conservation Scores',
    section: 'Computational Predictors',
    content: 'PhyloP 100-way vertebrate evolutionary conservation phylogenetic purifying selection GERP genomic evolutionary rate profiling constraint rejected substitutions conserved position functional importance displayed clinical reference not ACMG classification BayesDel',
  },
  {
    href: '/docs/predictors/consensus-calculation',
    title: 'Consensus Calculation',
    section: 'Computational Predictors',
    content: 'BayesDel noAF ClinGen SVI calibrated PP3 BP4 evidence strength modulation Pejaver 2022 missense path splice path SpliceAI PP3_Strong 0.518 PP3_Moderate 0.290 PP3_Supporting 0.130 BP4_Moderate -0.361 BP4_Supporting -0.180 PM1 PP3 point-sum cap 4 points Bayesian indeterminate zone Stenton 2024 evidence yield double-counting circular reasoning allele frequency',
  },
  // Reference Databases
  {
    href: '/docs/databases',
    title: 'Reference Databases',
    section: 'Reference Databases',
    content: 'reference databases annotation pipeline eight databases zero external API calls local storage EU infrastructure Helsinki Finland no variant data sent externally database versions fixed per deployment validation testing gnomAD ClinVar dbNSFP SpliceAI gnomAD Constraint HPO ClinGen Ensembl VEP annotation phases positional match gene symbol',
  },
  {
    href: '/docs/databases/gnomad',
    title: 'gnomAD',
    section: 'Reference Databases',
    content: 'gnomAD Genome Aggregation Database v4.1 population allele frequency 807162 individuals 759 million variants 8 ancestry groups global_af global_ac global_an global_hom af_grpmax popmax BA1 5% BS1 BS2 homozygote count 15 PM2 0.0001 absent controls African European East Asian South Asian Finnish Ashkenazi Jewish Middle Eastern Broad Institute GRCh38 Chen 2024',
  },
  {
    href: '/docs/databases/clinvar',
    title: 'ClinVar',
    section: 'Reference Databases',
    content: 'ClinVar clinical significance NCBI 2025-01 4.1 million variants pathogenic likely pathogenic benign VUS review stars 0 1 2 3 4 expert panel practice guideline PS1 PP5 BP6 classification override quality filter rescue pathogenic rescue clinical_significance review_status review_stars disease_name clinvar_variation_id submitter agreement conflicting hgvsp Landrum 2020',
  },
  {
    href: '/docs/databases/dbnsfp',
    title: 'dbNSFP',
    section: 'Reference Databases',
    content: 'dbNSFP 4.9c functional predictions 80.6 million variant sites 434 fields 9 loaded SIFT AlphaMissense MetaSVM DANN BayesDel noAF PhyloP GERP conservation scores sift_pred sift_score alphamissense_pred alphamissense_score metasvm_pred dann_score phylop100way_vertebrate gerp_rs duplicate variant handling 701000 aggregation missense non-synonymous Liu 2020',
  },
  {
    href: '/docs/databases/hpo',
    title: 'HPO',
    section: 'Reference Databases',
    content: 'HPO Human Phenotype Ontology gene-phenotype associations 320000 associations Monarch Initiative Jackson Laboratory hpo_ids hpo_names hpo_count hpo_frequency_data hpo_disease_ids hpo_gene_id PP4 criterion phenotype matching screening prioritization deduplication semantic similarity clinical tiers gene symbol joined Kohler 2024',
  },
  {
    href: '/docs/databases/clingen',
    title: 'ClinGen',
    section: 'Reference Databases',
    content: 'ClinGen Clinical Genome Resource dosage sensitivity haploinsufficiency triplosensitivity 1600 genes NIH BS1 frequency threshold autosomal dominant recessive BP2 compound heterozygote score 0 1 2 3 30 40 dosage sensitivity unlikely gene-level inheritance proxy haploinsufficiency_score triplosensitivity_score Rehm 2015',
  },
  {
    href: '/docs/databases/ensembl-vep',
    title: 'Ensembl VEP',
    section: 'Reference Databases',
    content: 'Ensembl VEP Variant Effect Predictor Release 113 GRCh38 consequence annotation transcript selection local offline cache no external API calls parallel 48 workers gene_symbol transcript_id hgvs_genomic hgvs_cdna hgvs_protein consequence impact biotype exon_number domains HIGH MODERATE LOW MODIFIER frameshift missense synonymous PVS1 PM1 PM4 BP1 BP3 BP7 McLaren 2016 EMBL-EBI',
  },
  {
    href: '/docs/databases/spliceai-precomputed',
    title: 'SpliceAI Precomputed',
    section: 'Reference Databases',
    content: 'SpliceAI precomputed splice impact scores Illumina MANE R113 Ensembl four delta scores DS_AG DS_AL DS_DG DS_DL acceptor gain acceptor loss donor gain donor loss max_score PP3_splice threshold 0.2 BP7 guard BP4 guard PVS1 double-counting guard ClinGen SVI 2023 Walker cryptic splice site Jaganathan 2019 Cell',
  },
  {
    href: '/docs/databases/database-update-policy',
    title: 'Database Update Policy',
    section: 'Reference Databases',
    content: 'database update policy versioning validation regression testing reference cohort classification delta report atomic updates reproducible gnomAD major release ClinVar quarterly dbNSFP major release HPO quarterly ClinGen quarterly Ensembl VEP annual SpliceAI Ensembl release schema compatibility record count verification deployment approval existing analyses not retroactively changed',
  },
  // Phenotype Matching
  {
    href: '/docs/phenotype-matching',
    title: 'Phenotype Matching',
    section: 'Phenotype Matching',
    content: 'phenotype matching genotype-phenotype correlation patient HPO terms gene phenotype associations semantic similarity score 0-100 clinical tiers five-tier system prioritization BRCA1 epilepsy SCN1A gene-level deduplication 130x reduction WES WGS parallel processing incidental findings actionable',
  },
  {
    href: '/docs/phenotype-matching/hpo-overview',
    title: 'HPO Overview',
    section: 'Phenotype Matching',
    content: 'HPO Human Phenotype Ontology standardized vocabulary phenotypic abnormalities directed acyclic graph hierarchy 17000 terms 320000 gene-phenotype associations 8000 rare diseases OMIM Orphanet hpo.jax.org Monarch Initiative Jackson Laboratory seizure epilepsy specificity information content PP4 criterion autocomplete text extraction Kohler 2024',
  },
  {
    href: '/docs/phenotype-matching/semantic-similarity',
    title: 'Semantic Similarity',
    section: 'Phenotype Matching',
    content: 'semantic similarity Lin similarity information content IC MICA most informative common ancestor Resnik similarity OMIM disease annotations best-match average normalized score 0-100 0.5 threshold significant match worked example SCN1A seizure febrile intellectual disability developmental delay set comparison pyhpo ontology Lin 1998',
  },
  {
    href: '/docs/phenotype-matching/clinical-tiers',
    title: 'Clinical Tiers',
    section: 'Phenotype Matching',
    content: 'clinical tiers five-tier system Tier 1 Actionable Tier 2 Potentially Actionable IF Incidental Finding Tier 3 Uncertain Tier 4 Unlikely phenotype relevance pathogenic likely pathogenic VUS benign score structure base score fine score 80 60 40 20 0 phenotype 40% ACMG 30% frequency 30% tier assignment rules gnomAD AF rare common population frequency scoring',
  },
  {
    href: '/docs/phenotype-matching/interpreting-scores',
    title: 'Interpreting Scores',
    section: 'Phenotype Matching',
    content: 'interpreting scores phenotype match score 0-100 excellent good moderate weak poor 80 60 40 20 individual term matches significant 0.5 threshold HPO term specificity gene annotation completeness atypical presentations under-annotated genes broad terms misleading scores prioritization guide clinical judgment Tier 1 Tier 2 review',
  },
  {
    href: '/docs/phenotype-matching/hpo-term-selection-guide',
    title: 'HPO Term Selection Guide',
    section: 'Phenotype Matching',
    content: 'HPO term selection guide specific comprehensive negative findings 5-15 terms optimal neurodevelopmental seizure type developmental milestones MRI EEG cardiology cardiomyopathy arrhythmia ECG nephrology renal cysts proteinuria metabolic enzyme activity neonatal newborn screening autocomplete free-text extraction negation iterative refinement common mistakes chief complaint parent terms',
  },
  // Screening
  {
    href: '/docs/screening',
    title: 'Screening',
    section: 'Screening',
    content: 'screening variant prioritization multi-dimensional scoring clinical relevance tiered shortlist 50-200 variants to 3-20 candidates Tier 1 patient demographics age sex ethnicity family history transparent score breakdowns seven dimensions gene constraint deleteriousness phenotype dosage consequence compound heterozygote age-appropriate ACMG boosts',
  },
  {
    href: '/docs/screening/scoring-components',
    title: 'Scoring Components',
    section: 'Screening',
    content: 'scoring components seven dimensions gene constraint pLI LOEUF computational deleteriousness BayesDel SpliceAI DANN phenotype relevance HPO match dosage sensitivity ClinGen haploinsufficiency consequence severity frameshift missense splice compound heterozygote candidate age-appropriate gene prioritization neonatal pediatric adult weight normalization',
  },
  {
    href: '/docs/screening/tier-system',
    title: 'Tier System',
    section: 'Screening',
    content: 'tier system four tiers priority ranking Tier 1 critical review Tier 2 recommended review Tier 3 optional review Tier 4 low priority clinical actionability pathogenic likely pathogenic VUS phenotype boost ACMG class boost compound het boost ethnicity-specific frequency ClinVar override Sanger confirmation',
  },
  {
    href: '/docs/screening/screening-modes',
    title: 'Screening Modes',
    section: 'Screening',
    content: 'screening modes diagnostic neonatal pediatric proactive adult carrier pharmacogenomics weight profiles different emphasis NICU rapid results neurodevelopmental genes de novo candidates phenotype correlation actionable genes recessive carrier population-specific frequencies',
  },
  {
    href: '/docs/screening/age-aware-prioritization',
    title: 'Age-Aware Prioritization',
    section: 'Screening',
    content: 'age-aware prioritization patient age neonatal 0-28 days infant pediatric adult elderly curated gene lists KCNQ2 neonatal epilepsy age-appropriate scoring weight adjustment gene relevance adult-onset deprioritized in neonatal reference data not diagnostic',
  },
  // Literature Evidence
  {
    href: '/docs/literature',
    title: 'Literature Evidence',
    section: 'Literature Evidence',
    content: 'literature evidence PubMed local database 2-3 million publications 35 million filtered MeSH descriptors genetics relevance clinical search variant interpretation gene variant phenotype ranked results evidence strength ACMG criteria local no external queries EU infrastructure daily updates under 500 milliseconds',
  },
  {
    href: '/docs/literature/literature-evidence',
    title: 'Literature Evidence',
    section: 'Literature Evidence',
    content: 'literature evidence gene mentions variant mentions phenotype associations extracted entities HGVS notation protein-coding gene validation three-layer blacklist indexed gene lookup full-text search merged deduplicated enriched relevance scoring publication metadata abstract DOI PubMed Central functional study evidence advisory not diagnostic',
  },
  {
    href: '/docs/literature/relevance-scoring',
    title: 'Relevance Scoring',
    section: 'Literature Evidence',
    content: 'relevance scoring six-component weighted system 0.0 to 1.0 phenotype 30% publication type 20% gene centrality 15% functional data 15% variant match 10% recency 10% case report clinical trial research review morphological matching stemming NLTK SnowballStemmer gene mention frequency parallel scoring 16 workers 500 milliseconds',
  },
  {
    href: '/docs/literature/evidence-strength',
    title: 'Evidence Strength',
    section: 'Literature Evidence',
    content: 'evidence strength ACMG-aligned categories Strong exact variant functional data PS3 PP3 Moderate exact variant OR functional PM-level Supporting gene phenotype match PP4 PP5 Weak gene mentioned only background reference functional study detection MeSH descriptor animal model zebrafish mouse knockout cell line variant matching HGVS cDNA protein legacy notation clinical judgment',
  },
  {
    href: '/docs/literature/pubmed-coverage',
    title: 'PubMed Coverage',
    section: 'Literature Evidence',
    content: 'PubMed coverage NCBI FTP 35 million articles 2-3 million genetics-relevant 7-8% filter pass rate 1990 present daily updates MeSH descriptors Mutation Polymorphism Genetic Variation Exome Sequencing Whole Genome Sequencing GWAS Pharmacogenetics excluded editorials letters news errata comments retracted preprints bioRxiv medRxiv gene validation protein-coding blue-green deployment',
  },
  // Data and Privacy
  {
    href: '/docs/data-and-privacy',
    title: 'Data and Privacy',
    section: 'Data and Privacy',
    content: 'data privacy genomic data GDPR special category Article 9 EU infrastructure Helsinki Finland dedicated hardware zero external calls data minimization pseudonymized transparent retention controller processor DPA DPIA privacy policy data processing agreement data protection impact assessment compliance documents',
  },
  {
    href: '/docs/data-and-privacy/infrastructure',
    title: 'Infrastructure',
    section: 'Data and Privacy',
    content: 'infrastructure dedicated hardware Helsinki Finland EU bare-metal server physical isolation jurisdiction certainty no US jurisdiction CLOUD Act FISA European hosting provider EU law TLS 1.3 AES-256 encryption firewall RBAC audit logging no multi-tenant cloud genomics workloads NVMe storage',
  },
  {
    href: '/docs/data-and-privacy/gdpr-compliance',
    title: 'GDPR Compliance',
    section: 'Data and Privacy',
    content: 'GDPR compliance Article 9 special category genetic data controller processor laboratory Helena Bioinformatics DPA Article 28 legal basis explicit consent Article 9(2)(a) healthcare provision Article 9(2)(h) data subject rights access rectification erasure restriction portability objection DPIA Article 35 international transfers EEA privacy@helena.bio',
  },
  {
    href: '/docs/data-and-privacy/data-retention',
    title: 'Data Retention',
    section: 'Data and Privacy',
    content: 'data retention VCF files deleted after processing analysis results service agreement clinical profile HPO demographics session metadata audit trail account data 30 days usage data 12 months automatic deletion on-demand deletion Article 17 erasure termination deletion certified FASTQ BAM not accepted intermediate files temporary',
  },
  {
    href: '/docs/data-and-privacy/no-external-calls',
    title: 'No External Calls',
    section: 'Data and Privacy',
    content: 'no external calls zero outbound network variant processing Ensembl VEP local offline cache gnomAD local ClinVar local dbNSFP local HPO pyhpo local ClinGen local SpliceAI precomputed local literature database local PubMed mirror network architecture inbound only no outbound processing separate update channel no data leakage no third-party dependency verifiable firewall Docker AI assistant optional anonymized',
  },
]
