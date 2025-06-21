import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Moon, Sun } from "lucide-react";

export default function Header({
  darkMode,
  onToggleDarkMode,
}: {
  darkMode: boolean;
  onToggleDarkMode: () => void;
}) {
  return (
    <Card
      id="header"
      className="h-[10vh] border-b bg-card text-card-foreground rounded-none shadow-none"
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="h-30 w-30" />
          <h1 className="text-2xl font-bold tracking-tight">
            Unit Cloud Gen - TCC João Vitor Santana Depollo
          </h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleDarkMode}
          className="rounded-full hover:bg-muted transition-colors"
        >
          {darkMode ? (
            <Sun className="h-5 w-5 text-primary" />
          ) : (
            <Moon className="h-5 w-5 text-primary" />
          )}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>
    </Card>
  );
}
