import { useTranslation } from "react-i18next";
import { Gavel, Minus, Plus } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@zeyn/ui/components/card";
import { Label } from "@zeyn/ui/components/label";
import { Switch } from "@zeyn/ui/components/switch";
import { GeneralConfigCard } from "@/features/game/components/create/GeneralConfigCard";
import { DeployPanel } from "@/features/game/components/create/DeployPanel";
import { useLivebuzzerCreateForm } from "./useLivebuzzerCreateForm";

const metaLabel = "text-xs uppercase tracking-widest text-muted-foreground";

function RuleStepper({
  value,
  min,
  max,
  onChange,
  decreaseLabel,
  increaseLabel,
}: {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  decreaseLabel: string;
  increaseLabel: string;
}) {
  return (
    <div className="flex w-fit items-stretch border">
      <button
        type="button"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label={decreaseLabel}
        className="grid size-9 place-content-center border-r text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
      >
        <Minus className="size-3.5" />
      </button>
      <div className="grid w-16 place-content-center font-heading text-base tabular-nums">
        {value}
      </div>
      <button
        type="button"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label={increaseLabel}
        className="grid size-9 place-content-center border-l text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}

const CLOCK_OPTIONS = [0, 10000, 15000, 20000, 30000];

function ClockChips({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-5 border">
      {CLOCK_OPTIONS.map((ms, i) => {
        const active = value === ms;
        return (
          <button
            key={ms}
            type="button"
            onClick={() => onChange(ms)}
            className={`py-2.5 text-xs font-semibold uppercase tracking-wider transition-colors ${
              i > 0 ? "border-l" : ""
            } ${
              active
                ? "bg-brand text-brand-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            {ms === 0
              ? t("games:livebuzzer.create.clockOff")
              : t("games:livebuzzer.create.clockSeconds", { count: ms / 1000 })}
          </button>
        );
      })}
    </div>
  );
}

export function LivebuzzerCreateForm() {
  const { t } = useTranslation();
  const form = useLivebuzzerCreateForm();
  const { values } = form;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <div className="space-y-8">
        <GeneralConfigCard
          name={values.name}
          onNameChange={form.setName}
          maxPlayers={values.maxPlayers}
          onMaxPlayersChange={form.setMaxPlayers}
          isPublic={values.isPublic}
          onIsPublicChange={form.setIsPublic}
          password={values.password}
          onPasswordChange={form.setPassword}
        />

        <Card>
          <CardHeader className="bg-muted/50">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gavel className="size-5 text-brand" />
              {t("games:livebuzzer.create.rulesTitle")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 p-6">
            <div className="grid gap-6 sm:grid-cols-3">
              <div className="space-y-2">
                <Label className={metaLabel}>
                  {t("games:livebuzzer.create.pointsPerCorrect")}
                </Label>
                <RuleStepper
                  value={values.pointsPerCorrect}
                  min={1}
                  max={1000}
                  onChange={form.setPointsPerCorrect}
                  decreaseLabel={t("games:livebuzzer.create.decreasePoints")}
                  increaseLabel={t("games:livebuzzer.create.increasePoints")}
                />
              </div>
              <div className="space-y-2">
                <Label className={metaLabel}>
                  {t("games:livebuzzer.create.penaltyPerWrong")}
                </Label>
                <RuleStepper
                  value={values.penaltyPerWrong}
                  min={0}
                  max={1000}
                  onChange={form.setPenaltyPerWrong}
                  decreaseLabel={t("games:livebuzzer.create.decreasePenalty")}
                  increaseLabel={t("games:livebuzzer.create.increasePenalty")}
                />
              </div>
              <div className="space-y-2">
                <Label className={metaLabel}>
                  {t("games:livebuzzer.create.maxWrongPerRound")}
                </Label>
                <RuleStepper
                  value={values.maxWrongPerRound}
                  min={1}
                  max={20}
                  onChange={form.setMaxWrongPerRound}
                  decreaseLabel={t("games:livebuzzer.create.decreaseMaxWrong")}
                  increaseLabel={t("games:livebuzzer.create.increaseMaxWrong")}
                />
              </div>
            </div>

            <div className="flex items-center justify-between border-t pt-6">
              <div className="space-y-1">
                <Label className={metaLabel}>
                  {t("games:livebuzzer.create.hostPlays")}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {t("games:livebuzzer.create.hostPlaysHint")}
                </p>
              </div>
              <Switch
                checked={values.hostPlays}
                onCheckedChange={form.setHostPlays}
              />
            </div>

            <div className="grid gap-6 border-t pt-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className={metaLabel}>
                  {t("games:livebuzzer.create.buzzWindow")}
                </Label>
                <ClockChips
                  value={values.buzzWindowMs}
                  onChange={form.setBuzzWindowMs}
                />
                <p className="text-[11px] text-muted-foreground">
                  {t("games:livebuzzer.create.buzzWindowHint")}
                </p>
              </div>
              <div className="space-y-2">
                <Label className={metaLabel}>
                  {t("games:livebuzzer.create.answerTime")}
                </Label>
                <ClockChips
                  value={values.answerTimeMs}
                  onChange={form.setAnswerTimeMs}
                />
                <p className="text-[11px] text-muted-foreground">
                  {t("games:livebuzzer.create.answerTimeHint")}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <DeployPanel
        checks={[
          { label: t("game:create.summary.roomNameSet"), done: form.checks.hasName },
          {
            label: values.isPublic
              ? t("game:create.summary.publicRoom")
              : t("game:create.summary.privateRoom"),
            done: true,
          },
        ]}
        canCreate={form.canCreate}
        isCreating={form.isCreating}
        onCreate={form.create}
        note={t("game:create.summary.note")}
      />
    </div>
  );
}
