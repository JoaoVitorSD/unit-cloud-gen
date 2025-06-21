import { Card } from "@/components/ui/card";
import { Separator } from "@radix-ui/react-separator";
import { Moon, Sun } from "lucide-react";
import { Button } from "./ui/button";

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
      className="h-[10vh] border-b flex justify-center text-card-foreground rounded-none shadow-none"
    >
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Logo" className="h-20 h-20" />
          <h1 className="text-2xl font-bold tracking-tight">Unit Cloud Gen</h1>
          <Separator orientation="vertical" className="h-10" />
          <span className="text-sm text-muted-foreground">
            An AI-powered unit test generator and coverage analyzer
          </span>
        </div>
        <Button variant="ghost" size="icon" className="mr-4" onClick={onToggleDarkMode}>
          {darkMode ? (
            <Sun className="h-5 w-5 text-primary" />
          ) : (
            <Moon className="h-5 w-5 text-primary" />
          )}
        </Button>
      </div>
    </Card>
  );
}
