export function TeamSection() {
  return (
    <section className="py-16 px-6 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 space-y-4">
          <h2 className="text-3xl font-bold text-primary">Leadership</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Engineering and clinical genetics expertise driving clinical-grade AI infrastructure.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 max-w-3xl mx-auto">
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
              Founded Helena Bioinformatics to address a bottleneck that costs lives through delay. Clinical genetics laboratories spend days on variant interpretation that technology should handle in minutes -- every hour of manual classification is an hour a patient waits for answers.
            </p>
            <p className="text-base text-muted-foreground leading-relaxed">
              Helix Insight is built on that urgency. The mission: give every genetics laboratory, regardless of size, access to the interpretation infrastructure that was previously available only to the largest institutions.
            </p>
          </div>

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
              Corresponding Member of the Bulgarian Academy of Sciences. Over 40 years of scientific and clinical experience in human genetics and genomics. Former Head of the Department of Medical Genetics at the Medical University of Sofia and Director of the National Genomic Center for Socially Significant Diseases.
            </p>
            <p className="text-base text-muted-foreground leading-relaxed">
              Author of 300+ scientific publications and 14 monographs. National Consultant in Medical Genetics at the Bulgarian Ministry of Health. President of the Bulgarian Society of Human Genetics and Genomics. Member of the ESHG Scientific Program Committee and the ECA European Council.
            </p>
            <p className="text-base text-muted-foreground leading-relaxed">
              Specialized at Oxford, London, Naples, and the Tokyo Human Genome Center. Supervisor of 40 doctoral candidates across clinical and molecular genetics.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
