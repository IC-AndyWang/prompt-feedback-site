import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { parseDocxToPromptDocument } from "./utils/docxParser";
import { Header } from "./components/Header";
import { LoginScreen } from "./components/LoginScreen";
import { Sidebar } from "./components/Sidebar";
import { ModuleCard } from "./components/ModuleCard";
import { CommentsPanel } from "./components/CommentsPanel";
import { OverviewPanel } from "./components/OverviewPanel";
import { HistoryPanel } from "./components/HistoryPanel";
import { DiffPanel } from "./components/DiffPanel";
import type {
  CommentItem,
  ExcerptSelection,
  PromptDocument,
  PromptModule,
  SidePanelTab,
  ViewMode,
} from "./types";
import {
  createModuleComment,
  fetchModuleComments,
  updateRemoteCommentStatus,
} from "./utils/commentsApi";
import type { AuthUser } from "./utils/authApi";
import { fetchAuthUser, loginWithEmail, logoutUser } from "./utils/authApi";
import { countMatches, makeId } from "./utils/helpers";
import {
  createEmptyCollaborationStore,
  loadCollaborationStore,
  saveCollaborationStore,
} from "./utils/storage";
import {
  createPromptCopy,
  fetchWorkbenchState,
  savePromptModuleChange,
} from "./utils/workbenchApi";

const DEFAULT_DOC_URL = "/sample/msl_prompt.docx";
const DEFAULT_DOC_PATH = "/Users/andywang/Downloads/AI MSL/msl_prompt.docx";

