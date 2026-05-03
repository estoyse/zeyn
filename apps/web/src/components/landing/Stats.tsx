export function Stats() {
  const stats = [
    { value: "257+", label: "O'yinlar" },
    { value: "50K+", label: "O'yinchilar" },
    { value: "500+", label: "Turnirlar" },
    { value: "24/7", label: "Qo'llab-quvvatlash" },
  ];

  return (
    <div className='border-t border-black/10'>
      <div className='max-w-7xl mx-auto px-6 py-16'>
        <div className='grid grid-cols-2 md:grid-cols-4 gap-8'>
          {stats.map((stat, index) => (
            <div key={index} className='text-center space-y-2'>
              <div className='text-3xl md:text-4xl'>{stat.value}</div>
              <div className='text-sm text-muted-foreground'>{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
