import { cn } from "@lro-ui/utils";

export function ArticleTagsList(props: { tags: string[]; className?: string }) {
  if (props.tags.length === 0) {
    return null;
  }
  return (
    <div className={cn("flex items-center", props.className)}>
      {props.tags.map((tag) => (
        <span key={tag} className="text-xs text-muted-foreground-dark border rounded-full px-2 py-1 ml-2">
          {tag}
        </span>
      ))}
    </div>
  );
}
