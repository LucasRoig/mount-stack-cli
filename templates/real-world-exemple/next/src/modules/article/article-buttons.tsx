"use client";

import { cn } from "@lro-ui/utils";
import { useMutation } from "@tanstack/react-query";
import { HeartIcon, PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { ButtonOrSignIn } from "@/components/button-or-sign-in";
import { orpc } from "@/lib/orpc/orpc-link";

export function FollowAuthorButton(props: { authorName: string; authorId: string; className?: string }) {
  const router = useRouter();
  const followMutation = useMutation(
    orpc.followUser.mutationOptions({
      onSuccess: () => {
        router.refresh();
      },
    }),
  );
  return (
    <ButtonOrSignIn
      variant="secondary"
      className={cn(props.className)}
      size="xs"
      onClick={() => {
        followMutation.mutate({ userToFollowId: props.authorId });
      }}
    >
      <PlusIcon />
      Follow {props.authorName}
    </ButtonOrSignIn>
  );
}

export function UnfollowAuthorButton(props: { authorName: string; authorId: string; className?: string }) {
  const router = useRouter();
  const unfollowMutation = useMutation(
    orpc.unfollowUser.mutationOptions({
      onSuccess: () => {
        router.refresh();
      },
    }),
  );
  return (
    <ButtonOrSignIn variant="secondary" className={cn(props.className)} size="xs" onClick={() => {
      unfollowMutation.mutate({ userToUnfollowId: props.authorId });
    }}>
      <PlusIcon />
      Unfollow {props.authorName}
    </ButtonOrSignIn>
  );
}

export function RemoveFromFavoritesButton(props: { className?: string, articleId: string, countFavorites: number }) {
  const router = useRouter();
  const removeFromFavoritesMutation = useMutation(
    orpc.unlikeArticle.mutationOptions({
      onSuccess: () => {
        router.refresh();
      },
    }),
  );
  return (
    <ButtonOrSignIn variant="secondary" className={cn(props.className)} size="xs" onClick={() => {
      removeFromFavoritesMutation.mutate({ articleId: props.articleId });
    }}>
      <HeartIcon />
      Unfavorite Article ({props.countFavorites})
    </ButtonOrSignIn>
  );
}

export function AddToFavoritesButton(props: { className?: string, articleId: string, countFavorites: number }) {
  const router = useRouter();
  const addToFavoritesMutation = useMutation(
    orpc.likeArticle.mutationOptions({
      onSuccess: () => {
        router.refresh();
      },
    }),
  );
  return (
    <ButtonOrSignIn variant="secondary" className={cn(props.className)} size="xs" onClick={() => {
      addToFavoritesMutation.mutate({ articleId: props.articleId });
    }}>
      <HeartIcon />
      Favorite Article ({props.countFavorites})
    </ButtonOrSignIn>
  );
}
