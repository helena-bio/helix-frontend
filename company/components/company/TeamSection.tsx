export function TeamSection() {
  return (
    <section className="py-16 px-6 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-3xl font-bold text-primary">
            Leadership
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-8 max-w-3xl mx-auto">
          {/* Founder */}
          <div className="bg-card border border-border rounded-lg p-8 space-y-5">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center shrink-0">
                <span className="text-xl font-bold text-muted-foreground">VM</span>
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-foreground">Vladimir Mitev</h3>
                <p className="text-base text-primary font-medium">Founder &amp; CEO</p>
              </div>
            </div>
            <p className="text-base text-muted-foreground leading-relaxed">
              Founded Helena Bioinformatics to solve a problem that costs lives through delay: geneticists spending days on variant interpretation that technology should handle in minutes. Every hour a laboratory spends on manual classification is an hour a patient waits for answers.
            </p>
            <p className="text-base text-muted-foreground leading-relaxed">
              Helix Insight is built on that urgency -- engineering infrastructure where clinical accuracy and speed are not trade-offs, but requirements. The mission is straightforward: give every genetics laboratory, regardless of size, access to interpretation tools that were previously only available to the largest institutions.
            </p>
          </div>

          {/* Chief Scientific Advisor */}
          <div className="bg-card border border-border rounded-lg p-8 space-y-5">
            <div className="flex items-start gap-5">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center shrink-0">
                <span className="text-2xl font-bold text-muted-foreground">DT</span>
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold text-foreground">Acad. Prof. Draga Toncheva, MD, DSc</h3>
                <p className="text-base text-primary font-medium">Chief Scientific Advisor</p>
              </div>
            </div>
            <p className="text-base text-muted-foreground leading-relaxed">
              Academician of the Bulgarian Academy of Sciences and one of the foremost authorities in medical genetics in Southeast Europe. Over 40 years of scientific and clinical experience in human genetics and genomics.
            </p>
            <p className="text-base text-muted-foreground leading-relaxed">
              Former Head of the Department of Medical Genetics at the Medical University of Sofia and Director of the National Genomic Center for Socially Significant Diseases. Author of 300+ scientific publications, 14 monographs, and supervisor of 40 doctoral candidates. National Consultant in Medical Genetics at the Bulgarian Ministry of Health.
            </p>
            <p className="text-base text-muted-foreground leading-relaxed">
              President of the Bulgarian Society of Human Genetics and Genomics. Member of the European Society of Human Genetics (ESHG) Scientific Program Committee and the European Cytogeneticists Association (ECA) European Council. Specialized at institutions including Oxford, London, Naples, and the Tokyo Human Genome Center.
            </p>
            <p className="text-sm text-muted-foreground">
              Nominated for the Order of Saints Cyril and Methodius -- the highest state distinction for contributions to science and education in Bulgaria (2026).
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
