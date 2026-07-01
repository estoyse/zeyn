import { Button } from "@shaxsiy-oyin/ui/components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@shaxsiy-oyin/ui/components/card";
import { XCircle } from "lucide-react";

interface NotFoundViewProps {
  onBack: () => void;
}

export function NotFoundView({ onBack }: NotFoundViewProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto flex size-16 items-center justify-center bg-destructive/10 rounded-lg">
            <XCircle className="size-10 text-destructive" />
          </div>
          <CardTitle>Room Not Found</CardTitle>
          <CardDescription>
            This room doesn't exist or has been removed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onBack} className="w-full">
            Back to Dashboard
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
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full text-center">
        <CardHeader className="space-y-4">
          <div className="mx-auto flex size-16 items-center justify-center bg-destructive/10 rounded-lg">
            <XCircle className="size-10 text-destructive" />
          </div>
          <CardTitle className="text-destructive">Connection Failed</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onRetry} className="w-full">
            Retry Connection
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}