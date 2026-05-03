export function Terminal() {
  return (
    <div className='max-w-6xl mx-auto px-6 py-12'>
      <div className='bg-[#1a1a1a] rounded-lg overflow-hidden shadow-2xl'>
        <div className='px-4 py-3 border-b border-white/10 text-xs text-white/60'>
          Terminal — shaxsiy-oyin
        </div>
        <div className='p-6 font-mono text-sm'>
          <div className='text-white/80'>
            <span className='text-white/60'>$</span> claude
          </div>
          <div className='text-accent mt-2'>
            {">"} /shaxsiy-oyin-join "eng yaxshi turnir"
          </div>
          <div className='text-white/60 mt-4 space-y-1'>
            <div>Shaxsiy O'yinni qidirish (257+ o'yinlar)...</div>
            <div>23 jamoa va 1.2K+ o'yinchilar topildi</div>
            <div>12 yangi turnirlarni yuklanmoqda...</div>
          </div>
          <div className='text-green-500 mt-4 space-y-1'>
            <div>✓ Hisobot .shaxsiy-oyin/turnir/report.md ga saqlandi</div>
            <div>✓ 12 yangi o'yinlar references/ ga saqlandi</div>
            <div>✓ Brauzerda HTML hisobot ochildi</div>
          </div>
        </div>
      </div>
    </div>
  );
}
