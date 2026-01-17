import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-background to-muted">
      <div className="mx-auto max-w-3xl px-4 text-center">
        <h1 className="text-5xl font-bold tracking-tight mb-4">
          DemandRadar
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Discover untapped market opportunities with AI-powered gap analysis
        </p>
        <div className="flex gap-4 justify-center">
          <Button asChild size="lg">
            <Link href="/signup">Get Started</Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/login">Sign In</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
