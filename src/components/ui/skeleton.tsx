import { cn } from "@/lib/utils"

function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "bg-accent motion-safe:animate-pulse motion-reduce:animate-none rounded-md",
        className,
      )}
      {...props}
    />
  )
}

export { Skeleton }
