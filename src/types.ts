export type UserRole = "user" | "admin";

export interface User {
  id: string;
  name: string;
  role: UserRole;
}

export type ViewMode = "readable" | "raw" | "compare";
export type SidePanelTab = "overview" | "comments" | "history" | "diff";
export type CommentStatus = "open" | "resolved";
export type CommentTargetType = "document" | "module" | "excerpt";

export interface PromptModule {
  id: string;
  order: number;
  tagName: string;
  title: string;
  rawTitle: string;
  purpose: string;
  rawContent: string;
  readableContent: string;
  matchCount?: number;
}

export interface PromptDocument {
  id: string;
  title: string;
  subtitle: string;
  sourceName: string;
  sourcePath?: string;
  rawText: string;
  modules: PromptModule[];
  createdAt: string;
  updatedAt: string;
}

export interface CommentReply {
  id: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface CommentItem {
  id: string;
  targetType: CommentTargetType;
  targetId: string;
  moduleId?: string;
  excerpt?: string;
  content: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  status: CommentStatus;
  replies: CommentReply[];
}

export interface ChangeRecord {
  id: string;
  copyId: string;
  moduleId: string;
  moduleTitle: string;
  authorId: string;
  authorName: string;
  timestamp: string;
  beforeText: string;
  afterText: string;
  summary: string;
}

export interface PromptCopy {
  id: string;
  baseDocumentId: string;
  ownerId: string;
  ownerName: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  moduleOverrides: Record<string, string>;
  changeRecordIds: string[];
}

export interface CollaborationStore {
  comments: CommentItem[];
  copies: PromptCopy[];
  changeRecords: ChangeRecord[];
}

export interface ExcerptSelection {
  moduleId: string;
  excerpt: string;
}
