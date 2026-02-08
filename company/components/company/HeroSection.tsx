import Image from 'next/image'
export function HeroSection() {
  return (
    <section className="flex items-center justify-center px-6 pt-32 pb-20">
      <div className="flex flex-col items-center justify-center space-y-8 max-w-3xl">
        <div className="text-center space-y-6">
          <div className="flex items-center justify-center gap-4">
            <Image
              src="/images/logos/logo_helena_woman.svg"
              alt=""
              width={80}
              height={100}
              className="h-24 w-auto"
              priority
            />
            <Image
              src="/images/logos/logo_helena.svg"
              alt="Helena Bioinformatics"
              width={500}
              height={80}
              className="h-20 w-auto"
              priority
            />
          </div>
          <p className="text-xl text-foreground font-medium">Intelligence for genomics.</p>
          <p className="text-lg text-muted-foreground">
            Software company integrating artificial intelligence into bioinformatics research and clinical genomics.
          </p>
        </div>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>Sofia, Bulgaria</span>
          <span className="text-border">|</span>
          <span>EU Infrastructure</span>
        </div>
      </div>
    </section>
  )
}
