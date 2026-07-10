import type { InferRouterInputs, InferRouterOutputs } from "@orpc/server";
import { o } from "../orpc";
import { CreateArticleProcedure } from "./create-article/create-article.use-case";
import { FetchGlobalFeedProcedure } from "./fetch-global-feed/fetch-global-feed.use-case";
import { FetchPopularTagsProcedure } from "./fetch-popular-tags/fetch-popular-tags.use-case";
import { FindArticleByIdProcedure } from "./find-article-by-id/find-article-by-id.use-case";
import { FollowUserProcedure } from "./follow-user/follow-user.use-case";
import { GetUserProfileProcedure } from "./get-user-profile/get-user-profile.use-case";
import { HelloWorkerProcedure } from "./hello-worker.use-case";
import { LikeArticleProcedure } from "./like-article/like-article.use-case";
import { UnfollowUserProcedure } from "./unfollow-user/unfollow-user.use-case";
import { UnlikeArticleProcedure } from "./unlike-article/unlike-article.use-case";
import { UpdateMyProfileProcedure } from "./update-my-profile/update-my-profile.use-case";

export const appRouter = o.router({
  helloWorker: HelloWorkerProcedure,
  getUserProfile: GetUserProfileProcedure,
  updateMyProfile: UpdateMyProfileProcedure,
  createArticle: CreateArticleProcedure,
  findArticleById: FindArticleByIdProcedure,
  followUser: FollowUserProcedure,
  unfollowUser: UnfollowUserProcedure,
  likeArticle: LikeArticleProcedure,
  unlikeArticle: UnlikeArticleProcedure,
  fetchGlobalFeed: FetchGlobalFeedProcedure,
  fetchPopularTags: FetchPopularTagsProcedure,
});

export type RouterOutputs = InferRouterOutputs<typeof appRouter>;
export type RouterInputs = InferRouterInputs<typeof appRouter>;
