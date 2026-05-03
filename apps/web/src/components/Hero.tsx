export function Hero() {
  return (
    <div className='max-w-6xl mx-auto px-6 py-20 md:py-32'>
      <div className='max-w-4xl mx-auto text-center space-y-8'>
        <div className='inline-block'>
          <div className='px-3 py-1 border border-accent/30 bg-accent/5 text-accent text-xs tracking-wide uppercase rounded'>
            Premium onlayn o'yinlar
          </div>
        </div>

        <h1 className='text-5xl md:text-7xl lg:text-8xl tracking-tight font-heading'>
          Eng yaxshi o'yinlar tajribasi
        </h1>

        <p className='text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed font-sans'>
          257+ professional o'yinlar, turnirlar va jamoa bilan birgalikda
          o'yinlar dunyosida yangi tajriba. Real vaqtda raqobat va yuqori
          sifatli o'yinlar.
        </p>

        <div className='flex flex-col sm:flex-row items-center justify-center gap-4 pt-4'>
          <button className='px-6 py-3 bg-black text-white rounded hover:bg-black/80 transition-all'>
            Boshlash
          </button>
          <button className='px-6 py-3 border border-black rounded hover:bg-black hover:text-white transition-all'>
            Qanday ishlaydi
          </button>
        </div>

        <p className='text-sm text-muted-foreground pt-4'>
          Claude Code va AI bilan ishlaydigan o'yinlar
        </p>
      </div>
    </div>
  );
}
