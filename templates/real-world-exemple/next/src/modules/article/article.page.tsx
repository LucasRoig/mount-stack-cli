import { isDefinedError } from "@orpc/client";
import { match } from "ts-pattern";
import { NotFound } from "@/components/error-pages/not-found";
import { UnexpectedError } from "@/components/error-pages/unexpected-error";
import { Container } from "@/components/layout/container";
import { getServerSideORPCClient } from "@/lib/orpc/orpc-server-side-client";

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
    <Container>
      <h1>
        Article {id} - {article.title}
      </h1>
    </Container>
  );
}
