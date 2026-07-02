import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@shaxsiy-oyin/ui/components/button";
import { Input } from "@shaxsiy-oyin/ui/components/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@shaxsiy-oyin/ui/components/card";
import { LockKeyhole } from "lucide-react";

interface PasswordPromptViewProps {
  onJoin: (password: string) => void;
  onBack: () => void;
}

export function PasswordPromptView({ onJoin, onBack }: PasswordPromptViewProps) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setError("Please enter the room password.");
      return;
    }
    onJoin(password);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto flex size-16 items-center justify-center bg-brand/10 text-brand">
            <LockKeyhole className="size-10" />
          </div>
          <CardTitle>Private Room</CardTitle>
          <CardDescription>
            This room requires a password to join.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Enter room password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
              />
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onBack} className="flex-1">
                Back
              </Button>
              <Button type="submit" variant="brand" className="flex-1">
                Join Room
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}