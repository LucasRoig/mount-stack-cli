import { cn } from "@lro-ui/utils";
import { Container } from "@/components/layout/container";

export function HomePage(_props: PageProps<"/">) {
  return (
    <div>
      <Hero />
      <Container className="flex gap-8 flex-wrap">
        <Feed className="grow min-w-[350px]" />
        <Tags className="w-1/4 min-w-[200px]" />
      </Container>
    </div>
  );
}

function Hero() {
  return (
    <div className="border-b p-8 mb-8">
      <Container className="text-center">
        <h1 className="text-6xl mb-4">Conduit</h1>
        <p className="text-muted-foreground">A place to share your knowledge</p>
      </Container>
    </div>
  );
}

function Feed({ className }: { className?: string }) {
  return <div className={cn("bg-red-300", className)}>Feed</div>;
}

function Tags({ className }: { className?: string }) {
  return <div className={cn(" border-l pl-4", className)}>
    <div className="bg-cyan-300">
      Tags
    </div>
  </div>;
}
