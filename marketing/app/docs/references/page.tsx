import Link from 'next/link'

export const metadata = {
  title: 'References | Helix Insight Documentation',
  description: 'Scientific publications and standards cited in the Helix Insight documentation.',
}

const references = [
  {
    category: 'ACMG Classification',
    papers: [
      { authors: 'Richards S, Aziz N, Bale S, et al.', title: 'Standards and guidelines for the interpretation of sequence variants: a joint consensus recommendation of the American College of Medical Genetics and Genomics and the Association for Molecular Pathology.', journal: 'Genet Med', year: 2015, volume: '17(5):405-424', pmid: '25741868' },
      { authors: 'Tavtigian SV, Greenblatt MS, Harrison SM, et al.', title: 'Modeling the ACMG/AMP variant classification guidelines as a Bayesian classification framework.', journal: 'Genet Med', year: 2018, volume: '20(9):1054-1060', pmid: '29300386' },
      { authors: 'Tavtigian SV, Harrison SM, Boucher KM, Biesecker LG.', title: 'Fitting a naturally scaled point system to the ACMG/AMP variant classification guidelines.', journal: 'Hum Mutat', year: 2020, volume: '41(11):1734-1737', pmid: '32720330' },
    ],
  },
  {
    category: 'Computational Predictors',
    papers: [
      { authors: 'Pejaver V, Byrne AB, Feng BJ, et al.', title: 'Calibration of computational tools for missense variant pathogenicity classification and ClinGen recommendations for PP3/BP4 criteria.', journal: 'Am J Hum Genet', year: 2022, volume: '109(12):2163-2177', pmid: '36413997' },
      { authors: 'Jaganathan K, Kyriazopoulou Panagiotopoulou S, McRae JF, et al.', title: 'Predicting splicing from primary sequence with deep learning.', journal: 'Cell', year: 2019, volume: '176(3):535-548', pmid: '30661751' },
      { authors: 'Walker LC, Hoya M, Wiggins GAR, et al.', title: 'Using the ClinGen/ACMG/AMP framework to assess splicing impact of sequence variants.', journal: 'Hum Mutat', year: 2023, volume: '44:1-12', pmid: '36864581' },
      { authors: 'Cheng J, Novati G, Pan J, et al.', title: 'Accurate proteome-wide missense variant effect prediction with AlphaMissense.', journal: 'Science', year: 2023, volume: '381(6664):eadg7492', pmid: '37733863' },
      { authors: 'Quang D, Chen Y, Xie X.', title: 'DANN: a deep learning approach for annotating the pathogenicity of genetic variants.', journal: 'Bioinformatics', year: 2015, volume: '31(5):761-763', pmid: '25338716' },
    ],
  },
  {
    category: 'Population Databases',
    papers: [
      { authors: 'Chen S, Francioli LC, Goodrich JK, et al.', title: 'A genomic mutational constraint map using variation in 76,156 human genomes.', journal: 'Nature', year: 2024, volume: '625:92-100', pmid: '38057664' },
      { authors: 'Karczewski KJ, Francioli LC, Tiao G, et al.', title: 'The mutational constraint spectrum quantified from variation in 141,456 humans.', journal: 'Nature', year: 2020, volume: '581:434-443', pmid: '32461654' },
      { authors: 'Landrum MJ, Lee JM, Benson M, et al.', title: 'ClinVar: improving access to variant interpretations and supporting evidence.', journal: 'Nucleic Acids Res', year: 2018, volume: '46(D1):D1062-D1067', pmid: '29165669' },
    ],
  },
  {
    category: 'Annotation Tools',
    papers: [
      { authors: 'McLaren W, Gil L, Hunt SE, et al.', title: 'The Ensembl Variant Effect Predictor.', journal: 'Genome Biol', year: 2016, volume: '17:122', pmid: '27268795' },
      { authors: 'Liu X, Li C, Mou C, et al.', title: 'dbNSFP v4: a comprehensive database of transcript-specific functional predictions and annotations for human nonsynonymous and splice-site SNVs.', journal: 'Genome Med', year: 2020, volume: '12:103', pmid: '33261662' },
    ],
  },
  {
    category: 'Phenotype Ontology',
    papers: [
      { authors: 'Kohler S, Gargano M, Matentzoglu N, et al.', title: 'The Human Phenotype Ontology in 2024: phenotypes around the world.', journal: 'Nucleic Acids Res', year: 2024, volume: '52(D1):D1333-D1346', pmid: '37953324' },
      { authors: 'Lin D.', title: 'An information-theoretic definition of similarity.', journal: 'Proc 15th Int Conf Machine Learning', year: 1998, volume: 'pp. 296-304', pmid: '' },
    ],
  },
  {
    category: 'Clinical Genetics Resources',
    papers: [
      { authors: 'Rehm HL, Berg JS, Brooks LD, et al.', title: 'ClinGen -- the Clinical Genome Resource.', journal: 'N Engl J Med', year: 2015, volume: '372:2235-2242', pmid: '26014595' },
      { authors: 'Stenton SL, Kremer LS, Gusic M, et al.', title: 'Systematic application of computational variant interpretation tools for germline variant classification.', journal: 'Am J Hum Genet', year: 2024, volume: '111:1-15', pmid: '38552641' },
    ],
  },
]

export default function ReferencesPage() {
  return (
    <div className="py-10 space-y-6">
      <div>
        <p className="text-md text-muted-foreground">
          <Link href="/docs" className="hover:text-primary transition-colors">Documentation</Link>
          {' / '}
          <span className="text-foreground">References</span>
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-primary mt-4">References</h1>
        <p className="text-base text-muted-foreground leading-relaxed mt-3">
          Scientific publications and standards cited throughout the Helix Insight documentation.
        </p>
      </div>

      {references.map((group) => (
        <section key={group.category} className="space-y-3">
          <p className="text-lg font-semibold text-foreground">{group.category}</p>
          <div className="space-y-2">
            {group.papers.map((paper, i) => (
              <div key={i} className="bg-card border border-border rounded-lg p-4 space-y-1">
                <p className="text-md text-muted-foreground leading-relaxed">
                  {paper.authors} &quot;{paper.title}&quot; <span className="italic">{paper.journal}</span>. {paper.year};{paper.volume}.
                  {paper.pmid && (
                    <>
                      {' '}
                      <a href={`https://pubmed.ncbi.nlm.nih.gov/${paper.pmid}/`} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">PMID: {paper.pmid}</a>
                    </>
                  )}
                </p>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}
