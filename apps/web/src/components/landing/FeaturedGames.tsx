export function FeaturedGames() {
  const features = [
    {
      title: "Turnirlar",
      description:
        "Kunlik va haftalik turnirlar. Real vaqtda raqobat va yuqori mukofotlar.",
    },
    {
      title: "Professional jamoalar",
      description:
        "Eng yaxshi o'yinchilar bilan birgalikda o'ynang va yangi ko'nikmalar o'rganing.",
    },
    {
      title: "Live streaming",
      description:
        "O'yinlaringizni jonli efirda ko'rsating va katta auditoriya bilan ulashing.",
    },
  ];

  return (
    <div className='max-w-7xl mx-auto px-6 py-20'>
      <div className='grid md:grid-cols-3 gap-8'>
        {features.map((feature, index) => (
          <div key={index} className='space-y-3'>
            <h3 className='text-xl'>{feature.title}</h3>
            <p className='text-muted-foreground leading-relaxed'>
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
