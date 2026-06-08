"use client";

import { cn } from "@lro-ui/utils";
import { useMutation } from "@tanstack/react-query";
import { HeartIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { ButtonOrSignIn } from "@/components/button-or-sign-in";
import { orpc } from "@/lib/orpc/orpc-link";

export function SmallRemoveFromFavoritesButton(props: {
  className?: string;
  articleId: string;
  countFavorites: number;
}) {
  const router = useRouter();
  const removeFromFavoritesMutation = useMutation(
    orpc.unlikeArticle.mutationOptions({
      onSuccess: () => {
        router.refresh();
      },
    }),
  );
  return (
    <ButtonOrSignIn
      variant="secondary"
      className={cn("bg-green-500", props.className)}
      size="icon"
      onClick={() => {
        removeFromFavoritesMutation.mutate({ articleId: props.articleId });
      }}
    >
      <HeartIcon />
      {props.countFavorites}
    </ButtonOrSignIn>
  );
}

export function SmallAddToFavoritesButton(props: { className?: string; articleId: string; countFavorites: number }) {
  const router = useRouter();
  const addToFavoritesMutation = useMutation(
    orpc.likeArticle.mutationOptions({
      onSuccess: () => {
        router.refresh();
      },
    }),
  );
  return (
    <ButtonOrSignIn
      variant="secondary"
      className={cn(props.className)}
      size="icon"
      onClick={() => {
        addToFavoritesMutation.mutate({ articleId: props.articleId });
      }}
    >
      <HeartIcon />
      {props.countFavorites}
    </ButtonOrSignIn>
  );
}
