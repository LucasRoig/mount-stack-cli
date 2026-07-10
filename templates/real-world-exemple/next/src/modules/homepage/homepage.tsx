import { Avatar, AvatarFallback, AvatarImage } from "@lro-ui/avatar";
import { cn } from "@lro-ui/utils";
import Link from "next/link";
import { ArticleTagsList } from "@/components/article-tag-list";
import { Container } from "@/components/layout/container";
import { Tag } from "@/components/tag";
import { getServerSideORPCClient } from "@/lib/orpc/orpc-server-side-client";
import { Routes } from "@/routes";
import { SmallAddToFavoritesButton, SmallRemoveFromFavoritesButton } from "./homepage-buttons";

export async function HomePage(_props: PageProps<"/">) {
  const client = await getServerSideORPCClient();
  const [error, workerMessage] = await client.helloWorker({ name: "World" });

  return (
    <div>
      <Hero workerMessage={error ? "Worker error" : `User count: ${workerMessage}`} />
      <Container className="flex gap-8 flex-wrap">
        <Feed className="grow min-w-[350px]" />
        <Tags className="w-1/4 min-w-[200px]" />
      </Container>
    </div>
  );
}

function Hero({ workerMessage }: { workerMessage: string }) {
  return (
    <div className="border-b p-8 mb-8" data-testid="home-page-hero">
      <Container className="text-center">
        <h1 className="text-6xl mb-4">Conduit</h1>
        <p className="text-muted-foreground">A place to share your knowledge</p>
        <p className="text-sm mt-2">{workerMessage}</p>
      </Container>
    </div>
  );
}

function Feed({ className }: { className?: string }) {
  return (
    <div className={cn(className)}>
      <GlobalFeed />
    </div>
  );
}

async function Tags({ className }: { className?: string }) {
  const client = await getServerSideORPCClient();
  const [error, tags] = await client.fetchPopularTags({ limit: 50 });

  if (error) {
    console.error("Error fetching popular tags:", error);
    return <div className="bg-red-300">Error loading popular tags</div>;
  }
  return (
    <div className={cn("border-l pl-4", className)}>
      <div className="flex items-center flex-wrap gap-y-2">
        {tags.map((tag) => (
          <Tag key={tag.id} className="hover:bg-neutral-100 cursor-pointer" asChild>
            <button type="button" >{tag.name}</button>
          </Tag>
        ))}
      </div>
    </div>
  );
}

async function GlobalFeed() {
  const client = await getServerSideORPCClient();
  const [error, articles] = await client.fetchGlobalFeed({ limit: 10, page: 1 });

  if (error) {
    return <div className="bg-red-300">Error loading global feed</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      {articles.map((article) => (
        <div key={article.id} className="border-b py-6">
          <div className="flex items-center">
            <Link href={Routes.profile(article.authorName)}>
              <Avatar className="size-8">
                <AvatarImage src="/default-avatar.svg" alt="user-avatar" />
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {article.authorName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex flex-col ml-2">
              <Link href={Routes.profile(article.authorName)} className="text-sm font-medium text-foreground">
                {article.authorName}
              </Link>
              <span className="text-xs text-muted-foreground">{article.createdAt.toLocaleString()}</span>
            </div>
            {article.isLikedByCurrentUser ? (
              <SmallRemoveFromFavoritesButton
                className="ml-auto"
                articleId={article.id}
                countFavorites={article.likesCount}
              />
            ) : (
              <SmallAddToFavoritesButton
                className="ml-auto"
                articleId={article.id}
                countFavorites={article.likesCount}
              />
            )}
          </div>
          <Link href={Routes.article(article.id)} className="block">
            <div className="mt-4">
              <p className="text-xl">{article.title}</p>
              <p className="text-sm text-muted-foreground">{article.description}</p>
            </div>
            <div className="mt-4 flex items-center">
              <p className="text-xs text-muted-foreground">Read more...</p>
              <ArticleTagsList tags={article.tags} className="ml-auto" />
            </div>
          </Link>
        </div>
      ))}
    </div>
  );
}
