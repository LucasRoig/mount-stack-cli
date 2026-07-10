import { cn } from "@lro-ui/utils";
import { Slot } from "@radix-ui/react-slot";

export function Tag({ children, className, asChild }: { children: React.ReactNode; className?: string; asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp className={cn(`text-xs text-muted-foreground-dark border rounded-full px-2 py-1 ml-2`, className)}>
      {children}
    </Comp>
  )
}
