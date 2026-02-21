export function MissionSection() {
  return (
    <section className="py-12 px-6 bg-muted/30">
      <div className="max-w-3xl mx-auto space-y-8">
        <h2 className="text-3xl font-semibold text-primary text-center">What We Do</h2>
        <p className="text-base text-muted-foreground leading-relaxed">
          We build software at the intersection of artificial intelligence and bioinformatics. Our work focuses on how genomic data is processed, interpreted, and acted upon -- in both clinical and research settings.
        </p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Genomics generates data at a scale that existing analytical tools were not designed for. We develop AI-native platforms purpose-built for the complexity, precision, and regulatory standards that genomic science demands.
        </p>
        <p className="text-base text-muted-foreground leading-relaxed">
          Every product we ship runs on dedicated EU infrastructure, follows GDPR-native architecture, and is designed to augment human expertise -- not replace it.
        </p>
      </div>
    </section>
  )
}
