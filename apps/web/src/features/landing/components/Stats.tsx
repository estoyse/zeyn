import { Card, CardContent } from "@shaxsiy-oyin/ui/components/card";

export function Stats() {
  const stats = [
    { value: "257+", label: "Active Games" },
    { value: "50K+", label: "Players" },
    { value: "500+", label: "Tournaments" },
    { value: "24/7", label: "Support" },
  ];

  return (
    <div className="border-t">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <Card key={index} className="border-0 shadow-none">
              <CardContent className="text-center space-y-2 p-0">
                <div className="text-3xl md:text-4xl font-bold">{stat.value}</div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">
                  {stat.label}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}