function App() {
  const [document, setDocument] = useState<PromptDocument>();
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string>();
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [loginError, setLoginError] = useState<string>();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("readable");
  const [sidePanelTab, setSidePanelTab] = useState<SidePanelTab>("overview");
  const [searchValue, setSearchValue] = useState("");
  const [activeModuleId, setActiveModuleId] = useState<string>();
  const [collaboration, setCollaboration] = useState(createEmptyCollaborationStore);
  const [isCollaborationReady, setIsCollaborationReady] = useState(false);
  const [activeCopyId, setActiveCopyId] = useState<string>();
  const [onlyOpenComments, setOnlyOpenComments] = useState(false);
  const [selectedExcerpt, setSelectedExcerpt] = useState<ExcerptSelection>();
  const [draftEdits, setDraftEdits] = useState<Record<string, string>>({});
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [workbenchApiAvailable, setWorkbenchApiAvailable] = useState<boolean | null>(null);
  const [workbenchError, setWorkbenchError] = useState<string>();
  const [commentsApiAvailable, setCommentsApiAvailable] = useState<boolean | null>(null);
  const [remoteCommentsByModule, setRemoteCommentsByModule] = useState<
    Record<string, CommentItem[]>
  >({});
  const [commentsLoadingByModule, setCommentsLoadingByModule] = useState<
    Record<string, boolean>
  >({});
  const [commentsErrorByModule, setCommentsErrorByModule] = useState<
    Record<string, string | undefined>
  >({});
  const [rightPanelWidth, setRightPanelWidth] = useState(420);
  const [isResizingPanel, setIsResizingPanel] = useState(false);
  const moduleRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    async function loadDefaultDocument() {
      setIsLoading(true);
      setLoadError(undefined);
      try {
        const response = await fetch(DEFAULT_DOC_URL);
        if (!response.ok) {
          throw new Error("示例 docx 文件加载失败");
        }
        const arrayBuffer = await response.arrayBuffer();
        const parsed = await parseDocxToPromptDocument(
          arrayBuffer,
          "msl_prompt.docx",
          DEFAULT_DOC_PATH,
        );
        setDocument(parsed);
        setActiveModuleId(parsed.modules[0]?.id);
      } catch (error) {
        setLoadError(
          error instanceof Error
            ? error.message
            : "文档加载失败，请尝试上传新的 docx 文件。",
        );
      } finally {
        setIsLoading(false);
      }
    }

    void loadDefaultDocument();
  }, []);

  useEffect(() => {
    async function loadAuthUser() {
      try {
        const user = await fetchAuthUser();
        setAuthUser(user);
      } catch {
        setAuthUser(null);
      } finally {
        setIsAuthLoading(false);
      }
    }

    void loadAuthUser();
  }, []);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }

    if (!authUser?.id) {
      setCollaboration(createEmptyCollaborationStore());
      setActiveCopyId(undefined);
      setDraftEdits({});
      setSelectedExcerpt(undefined);
      setSidePanelTab("overview");
      setIsCollaborationReady(false);
      setWorkbenchApiAvailable(null);
      setWorkbenchError(undefined);
      return;
    }

    const userId = authUser.id;
    let cancelled = false;

    async function loadWorkbenchState() {
      const localStore = loadCollaborationStore(userId);

      try {
        const remoteState = await fetchWorkbenchState();
        if (cancelled) {
          return;
        }

        setCollaboration({
          comments: localStore.comments,
          copies: remoteState.copies,
          changeRecords: remoteState.changeRecords,
        });
        setWorkbenchApiAvailable(true);
        setWorkbenchError(undefined);
      } catch (error) {
        if (cancelled) {
          return;
        }

        setCollaboration(localStore);
        setWorkbenchApiAvailable(false);
        setWorkbenchError(
          error instanceof Error
            ? `当前副本与历史记录暂未连接数据库，已回退到本地模式。${error.message}`
            : "当前副本与历史记录暂未连接数据库，已回退到本地模式。",
        );
      } finally {
        if (cancelled) {
          return;
        }
        setActiveCopyId(undefined);
        setDraftEdits({});
        setSelectedExcerpt(undefined);
        setSidePanelTab("overview");
        setIsCollaborationReady(true);
      }
    }

    void loadWorkbenchState();

    return () => {
      cancelled = true;
    };
  }, [authUser?.id, isAuthLoading]);

  useEffect(() => {
    if (!authUser?.id || !isCollaborationReady) {
      return;
    }

    saveCollaborationStore(authUser.id, collaboration);
  }, [authUser?.id, collaboration, isCollaborationReady]);

  const currentUser = authUser
    ? {
        id: authUser.id,
        name: authUser.name?.trim() || authUser.email || "未命名用户",
        role: (authUser.role === "admin" ? "admin" : "user") as "admin" | "user",
      }
    : {
        id: "anonymous",
        name: "未登录用户",
        role: "user" as const,
      };
  const isAdmin = currentUser.role === "admin";
  const activeCopy = collaboration.copies.find((copy) => copy.id === activeCopyId);
  const userExistingCopy = collaboration.copies.find(
    (copy) => copy.ownerId === currentUser.id && copy.baseDocumentId === document?.id,
  );
  const activeCopyChangeRecords = useMemo(
    () => collaboration.changeRecords.filter((change) => change.copyId === activeCopy?.id),
    [activeCopy?.id, collaboration.changeRecords],
  );
  const changedModuleIds = activeCopy ? Object.keys(activeCopy.moduleOverrides) : [];

  const modulesWithSearch = useMemo(() => {
    if (!document) {
      return [];
    }

    return document.modules
      .map((module) => {
        const override = activeCopy?.moduleOverrides[module.id];
        const matchCount = countMatches(
          `${module.title}\n${module.rawTitle}\n${override ?? module.readableContent}\n${module.rawContent}`,
          searchValue,
        );

        return {
          ...module,
          readableContent: override ?? module.readableContent,
          matchCount,
        };
      })
      .filter((module) => {
        if (!searchValue.trim()) {
          return true;
        }
        return (module.matchCount ?? 0) > 0;
      });
  }, [activeCopy?.moduleOverrides, document, searchValue]);

  const activeModule = useMemo<PromptModule | undefined>(
    () => modulesWithSearch.find((module) => module.id === activeModuleId) ?? modulesWithSearch[0],
    [activeModuleId, modulesWithSearch],
  );

  useEffect(() => {
    if (!activeModuleId && modulesWithSearch[0]?.id) {
      setActiveModuleId(modulesWithSearch[0].id);
    }
  }, [activeModuleId, modulesWithSearch]);

  const commentCountByModule = useMemo(() => {
    const localCounts = collaboration.comments.reduce<Record<string, number>>((acc, comment) => {
      if (comment.moduleId) {
        acc[comment.moduleId] = (acc[comment.moduleId] ?? 0) + 1;
      }
      return acc;
    }, {});

    if (!commentsApiAvailable) {
      return localCounts;
    }

    const mergedCounts = { ...localCounts };
    Object.entries(remoteCommentsByModule).forEach(([moduleId, comments]) => {
      if (commentsErrorByModule[moduleId]?.includes("已回退到本地评论模式")) {
        return;
      }
      mergedCounts[moduleId] = comments.length;
    });
    return mergedCounts;
  }, [
    collaboration.comments,
    commentsApiAvailable,
    commentsErrorByModule,
    remoteCommentsByModule,
  ]);

  const moduleComments = useMemo(() => {
    if (!activeModule) {
      return collaboration.comments.filter((comment) => comment.targetType === "document");
    }

    const hasModuleLevelLocalFallback = commentsErrorByModule[activeModule.id]?.includes(
      "已回退到本地评论模式",
    );

    if (
      !hasModuleLevelLocalFallback &&
      commentsApiAvailable &&
      remoteCommentsByModule[activeModule.id] !== undefined
    ) {
      return remoteCommentsByModule[activeModule.id] ?? [];
    }

    return collaboration.comments.filter(
      (comment) =>
        comment.moduleId === activeModule.id || comment.targetType === "document",
    );
  }, [
    activeModule,
    collaboration.comments,
    commentsApiAvailable,
    commentsErrorByModule,
    remoteCommentsByModule,
  ]);

  useEffect(() => {
    setDraftEdits(activeCopy?.moduleOverrides ?? {});
  }, [activeCopy?.id, activeCopy?.moduleOverrides]);

  useEffect(() => {
    if (!document) {
      return;
    }

    const currentDocument = document;
    let cancelled = false;

    async function loadCommentsForAllModules() {
      const nextLoading = currentDocument.modules.reduce<Record<string, boolean>>((acc, module) => {
        acc[module.id] = true;
        return acc;
      }, {});
      setCommentsLoadingByModule(nextLoading);

      const results = await Promise.allSettled(
        currentDocument.modules.map(async (module) => {
          const comments = await fetchModuleComments(module.tagName, module.id);
          return { moduleId: module.id, comments };
        }),
      );

      if (cancelled) {
        return;
      }

      const nextComments: Record<string, CommentItem[]> = {};
      const nextErrors: Record<string, string | undefined> = {};
      let hasRemoteSuccess = false;

      results.forEach((result, index) => {
        const module = currentDocument.modules[index];
        if (result.status === "fulfilled") {
          hasRemoteSuccess = true;
          nextComments[module.id] = result.value.comments;
        } else {
          nextErrors[module.id] = "当前未能读取数据库评论，已回退到本地评论模式。";
        }
      });

      setCommentsApiAvailable(hasRemoteSuccess);
      setRemoteCommentsByModule(nextComments);
      setCommentsErrorByModule(nextErrors);
      setCommentsLoadingByModule({});
    }

    void loadCommentsForAllModules();

    return () => {
      cancelled = true;
    };
  }, [document]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        const topModuleId = visible[0]?.target.id;
        if (topModuleId) {
          setActiveModuleId(topModuleId);
        }
      },
      {
        rootMargin: "-25% 0px -55% 0px",
        threshold: [0.2, 0.5, 0.75],
      },
    );

    Object.values(moduleRefs.current).forEach((node) => {
      if (node) {
        observer.observe(node);
      }
    });

    return () => observer.disconnect();
  }, [modulesWithSearch]);

  useEffect(() => {
    if (!isResizingPanel) {
      return;
    }

    function handleMouseMove(event: MouseEvent) {
      const maxWidth = Math.min(window.innerWidth * 0.48, 760);
      const nextWidth = window.innerWidth - event.clientX - 24;
      setRightPanelWidth(Math.max(320, Math.min(maxWidth, nextWidth)));
    }

    function handleMouseUp() {
      setIsResizingPanel(false);
    }

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizingPanel]);

  function handleSelectModule(moduleId: string) {
    setActiveModuleId(moduleId);
    const node = moduleRefs.current[moduleId];
    if (node) {
      node.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  async function handleAddComment(payload: {
    content: string;
    targetType: "document" | "module" | "excerpt";
    targetId: string;
    moduleId?: string;
    excerpt?: string;
  }) {
    if (
      activeModule &&
      payload.targetType !== "document" &&
      commentsApiAvailable !== false
    ) {
      try {
        const created = await createModuleComment({
          moduleKey: activeModule.tagName,
          localModuleId: activeModule.id,
          moduleTitle: activeModule.title,
          content: payload.content,
          excerpt: payload.excerpt,
        });

        setCommentsApiAvailable(true);
        setCommentsErrorByModule((previous) => ({
          ...previous,
          [activeModule.id]: undefined,
        }));
        setRemoteCommentsByModule((previous) => ({
          ...previous,
          [activeModule.id]: [...(previous[activeModule.id] ?? []), created],
        }));
        return;
      } catch (error) {
        const message =
          error instanceof Error && error.message === "Login required"
            ? "当前模块评论已接入数据库。请先登录后再发布评论。"
            : "写入数据库评论失败，已回退到本地评论模式。";

        setCommentsErrorByModule((previous) => ({
          ...previous,
          [activeModule.id]: message,
        }));
        if (error instanceof Error && error.message === "Login required") {
          return;
        }
      }
    }

    const comment: CommentItem = {
      id: makeId("comment"),
      source: "local",
      targetType: payload.targetType,
      targetId: payload.targetId,
      moduleId: payload.moduleId,
      excerpt: payload.excerpt,
      content: payload.content,
      authorId: currentUser.id,
      authorName: currentUser.name,
      createdAt: new Date().toISOString(),
      status: "open",
      replies: [],
    };

    setCollaboration((previous) => ({
      ...previous,
      comments: [comment, ...previous.comments],
    }));
  }

  async function handleToggleCommentStatus(commentId: string) {
    const targetComment = moduleComments.find((comment) => comment.id === commentId);
    if (!targetComment) {
      return;
    }

    if (targetComment.source === "remote" && activeModule) {
      const nextStatus = targetComment.status === "open" ? "resolved" : "open";
      try {
        await updateRemoteCommentStatus(commentId, nextStatus);
        setRemoteCommentsByModule((previous) => ({
          ...previous,
          [activeModule.id]: (previous[activeModule.id] ?? []).map((comment) =>
            comment.id === commentId ? { ...comment, status: nextStatus } : comment,
          ),
        }));
        setCommentsErrorByModule((previous) => ({
          ...previous,
          [activeModule.id]: undefined,
        }));
      } catch {
        setCommentsErrorByModule((previous) => ({
          ...previous,
          [activeModule.id]: "更新数据库评论状态失败，请稍后再试。",
        }));
      }
      return;
    }

    setCollaboration((previous) => ({
      ...previous,
      comments: previous.comments.map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              status: comment.status === "open" ? "resolved" : "open",
            }
          : comment,
      ),
    }));
  }

  async function handleCreateCopy() {
    if (!document) {
      return;
    }

    const existing = collaboration.copies.find(
      (copy) => copy.ownerId === currentUser.id && copy.baseDocumentId === document.id,
    );

    if (existing) {
      setActiveCopyId(existing.id);
      setDraftEdits(existing.moduleOverrides);
      setSidePanelTab("diff");
      return;
    }

    const now = new Date().toISOString();
    const copy = {
      id: makeId("copy"),
      baseDocumentId: document.id,
      ownerId: currentUser.id,
      ownerName: currentUser.name,
      name: `${currentUser.name} 的 Prompt 副本`,
      createdAt: now,
      updatedAt: now,
      moduleOverrides: {},
      changeRecordIds: [],
    };

    if (workbenchApiAvailable !== false) {
      try {
        const remoteCopy = await createPromptCopy({
          baseDocumentId: document.id,
          ownerName: currentUser.name,
          name: copy.name,
        });

        setCollaboration((previous) => ({
          ...previous,
          copies: [
            remoteCopy,
            ...previous.copies.filter((item) => item.id !== remoteCopy.id),
          ],
        }));
        setWorkbenchApiAvailable(true);
        setWorkbenchError(undefined);
        setActiveCopyId(remoteCopy.id);
        setDraftEdits(remoteCopy.moduleOverrides);
        setSidePanelTab("history");
        return;
      } catch (error) {
        setWorkbenchApiAvailable(false);
        setWorkbenchError(
          error instanceof Error
            ? `创建副本写入数据库失败，已回退到本地模式。${error.message}`
            : "创建副本写入数据库失败，已回退到本地模式。",
        );
      }
    }

    setCollaboration((previous) => ({
      ...previous,
      copies: [copy, ...previous.copies],
    }));
    setActiveCopyId(copy.id);
    setDraftEdits({});
    setSidePanelTab("history");
  }

  function handleEditedContentChange(moduleId: string, value: string) {
    if (!activeCopy) {
      return;
    }

    setDraftEdits((previous) => ({
      ...previous,
      [moduleId]: value,
    }));
  }

  async function handleEditedContentCommit(moduleId: string) {
    if (!document || !activeCopy) {
      return;
    }

    const baseModule = document.modules.find((module) => module.id === moduleId);
    if (!baseModule) {
      return;
    }

    const previousValue = activeCopy.moduleOverrides[moduleId] ?? baseModule.readableContent;
    const nextValue =
      draftEdits[moduleId] ??
      activeCopy.moduleOverrides[moduleId] ??
      baseModule.readableContent;
    if (previousValue === nextValue) {
      return;
    }

    const nextOverrides = { ...activeCopy.moduleOverrides };
    if (nextValue === baseModule.readableContent) {
      delete nextOverrides[moduleId];
    } else {
      nextOverrides[moduleId] = nextValue;
    }

    const now = new Date().toISOString();
    const changeRecord = {
      id: makeId("change"),
      copyId: activeCopy.id,
      moduleId,
      moduleTitle: baseModule.title,
      authorId: currentUser.id,
      authorName: currentUser.name,
      timestamp: now,
      beforeText: previousValue,
      afterText: nextValue,
      summary:
        nextValue === baseModule.readableContent
          ? `将“${baseModule.title}”恢复为主版本内容`
          : `更新了“${baseModule.title}”模块的内容表述`,
    };

    if (workbenchApiAvailable !== false) {
      try {
        const saved = await savePromptModuleChange({
          copyId: activeCopy.id,
          moduleId,
          moduleTitle: baseModule.title,
          baseText: baseModule.readableContent,
          nextText: nextValue,
          authorName: currentUser.name,
        });

        setCollaboration((previous) => ({
          ...previous,
          copies: previous.copies.map((copy) =>
            copy.id === activeCopy.id ? saved.copy : copy,
          ),
          changeRecords: saved.changeRecord
            ? [saved.changeRecord, ...previous.changeRecords]
            : previous.changeRecords,
        }));
        setWorkbenchApiAvailable(true);
        setWorkbenchError(undefined);
        return;
      } catch (error) {
        setWorkbenchApiAvailable(false);
        setWorkbenchError(
          error instanceof Error
            ? `修改记录写入数据库失败，已回退到本地模式。${error.message}`
            : "修改记录写入数据库失败，已回退到本地模式。",
        );
      }
    }

    setCollaboration((previous) => ({
      ...previous,
      copies: previous.copies.map((copy) =>
        copy.id === activeCopy.id
          ? {
              ...copy,
              moduleOverrides: nextOverrides,
              updatedAt: now,
              changeRecordIds: [changeRecord.id, ...copy.changeRecordIds],
            }
          : copy,
      ),
      changeRecords: [changeRecord, ...previous.changeRecords],
    }));
  }

  function handleOpenPanel(panel: "comments" | "diff", moduleId: string) {
    setActiveModuleId(moduleId);
    setSidePanelTab(panel);
  }

  function handleExcerptSelect(moduleId: string) {
    const selection = window.getSelection()?.toString().trim();
    if (!selection || selection.length < 4) {
      return;
    }

    setSelectedExcerpt({
      moduleId,
      excerpt: selection,
    });
    setActiveModuleId(moduleId);
    setSidePanelTab("comments");
  }

  const activeModuleBase = document?.modules.find((module) => module.id === activeModule?.id);
  const activeModuleOverride =
    activeModule && activeCopy
      ? draftEdits[activeModule.id] ?? activeCopy.moduleOverrides[activeModule.id]
      : undefined;
  const activeModuleError = activeModule ? commentsErrorByModule[activeModule.id] : undefined;
  const hasModuleLevelLocalFallback = Boolean(
    activeModuleError?.includes("已回退到本地评论模式"),
  );
  const hasRemoteCommentsForActiveModule = Boolean(
    activeModule && remoteCommentsByModule[activeModule.id] !== undefined,
  );
  const commentsActor = authUser
    ? {
        id: authUser.id,
        name: authUser.name?.trim() || authUser.email || currentUser.name,
        role: (authUser.role === "admin" ? "admin" : "user") as "admin" | "user",
      }
    : currentUser;
  const isRemoteCommentContext = Boolean(
    activeModule &&
      !hasModuleLevelLocalFallback &&
      (hasRemoteCommentsForActiveModule ||
        (commentsApiAvailable !== false && !activeModuleError)),
  );
  const composerDisabled = Boolean(isRemoteCommentContext && !authUser);
  const composerHint = hasModuleLevelLocalFallback
    ? "当前模块已回退到本地临时评论模式。"
    : isRemoteCommentContext
      ? authUser
        ? "当前模块评论会直接写入 Cloudflare 数据库。"
        : "当前模块评论已接入数据库。请先登录后再发布评论。"
      : "当前使用本地临时评论模式。";

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-5 text-sm text-slate-600 shadow-sm">
          正在读取 docx 并解析 Prompt 结构...
        </div>
      </div>
    );
  }

  if (loadError || !document) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-6">
        <div className="max-w-lg rounded-[28px] border border-rose-200 bg-white p-8 shadow-sm">
          <h1 className="text-xl font-semibold text-slate-900">文档加载失败</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">{loadError}</p>
          <p className="mt-4 text-xs leading-6 text-slate-500">
            请检查默认示例文件是否可用，或联系我继续补充新的文档来源接入方式。
          </p>
        </div>
      </div>
    );
  }

  if (isAuthLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-5 text-sm text-slate-600 shadow-sm">
          正在校验登录状态...
        </div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <LoginScreen
        isSubmitting={isLoggingIn}
        errorMessage={loginError}
        onSubmit={async (email) => {
          setIsLoggingIn(true);
          setLoginError(undefined);
          try {
            const user = await loginWithEmail(email);
            setAuthUser(user);
          } catch (error) {
            setLoginError(
              error instanceof Error
                ? error.message
                : "登录失败，请确认邮箱已在授权名单中。",
            );
          } finally {
            setIsLoggingIn(false);
          }
        }}
      />
    );
  }

  if (!isCollaborationReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="rounded-3xl border border-slate-200 bg-white px-6 py-5 text-sm text-slate-600 shadow-sm">
          正在同步当前账号的副本、评论与修改记录...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(186,230,253,0.35),_transparent_38%),linear-gradient(180deg,_#f8fafc_0%,_#eef2f7_100%)] text-slate-900">
      <Header
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        currentUserLabel={currentUser.name}
        currentUserRoleLabel={isAdmin ? "管理视图" : "普通用户"}
        onLogout={async () => {
          await logoutUser().catch(() => undefined);
          setAuthUser(null);
          setCollaboration(createEmptyCollaborationStore());
          setIsCollaborationReady(false);
          setWorkbenchApiAvailable(null);
          setWorkbenchError(undefined);
          setActiveCopyId(undefined);
          setDraftEdits({});
          setSelectedExcerpt(undefined);
          setLoginError(undefined);
        }}
        onCreateCopy={handleCreateCopy}
        onReturnToBase={() => {
          setActiveCopyId(undefined);
          setDraftEdits({});
          setSelectedExcerpt(undefined);
          setSidePanelTab("overview");
        }}
        activeCopyName={activeCopy?.name}
        hasExistingCopy={Boolean(userExistingCopy)}
      />

      <main
        className="grid items-start gap-6 px-6 py-6 xl:grid-cols-[280px_minmax(0,1fr)_minmax(320px,var(--right-panel-width))]"
        style={
          {
            "--right-panel-width": `${rightPanelWidth}px`,
          } as CSSProperties
        }
      >
        <Sidebar
          modules={modulesWithSearch}
          activeModuleId={activeModule?.id}
          onSelectModule={handleSelectModule}
          commentCountByModule={commentCountByModule}
          changedModuleIds={changedModuleIds}
          searchValue={searchValue}
        />

        <section className="min-w-0 space-y-5">
          <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">{document.title}</h2>
                <p className="mt-1 text-sm leading-6 text-slate-600">{document.subtitle}</p>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="rounded-full bg-slate-100 px-3 py-1">
                  模块数：{document.modules.length}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1">
                  当前用户：{currentUser.name}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1">
                  角色：{isAdmin ? "管理视图" : "普通用户"}
                </span>
                <span
                  className={[
                    "rounded-full px-3 py-1",
                    workbenchApiAvailable
                      ? "bg-emerald-50 text-emerald-800"
                      : "bg-amber-50 text-amber-800",
                  ].join(" ")}
                >
                  {workbenchApiAvailable
                    ? "副本与历史：数据库已连接"
                    : "副本与历史：本地临时模式"}
                </span>
              </div>
            </div>
            {workbenchError ? (
              <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                {workbenchError}
              </div>
            ) : null}
          </div>

          {activeCopy ? (
            <div className="rounded-[28px] border border-sky-200 bg-[linear-gradient(135deg,_rgba(224,242,254,0.95),_rgba(248,250,252,0.95))] px-6 py-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="max-w-3xl">
                  <div className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-sky-800 shadow-sm">
                    当前正在编辑个人副本
                  </div>
                  <h3 className="mt-3 text-xl font-semibold text-slate-950">
                    {activeCopy.name}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-slate-700">
                    你现在看到的是 <span className="font-semibold text-slate-950">副本视图</span>。
                    所有编辑、diff 和历史记录都只写入这个副本，不会影响主版本。
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-white px-3 py-1 text-sky-900 shadow-sm">
                    已修改模块 {changedModuleIds.length} 个
                  </span>
                  <span className="rounded-full bg-white px-3 py-1 text-sky-900 shadow-sm">
                    修改记录 {activeCopyChangeRecords.length} 条
                  </span>
                  <button
                    type="button"
                    onClick={() => setSidePanelTab("history")}
                    className="rounded-full bg-slate-900 px-3 py-1 text-white shadow-sm transition hover:bg-slate-800"
                  >
                    查看副本历史
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[28px] border border-slate-200 bg-white px-6 py-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    当前为主版本
                  </div>
                  <p className="mt-3 text-sm leading-7 text-slate-600">
                    这里用于阅读和理解 Prompt 结构。若要提出个人优化版本，请先创建自己的副本，再进行编辑和 diff 对照。
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCreateCopy}
                  className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                >
                  创建我的副本
                </button>
              </div>
            </div>
          )}

          {modulesWithSearch.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-slate-300 bg-white p-10 text-center text-sm leading-7 text-slate-500 shadow-sm">
              没有找到匹配内容，请换一个关键词试试。
            </div>
          ) : null}

          {modulesWithSearch.map((module) => (
            <div
              key={module.id}
              ref={(node) => {
                moduleRefs.current[module.id] = node;
              }}
            >
              <ModuleCard
                module={module}
                allModules={document.modules}
                viewMode={viewMode}
                searchValue={searchValue}
                commentCount={commentCountByModule[module.id] ?? 0}
                isEditable={Boolean(activeCopy && activeCopy.ownerId === currentUser.id)}
                isChanged={changedModuleIds.includes(module.id)}
                editedContent={
                  activeCopy
                    ? draftEdits[module.id] ?? activeCopy.moduleOverrides[module.id]
                    : undefined
                }
                onEditedContentChange={handleEditedContentChange}
                onEditedContentCommit={handleEditedContentCommit}
                onOpenPanel={handleOpenPanel}
                onSwitchToCompare={(moduleId) => {
                  setActiveModuleId(moduleId);
                  setViewMode("compare");
                  setSidePanelTab("overview");
                }}
                onJumpToModule={handleSelectModule}
                onExcerptSelect={handleExcerptSelect}
              />
            </div>
          ))}
        </section>

        <div className="relative min-w-[320px] self-start">
          <button
            type="button"
            onMouseDown={() => setIsResizingPanel(true)}
            className="absolute -left-3 top-1/2 z-10 hidden h-24 w-6 -translate-y-1/2 cursor-col-resize items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-sm xl:flex"
            aria-label="调整右侧栏宽度"
            title="拖拽调整右侧栏宽度"
          >
            {isResizingPanel ? (
              <PanelRightClose className="h-4 w-4" />
            ) : (
              <PanelRightOpen className="h-4 w-4" />
            )}
          </button>

          <aside className="sticky top-[148px] overflow-visible rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="sticky top-[148px] z-10 border-b border-slate-200 bg-white px-3 py-2">
              <div className="mb-2 px-1 text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                右侧工作台
              </div>
              <div className="flex flex-wrap gap-2">
                {[
                  ["overview", "模块说明"],
                  ["comments", "评论"],
                  ["history", "历史记录"],
                  ["diff", "diff 对照"],
                ].map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSidePanelTab(key as SidePanelTab)}
                    className={[
                      "rounded-full px-3 py-2 text-xs font-medium transition hover:-translate-y-0.5 hover:shadow-sm",
                      sidePanelTab === key
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200",
                    ].join(" ")}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {sidePanelTab === "overview" ? (
              <OverviewPanel document={document} currentModule={activeModule} />
            ) : null}
            {sidePanelTab === "comments" ? (
              <CommentsPanel
                comments={moduleComments}
                modules={document.modules}
                currentModule={activeModule}
                currentUser={commentsActor}
                onlyOpen={onlyOpenComments}
                isLoading={Boolean(activeModule && commentsLoadingByModule[activeModule.id])}
                errorMessage={activeModule ? commentsErrorByModule[activeModule.id] : undefined}
                composerDisabled={composerDisabled}
                composerHint={composerHint}
                selectedExcerpt={selectedExcerpt}
                onClearExcerpt={() => setSelectedExcerpt(undefined)}
                onToggleOnlyOpen={() => setOnlyOpenComments((previous) => !previous)}
                onAddComment={handleAddComment}
                onToggleStatus={handleToggleCommentStatus}
              />
            ) : null}
            {sidePanelTab === "history" ? (
              <HistoryPanel
                copies={collaboration.copies}
                changeRecords={collaboration.changeRecords}
                currentUser={currentUser}
                isAdmin={isAdmin}
                activeCopyId={activeCopyId}
                onSelectCopy={(copyId) => {
                  setActiveCopyId(copyId);
                  setSidePanelTab("diff");
                }}
                onInspectModule={(moduleId) => {
                  setActiveModuleId(moduleId);
                  setSidePanelTab("diff");
                  handleSelectModule(moduleId);
                }}
              />
            ) : null}
            {sidePanelTab === "diff" ? (
              <DiffPanel
                currentModule={activeModule}
                originalText={activeModuleBase?.readableContent}
                changedText={activeModuleOverride}
                copyName={activeCopy?.name}
              />
            ) : null}
          </aside>
        </div>
      </main>
    </div>
  );
}

export default App;
