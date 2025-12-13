import { Button } from "@/src/components/ui/Button";
import { FileQuestion } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4 text-center">
      <div className="mb-6 rounded-3xl bg-muted p-6">
        <FileQuestion className="h-12 w-12 text-muted-foreground" />
      </div>

      <h2 className="mb-2 text-3xl font-bold tracking-tight text-foreground">
        Page Not Found
      </h2>
      <p className="mb-8 max-w-md text-muted-foreground">
        The page you are looking for might have been removed, had its name
        changed, or is temporarily unavailable.
      </p>

      <Button
        asChild
        size="lg"
        className="rounded-xl shadow-lg shadow-primary/20"
      >
        <Link href="/dashboard">Return to Dashboard</Link>
      </Button>
    </div>
  );
}
