import { Avatar, AvatarFallback, AvatarImage } from "@lro-ui/avatar";
import { cn } from "@lro-ui/utils";
import { isDefinedError } from "@orpc/client";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { match } from "ts-pattern";
import { ArticleTagsList } from "@/components/article-tag-list";
import { NotFound } from "@/components/error-pages/not-found";
import { UnexpectedError } from "@/components/error-pages/unexpected-error";
import { Container } from "@/components/layout/container";
import { getServerSideORPCClient } from "@/lib/orpc/orpc-server-side-client";
import { Routes } from "@/routes";
import {
  AddToFavoritesButton,
  FollowAuthorButton,
  RemoveFromFavoritesButton,
  UnfollowAuthorButton,
} from "./article-buttons";

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
  return (
    <div>
      <div className="p-8 border-b">
        <Container>
          <h1 className="text-4xl font-semibold">{article.title}</h1>
          <AuthorBanner
            className="mt-8"
            authorId={article.author.id}
            authorName={article.author.name}
            articleId={article.id}
            creationDate={article.createdAt}
            isFollowedByCurrentUser={article.author.isFollowedByCurrentUser}
            isLikedByCurrentUser={article.isLikedByCurrentUser}
            countLikes={article.countLikes}
          />
        </Container>
      </div>
      <div className="mt-6 border-b">
        <Container>
          <article className="prose">
            <ReactMarkdown>{article.body}</ReactMarkdown>
          </article>
          <ArticleTagsList tags={article.tags.map((tag) => tag.name)} className="mt-8 mb-8" />
        </Container>
      </div>
      <div className="mt-6">
        <Container>
          <AuthorBanner
            className="justify-center"
            authorId={article.author.id}
            authorName={article.author.name}
            articleId={article.id}
            creationDate={article.createdAt}
            isFollowedByCurrentUser={article.author.isFollowedByCurrentUser}
            isLikedByCurrentUser={article.isLikedByCurrentUser}
            countLikes={article.countLikes}
          />
          <CommentSection className="mt-12" />
        </Container>
      </div>
    </div>
  );
}

function CommentSection({ className }: { className?: string }) {
  return (
    <div className={className}>
      <p>
        <Link href={Routes.auth.signIn}>Sign in</Link> or <Link href={Routes.auth.signUp}>Sign up</Link> to add comments
        on this article.
      </p>
      <div className="h-48 bg-amber-400">
        TODO: implement comment section with nested comments and pagination. For now, this is just a placeholder.
      </div>
    </div>
  );
}

function AuthorBanner(props: {
  className?: string;
  authorName: string;
  authorId: string;
  articleId: string;
  creationDate: Date;
  isFollowedByCurrentUser: boolean;
  isLikedByCurrentUser: boolean;
  countLikes: number;
}) {
  const initials = props.authorName.slice(0, 2).toUpperCase();
  return (
    <div className={cn("flex items-center", props.className)}>
      <Avatar className="size-8">
        <AvatarImage src="/default-avatar.svg" alt="user-avatar" />
        <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">{initials}</AvatarFallback>
      </Avatar>
      <div className="flex flex-col ml-2">
        <span className="text-sm font-medium text-foreground">{props.authorName}</span>
        <span className="text-xs text-muted-foreground">{props.creationDate.toLocaleString()}</span>
      </div>
      {props.isFollowedByCurrentUser ? (
        <UnfollowAuthorButton className="ml-6 self-end" authorName={props.authorName} authorId={props.authorId} />
      ) : (
        <FollowAuthorButton className="ml-6 self-end" authorName={props.authorName} authorId={props.authorId} />
      )}
      {props.isLikedByCurrentUser ? (
        <RemoveFromFavoritesButton
          className="ml-2 self-end"
          articleId={props.articleId}
          countFavorites={props.countLikes}
        />
      ) : (
        <AddToFavoritesButton className="ml-2 self-end" articleId={props.articleId} countFavorites={props.countLikes} />
      )}
    </div>
  );
}
