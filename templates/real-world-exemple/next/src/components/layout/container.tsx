import { cn } from "@lro-ui/utils";
import { Slot } from "@radix-ui/react-slot";
import type React from "react";


type ContainerProps = React.ComponentProps<"div"> & {
  asChild?: boolean;
  maxWidth?: "sm" | "md" | "lg" | "xl";
};


export function Container({ className, asChild, maxWidth = "xl", ref, ...props }: ContainerProps) {
  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      ref={ref}
      className={cn(
        "max-w-xl mx-auto",
        maxWidth === "md" && "md:max-w-180",
        maxWidth === "lg" && "md:max-w-180 lg:max-w-235",
        maxWidth === "xl" && "md:max-w-180 lg:max-w-235 xl:max-w-6xl",
        className)}
      {...props}
    />
  )
}
