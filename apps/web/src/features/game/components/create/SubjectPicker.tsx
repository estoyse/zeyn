import { motion } from "framer-motion";
import { Zap, CheckCircle2 } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@zeyn/ui/components/card";
import { Badge } from "@zeyn/ui/components/badge";
import { Skeleton } from "@zeyn/ui/components/skeleton";
import { useTranslation } from "react-i18next";
import { roomLimits } from "@zeyn/api/game-types";

interface Subject {
  id: string;
  name: string;
}

interface SubjectPickerProps {
  subjects: Subject[];
  isLoading: boolean;
  selectedIds: string[];
  onToggle: (id: string) => void;
}

export function SubjectPicker({
  subjects,
  isLoading,
  selectedIds,
  onToggle,
}: SubjectPickerProps) {
  const { t } = useTranslation();
  const belowMin = selectedIds.length < roomLimits.minSubjects;

  return (
    <Card>
      <CardHeader className='bg-muted/50'>
        <CardTitle className='text-lg flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Zap className='size-5 text-brand' />
            {t("game:create.subject.selectSubjects")}
          </div>
          <Badge tone={belowMin ? "destructive" : "brand"}>
            {t("game:create.subject.selected", { count: selectedIds.length, max: roomLimits.maxSubjects })}
          </Badge>
        </CardTitle>
        <CardDescription>
          {t("game:create.subject.chooseRange", { min: roomLimits.minSubjects, max: roomLimits.maxSubjects })}
        </CardDescription>
      </CardHeader>
      <CardContent className='p-6'>
        {isLoading ? (
          <div className='grid grid-cols-2 md:grid-cols-3 gap-4'>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className='h-20 rounded-none' />
            ))}
          </div>
        ) : (
          <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
            {subjects.map(s => {
              const selected = selectedIds.includes(s.id);
              return (
                <button
                  key={s.id}
                  onClick={() => onToggle(s.id)}
                  className={`relative p-4 text-left border transition-all active:scale-[0.98] overflow-hidden group ${
                    selected
                      ? "border-brand bg-brand/10"
                      : "border-border hover:border-brand/50 bg-card"
                  }`}
                >
                  <div className='relative z-10 space-y-1'>
                    <p className='font-bold truncate'>{s.name}</p>
                    <p className='text-[10px] text-muted-foreground uppercase tracking-widest'>
                      {t("game:create.subject.category")}
                    </p>
                  </div>
                  {selected && (
                    <motion.div
                      layoutId='check'
                      className='absolute top-2 right-2 text-brand'
                    >
                      <CheckCircle2 className='size-4' />
                    </motion.div>
                  )}
                  <div
                    className={`absolute bottom-0 left-0 h-1 transition-all ${
                      selected
                        ? "w-full bg-brand"
                        : "w-0 bg-brand/20 group-hover:w-full"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
