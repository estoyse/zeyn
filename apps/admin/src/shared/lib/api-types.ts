import type { inferRouterOutputs } from "@trpc/server";
import type { AppRouter } from "@zeyn/api/routers/index";

export type RouterOutputs = inferRouterOutputs<AppRouter>;

type AdminOutputs = RouterOutputs["admin"];

export type SubjectListItem =
  AdminOutputs["content"]["listSubjects"]["items"][number];
export type SubjectDetail = AdminOutputs["content"]["getSubject"];
export type QuestionItem = SubjectDetail["questions"][number];

export type ArtistListItem =
  AdminOutputs["music"]["listArtists"]["items"][number];
export type ArtistDetail = AdminOutputs["music"]["getArtist"];
export type SongItem = ArtistDetail["songs"][number];

export type UserListItem = AdminOutputs["users"]["list"]["items"][number];
export type UserDetail = AdminOutputs["users"]["get"];
