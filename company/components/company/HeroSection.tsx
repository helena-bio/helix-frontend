import Image from 'next/image'
export function HeroSection() {
  return (
    <section className="flex items-center justify-center px-6 pt-32 pb-20">
      <div className="flex flex-col items-center justify-center space-y-8 max-w-3xl">
        {/* Logo group */}
        <div className="relative">
          {/* Woman logo - absolute left on desktop */}
          <Image
            src="/images/logos/logo_helena_woman.svg"
            alt=""
            width={140}
            height={170}
            className="h-64 w-auto absolute right-full mr-4 top-1/2 -translate-y-1/2 hidden md:block"
            priority
          />
          {/* Centered text stack */}
          <div className="flex flex-col items-center gap-2">
            {/* Mobile only: woman + text side by side */}
            <div className="flex items-center gap-3 md:hidden">
              <Image
                src="/images/logos/logo_helena_woman.svg"
                alt=""
                width={60}
                height={75}
                className="h-16 sm:h-20 w-auto"
                priority
              />
              <Image
                src="/images/logos/logo_helena.svg"
                alt="Helena Bioinformatics"
                width={400}
                height={60}
                className="h-10 sm:h-14 w-auto"
                priority
              />
            </div>
            {/* Desktop only: text logo centered */}
            <Image
              src="/images/logos/logo_helena.svg"
              alt="Helena Bioinformatics"
              width={600}
              height={100}
              className="h-32 w-auto hidden md:block"
              priority
            />
            <p className="text-xl sm:text-2xl md:text-3xl text-foreground font-medium tracking-wide">Intelligence for genomics</p>
          </div>
        </div>
        <p className="text-base md:text-lg text-muted-foreground text-center mt-4">
          Software company integrating artificial intelligence into bioinformatics research and clinical genomics.
        </p>
        <div className="flex items-center gap-3 text-md text-muted-foreground">
          <span>Sofia, Bulgaria</span>
          <span className="text-border">|</span>
          <span>EU Infrastructure</span>
        </div>
      </div>
    </section>
  )
}
