import { Button } from "@zeyn/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@zeyn/ui/components/card";
import { XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

interface NotFoundViewProps {
  onBack: () => void;
}

export function NotFoundView({ onBack }: NotFoundViewProps) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto flex size-16 items-center justify-center bg-destructive/10 text-destructive">
            <XCircle className="size-10" />
          </div>
          <CardTitle>{t("game:errors.notFound.title")}</CardTitle>
          <CardDescription>
            {t("game:errors.notFound.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onBack} variant="brand" className="w-full">
            {t("game:errors.notFound.backToDashboard")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

interface ConnectionErrorViewProps {
  error: string;
  onRetry: () => void;
}

export function ConnectionErrorView({ error, onRetry }: ConnectionErrorViewProps) {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto flex size-16 items-center justify-center bg-destructive/10 text-destructive">
            <XCircle className="size-10" />
          </div>
          <CardTitle className="text-destructive">{t("game:errors.connection.title")}</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onRetry} variant="brand" className="w-full">
            {t("game:errors.connection.retry")}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}