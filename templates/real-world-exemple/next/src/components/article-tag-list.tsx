import { cn } from "@lro-ui/utils";
import { Tag } from "./tag";

export function ArticleTagsList(props: { tags: string[]; className?: string }) {
  console.log(props.tags)
  if (props.tags.length === 0) {
    return null;
  }
  return (
    <div className={cn("flex items-center flex-wrap gap-y-2", props.className)}>
      {props.tags.map((tag) => (
        <Tag key={tag}>
          {tag}
        </Tag>
      ))}
    </div>
  );
}
