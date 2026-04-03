import { cn } from "@lro-ui/utils";
import { Slot } from "@radix-ui/react-slot";
import type React from "react";


type ContainerProps = React.ComponentProps<"div"> & {
  asChild?: boolean;
};
export function Container({ className, asChild, ref, ...props }: ContainerProps) {
  const Comp = asChild ? Slot : "div";
  return (
    <Comp
      ref={ref}
      className={cn("max-w-xl md:max-w-180 lg:max-w-235 xl:max-w-6xl mx-auto", className)}
      {...props}
    />
  )
}
