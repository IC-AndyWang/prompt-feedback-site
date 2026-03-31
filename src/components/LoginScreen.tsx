import { LogIn, Mail } from "lucide-react";
import { useState } from "react";

interface LoginScreenProps {
  isSubmitting?: boolean;
  errorMessage?: string;
  onSubmit: (email: string) => Promise<void> | void;
}

export function LoginScreen({
  isSubmitting,
  errorMessage,
  onSubmit,
}: LoginScreenProps) {
  const [email, setEmail] = useState("");

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(186,230,253,0.35),_transparent_38%),linear-gradient(180deg,_#f8fafc_0%,_#eef2f7_100%)] px-6 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[36px] border border-slate-200 bg-white/95 p-8 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Prompt 结构说明书 + 共创工作台
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
              邮箱登录
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-8 text-slate-600">
              请输入你的业务邮箱。系统会检查该邮箱是否已经存在于授权用户库中，符合条件的用户将直接进入工作台，并建立带有效期的登录会话。
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-900">白名单登录</div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  只有数据库中已存在且启用的邮箱才能进入系统。
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-900">会话有效期</div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  登录后会生成带过期时间的 session，过期后需重新登录。
                </p>
              </div>
              <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-900">按人留痕</div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  后续评论、副本与修改历史都会归属到当前登录用户。
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[36px] border border-slate-200 bg-white p-8 shadow-sm">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="inline-flex items-center rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600 shadow-sm">
                登录入口
              </div>
              <h2 className="mt-4 text-2xl font-semibold text-slate-950">输入你的邮箱</h2>
              <p className="mt-2 text-sm leading-7 text-slate-600">
                例如：`name@company.com`
              </p>

              <label className="mt-6 block">
                <div className="mb-2 text-sm font-medium text-slate-700">邮箱地址</div>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="请输入已授权邮箱"
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-400"
                  />
                </div>
              </label>

              {errorMessage ? (
                <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
                  {errorMessage}
                </div>
              ) : null}

              <button
                type="button"
                disabled={isSubmitting || !email.trim()}
                onClick={() => onSubmit(email.trim())}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
              >
                <LogIn className="h-4 w-4" />
                {isSubmitting ? "登录中..." : "进入工作台"}
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
