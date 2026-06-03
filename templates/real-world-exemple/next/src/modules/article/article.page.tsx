import { Avatar, AvatarFallback, AvatarImage } from "@lro-ui/avatar";
import { isDefinedError } from "@orpc/client";
import { match } from "ts-pattern";
import { NotFound } from "@/components/error-pages/not-found";
import { UnexpectedError } from "@/components/error-pages/unexpected-error";
import { Container } from "@/components/layout/container";
import { getServerSideORPCClient } from "@/lib/orpc/orpc-server-side-client";
import { AddToFavoritesButton, FollowAuthorButton, RemoveFromFavoritesButton, UnfollowAuthorButton } from "./article-buttons";

export async function ArticlePage(props: PageProps<"/article/[id]">) {
  const { id } = await props.params;

  const [error, article] = await (await getServerSideORPCClient()).findArticleById(id);
  if (error) {
    if (isDefinedError(error)) {
      return match(error)
        .with({ code: "NOT_FOUND" }, () => <NotFound />)
        .exhaustive();
    } else {
      return <UnexpectedError />;
    }
  }
  const initials = article.author.name.slice(0, 2).toUpperCase();
  return (
    <div>
      <div className="p-8 border-b">
        <Container>
          <h1 className="text-4xl font-semibold">{article.title}</h1>
          <div className="flex mt-8">
            <Avatar className="size-8">
              <AvatarImage src="/default-avatar.svg" alt="user-avatar" />
              <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex flex-col ml-2">
              <span className="text-sm font-medium text-foreground">{article.author.name}</span>
              <span className="text-xs text-muted-foreground">{article.createdAt.toLocaleString()}</span>
            </div>
            {article.author.isFollowedByCurrentUser ?
              <UnfollowAuthorButton className="ml-6 self-end" authorName={article.author.name} authorId={article.author.id} /> :
              <FollowAuthorButton className="ml-6 self-end" authorName={article.author.name} authorId={article.author.id} />
            }
            {article.isLikedByCurrentUser ?
              <RemoveFromFavoritesButton className="ml-2 self-end" articleId={article.id} /> :
              <AddToFavoritesButton className="ml-2 self-end" articleId={article.id} />
            }
          </div>
        </Container>
      </div>
    </div>
  );
}

