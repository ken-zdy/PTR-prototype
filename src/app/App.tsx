/* MARKER-MAKE-KIT-INVOKED */
/* MARKER-MAKE-KIT-DISCOVERY-READ */
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import svgPaths from "@/imports/Group1000004620-1/svg-k2wt844vdx";
import svgPaths2 from "@/imports/Frame1000004818/svg-0qhrkrwoc8";
import svgPaths3 from "@/imports/Ptr生成器/svg-2knaldn2tc";
import svgPaths4 from "@/imports/更新文档与删除记录/svg-rmahfn6rf9";
import svgPaths5 from "@/imports/Ptr管理详情/svg-w3vvo4b09i";

// ─── Types ────────────────────────────────────────────────────────────────────

type 滤色 =
  | "list"
  | "upload" | "reading" | "confirm" | "error" | "success"
  | "archive-upload" | "archive-reading" | "archive-confirm" | "archive-error" | "archive-success"
  | "gen-form" | "gen-running" | "gen-done" | "gen-error"
  | "upd-loading" | "upd-record" | "upd-recognizing" | "upd-recognition" | "upd-delete-confirm" | "upd-success" | "upd-delete-success"
  | "edit" | "edit-confirm"
  | "doc-maintain" | "doc-delete-confirm"
  | "merge";

type ArchiveType = "变更归档" | "延续归档";
type GenTab = "PTR对比表生成" | "单PTR生成" | "批量PTR生成";
type BatchMaterialType = "生成PTR" | "生成PTR对比表";

interface PtrRow {
  id: number;
  model: string;
  type: "进口" | "国产";
  regNo: string;
  approveDate: string;
  effectiveDate: string;
  expireDate: string;
  updatedBy: string;
  updatedAt: string;
  isNew?: boolean;
}

interface FileSlot {
  label: string;
  required: boolean;
  file: string | null;
  status: "idle" | "uploading" | "done" | "error";
}

interface ConfirmForm {
  source: "进口" | "国产";
  model: string;
  regNo: string;
  approveDate: string;
  effectiveDate: string;
  expireDate: string;
}

interface CommentAuthor {
  name: string;
  role: string;
}

interface CommentMessage {
  id: string;
  text: string;
  createdAt: string;
  author: CommentAuthor;
}

interface CommentNote {
  id: string;
  scope: string;
  x: number;
  y: number;
  resolved: boolean;
  messages: CommentMessage[];
}

// ─── Initial Data ─────────────────────────────────────────────────────────────

const INITIAL_ROWS: PtrRow[] = [
  { id: 1, model: "3M12", type: "进口", regNo: "国械注进20257220001", approveDate: "2025-07-22", effectiveDate: "2026-07-22", expireDate: "2031-07-22", updatedBy: "Kaiya Rosser", updatedAt: "2026-03-25 18:23" },
  { id: 2, model: "3M12  L4L", type: "国产", regNo: "国械注准20257220002", approveDate: "2025-07-22", effectiveDate: "2026-07-22", expireDate: "2031-07-22", updatedBy: "Doe, Jill", updatedAt: "2026-03-25 18:23" },
  { id: 3, model: "7M12", type: "进口", regNo: "国械注进20257220003", approveDate: "2025-07-22", effectiveDate: "2026-07-22", expireDate: "2031-07-22", updatedBy: "Cristofer Westervelt", updatedAt: "2026-03-25 18:23" },
  { id: 4, model: "7B12", type: "进口", regNo: "国械注进20257220004", approveDate: "2025-07-22", effectiveDate: "2026-07-22", expireDate: "2031-07-22", updatedBy: "Kierra Herwitz", updatedAt: "2026-03-25 18:23" },
  { id: 5, model: "3M15", type: "进口", regNo: "国械注进20257220005", approveDate: "2025-07-22", effectiveDate: "2026-07-22", expireDate: "2031-07-22", updatedBy: "Kierra Herwitz", updatedAt: "2026-03-25 18:23" },
  { id: 6, model: "5M20", type: "进口", regNo: "国械注进20257220006", approveDate: "2025-07-22", effectiveDate: "2026-07-22", expireDate: "2031-07-22", updatedBy: "Doe, Jill", updatedAt: "2026-03-25 18:23" },
  { id: 7, model: "FlexFloor", type: "国产", regNo: "国械注准20257220007", approveDate: "2025-07-22", effectiveDate: "2026-07-22", expireDate: "2031-07-22", updatedBy: "Doe, Jill", updatedAt: "2026-03-25 18:23" },
  { id: 8, model: "7M20", type: "进口", regNo: "国械注进20257220008", approveDate: "2025-07-22", effectiveDate: "2026-07-22", expireDate: "2031-07-22", updatedBy: "Doe, Jill", updatedAt: "2026-03-25 18:23" },
];

// ─── Design tokens from the Figma design ─────────────────────────────────────
// All colours from var(--*) via the kit's style.css
const T = {
  primary: "#0072DB",       // var(--primary)
  fg: "#15191E",            // var(--foreground)
  fgMuted: "#566676",       // var(--muted-foreground)
  border: "#CAD2D8",        // var(--border)
  bg: "#FFFFFF",            // var(--background)
  teal: "#00856F",          // action button label colour
  red: "#C24100",           // error colour
  green: "#007A33",         // success colour
  pill: "#F7F7F7",          // action pill bg
};

const ACCESS_PASSWORD = (import.meta.env.VITE_ACCESS_PASSWORD as string | undefined)?.trim() || "ptr2026";
const ACCESS_STORAGE_KEY = "ptr-prototype-access-ok";
const COMMENTS_STORAGE_KEY = "ptr-prototype-comments-v1";
const COMMENTS_USER_STORAGE_KEY = "ptr-prototype-comments-user-v1";
const COMMENTS_API_URL = (import.meta.env.VITE_COMMENTS_API_URL as string | undefined)?.trim()
  || `${window.location.protocol}//${window.location.hostname}:8787/api/comments`;
const APP_VERSION = (import.meta.env.VITE_APP_VERSION as string | undefined)?.trim() || "v0.2.1";

function normalizeCommentNotes(parsed: unknown): CommentNote[] {
  if (!Array.isArray(parsed)) return [];
  const normalized = parsed.map((item) => {
    if (!item || typeof item !== "object") return null;
    const row = item as Record<string, unknown>;

    const id = typeof row.id === "string" ? row.id : null;
    const itemScope = typeof row.scope === "string" && row.scope.trim() ? row.scope : "main";
    const x = typeof row.x === "number" ? row.x : null;
    const y = typeof row.y === "number" ? row.y : null;
    if (!id || x === null || y === null) return null;

    if (Array.isArray(row.messages)) {
      const messages = row.messages
        .map((msg) => {
          if (!msg || typeof msg !== "object") return null;
          const raw = msg as Record<string, unknown>;
          if (typeof raw.id !== "string" || typeof raw.text !== "string" || typeof raw.createdAt !== "string") return null;
          const author = (() => {
            if (raw.author && typeof raw.author === "object") {
              const a = raw.author as Record<string, unknown>;
              if (typeof a.name === "string") {
                return {
                  name: a.name.trim() || "当前用户",
                  role: typeof a.role === "string" ? a.role : "",
                } satisfies CommentAuthor;
              }
            }
            if (typeof raw.author === "string") {
              return { name: raw.author.trim() || "当前用户", role: "" } satisfies CommentAuthor;
            }
            return { name: "当前用户", role: "" } satisfies CommentAuthor;
          })();
          return {
            id: raw.id,
            text: raw.text,
            createdAt: raw.createdAt,
            author,
          } satisfies CommentMessage;
        })
        .filter((msg): msg is CommentMessage => Boolean(msg));

      if (!messages.length) return null;
      return {
        id,
        scope: itemScope,
        x,
        y,
        resolved: Boolean(row.resolved),
        messages,
      } satisfies CommentNote;
    }

    if (typeof row.text === "string" && typeof row.createdAt === "string") {
      return {
        id,
        scope: itemScope,
        x,
        y,
        resolved: false,
        messages: [{
          id: `${id}-m0`,
          text: row.text,
          createdAt: row.createdAt,
          author: { name: "当前用户", role: "" },
        }],
      } satisfies CommentNote;
    }

    return null;
  });

  return normalized.filter((item): item is CommentNote => Boolean(item));
}

// ─── Icon SVG wrappers using the imported path data ──────────────────────────

const SvgIcon = ({
  d, w, h, vw, vh, color = T.fg,
}: {
  d: string; w: number; h: number; vw: string; vh: string; color?: string;
}) => (
  <svg width={w} height={h} viewBox={`0 0 ${vw} ${vh}`} fill="none">
    <path d={d} fill={color} />
  </svg>
);

// Hamburger / menu
const IMenu = () => <SvgIcon d={svgPaths.p1e933360} w={18} h={10} vw="18" vh="10" />;
// Philips wordmark path
const IWordmark = () => (
  <svg width="87" height="16" viewBox="0 0 87.3029 16" fill="none">
    <path d={svgPaths.p1e373600} fill="#0B5ED7" />
  </svg>
);
// Chevron down
const IChevronDown = ({ color = T.fg }: { color?: string }) =>
  <SvgIcon d={svgPaths.p39ff3e80} w={11} h={7} vw="11.2188" vh="6.06825" color={color} />;
// Chevron right
const IChevronRight = () =>
  <SvgIcon d={svgPaths.p357e6f40} w={6} h={11} vw="6.06825" vh="11.2188" color={T.fgMuted} />;
// Sort
const ISort = () =>
  <SvgIcon d={svgPaths.p2f69de00} w={13} h={11} vw="13.2188" vh="10.5847" color={T.fgMuted} />;
// PTR icon (for new button)
const IPtrNew = () =>
  <SvgIcon d={svgPaths.p2ccf080} w={18} h={21} vw="18" vh="21.002" color="white" />;
// Generator icon
const IGenerator = () =>
  <SvgIcon d={svgPaths.p34b304c0} w={20} h={20} vw="20" vh="20" />;
// PTR Manager sidebar icon
const IPtrManager = () =>
  <SvgIcon d={svgPaths.p2eecd700} w={14} h={20} vw="13.5" vh="19.5" color={T.primary} />;
// AI query icon
const IAiQuery = () =>
  <SvgIcon d={svgPaths.p328fc100} w={21} h={21} vw="20.75" vh="20.75" color={T.fgMuted} />;
// Document library icon
const IDocLib = () =>
  <SvgIcon d={svgPaths.p3c1cb4f0} w={18} h={18} vw="17.5" vh="17.5" color={T.fgMuted} />;
// Regulation library icon
const IRegLib = () =>
  <SvgIcon d={svgPaths.p345c7500} w={20} h={20} vw="19.5" vh="19.5001" color={T.fgMuted} />;
// Edit row icon
const IEdit = () =>
  <SvgIcon d={svgPaths.p2fd85e80} w={20} h={20} vw="20.04" vh="20" />;
// Archive row icon
const IArchive = () =>
  <SvgIcon d={svgPaths.p2792ff80} w={20} h={17} vw="19.5" vh="16.5" color="black" />;
// Close (X) icon
const IClose = ({ color = T.fg }: { color?: string }) =>
  <SvgIcon d={svgPaths.p31579100} w={14} h={14} vw="14.1211" vh="14.1211" color={color} />;
// File OK checkmark (green)
const ICheckGreen = () =>
  <SvgIcon d={svgPaths.p3d3c7380} w={20} h={20} vw="20" vh="20" color={T.green} />;
// Error icon (orange)
const IErrorIcon = () =>
  <SvgIcon d={svgPaths.p1970ad00} w={26} h={26} vw="26" vh="26" color={T.red} />;
// Search icon
const ISearch = () =>
  <SvgIcon d={svgPaths.p1ee48380} w={19} h={19} vw="18.8105" vh="18.8105" />;
// Prev page arrow
const IPrevPage = () =>
  <SvgIcon d={svgPaths.p3615c200} w={9} h={16} vw="8.49982" vh="16.1211" />;
// Next page arrow
const INextPage = () =>
  <SvgIcon d={svgPaths.p21514d80} w={9} h={16} vw="8.49983" vh="16.1211" />;
// Retry / refresh arrows icon (from Frame1000004818)
const IRetry = () =>
  <SvgIcon d={svgPaths2.pfeb7c80} w={20} h={18} vw="19.5" vh="18.0996" />;
// Warning circle icon (orange for upload errors)
const IWarnCircle = () =>
  <SvgIcon d={svgPaths2.p34fe8d00} w={20} h={20} vw="20" vh="20" color="#C24100" />;
// Rocket / generation complete icon
const IRocket = () =>
  <SvgIcon d={svgPaths3.pf09a500} w={20} h={20} vw="26" vh="26" />;
// Calendar icon (for date fields in update recognition dialog)
const ICalendar = () =>
  <SvgIcon d={svgPaths4.p18a0c900} w={20} h={19} vw="19.5" vh="18.5001" color={T.fgMuted} />;

// ─── Global Top Bar ───────────────────────────────────────────────────────────
// Matches: Left() + Right() inside the "Top bar" at the very top of PtrList

function GlobalTopBar({ onLogout }: { onLogout: () => void }) {
  return (
    <div
      className="flex items-center justify-between shrink-0"
      style={{
        height: 56,
        padding: "0 8px",
        background: T.bg,
        borderBottom: `1px solid ${T.border}`,
        position: "relative",
        zIndex: 10,
      }}
    >
      {/* Left: hamburger + Philips wordmark */}
      <div className="flex items-center">
        <button
          className="flex items-center justify-center"
          style={{ background: "transparent", border: "none", padding: 8, borderRadius: 6, cursor: "pointer" }}
        >
          <IMenu />
        </button>
        <div style={{ padding: "0 8px" }}>
          <IWordmark />
        </div>
      </div>

      {/* Right: date-icons placeholder + user menu */}
      <div className="flex items-center gap-2">
        {/* date-icons area: empty in design */}
        <div style={{ width: 381, height: 40 }} />
        <button
          onClick={onLogout}
          style={{
            background: "transparent",
            border: `1px solid ${T.border}`,
            borderRadius: 999,
            padding: "6px 12px",
            cursor: "pointer",
            fontFamily: "'Neue Frutiger One', Inter, sans-serif",
            fontWeight: 700,
            fontSize: 13,
            lineHeight: "20px",
            color: T.fgMuted,
          }}
        >
          退出登录
        </button>
        {/* Menu button */}
        <button
          className="flex items-center gap-2"
          style={{
            background: "transparent",
            border: "none",
            borderRadius: 999,
            padding: "8px 16px",
            cursor: "pointer",
          }}
        >
          <span style={{ fontFamily: "'Neue Frutiger World', Inter, sans-serif", fontWeight: 700, fontSize: 16, lineHeight: "24px", color: T.fg, whiteSpace: "nowrap" }}>
            kz
          </span>
          <IChevronDown />
        </button>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────
// Matches: Sidebar() component from PtrList

function AppSidebar() {
  return (
    <div
      style={{
        width: 301,
        background: T.bg,
        borderRight: `1px solid ${T.border}`,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
        position: "relative",
      }}
    >
      {/* Frame10: nav items without active indicator */}
      {/* AI智能查询 */}
      <NavItem icon={<IAiQuery />} label="AI智能查询" />
      {/* 发补文件库 */}
      <NavItem icon={<IDocLib />} label="发补文件库" />
      {/* 法规知识库 */}
      <NavItem icon={<IRegLib />} label="法规知识库" />

      {/* Active nav item: PTR管理 with blue left indicator */}
      <div
        style={{
          position: "relative",
          borderBottom: `1px solid ${T.border}`,
        }}
      >
        <div className="flex items-center" style={{ padding: "16px 12px" }}>
          {/* Active indicator: 3px wide blue bar on left */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 4,
              bottom: 4,
              width: 3,
              background: T.primary,
              borderRadius: "0 2px 2px 0",
            }}
          />
          <div className="flex items-center gap-2" style={{ flex: 1 }}>
            <IPtrManager />
            <span
              style={{
                fontFamily: "'Neue Frutiger One', Inter, sans-serif",
                fontWeight: 400,
                fontSize: 16,
                lineHeight: "24px",
                color: T.primary,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              PTR管理
            </span>
          </div>
        </div>
      </div>

      {/* 32px spacer */}
      <div style={{ height: 32, background: T.bg }} />

      {/* 你的查询历史 */}
      <div className="flex items-center gap-1" style={{ padding: "8px 16px", background: T.bg }}>
        <IChevronRight />
        <span
          style={{
            fontFamily: "'Neue Frutiger One', Inter, sans-serif",
            fontSize: 16,
            lineHeight: "24px",
            color: T.fgMuted,
            flex: 1,
          }}
        >
          你的查询历史
        </span>
      </div>
    </div>
  );
}

function NavItem({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div
      style={{
        position: "relative",
        borderBottom: `1px solid ${T.border}`,
      }}
    >
      <div className="flex items-center gap-2" style={{ padding: "16px 12px" }}>
        <div style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {icon}
        </div>
        <span
          style={{
            fontFamily: "'Neue Frutiger One', Inter, sans-serif",
            fontSize: 16,
            lineHeight: "24px",
            color: T.fgMuted,
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

// ─── Secondary Top Area ───────────────────────────────────────────────────────
// Matches: TopArea() = Frame383 (breadcrumb) + Frame418 (buttons)

function SecondaryTopBar({ onNewPtr, onGenerator, rowCount }: { onNewPtr: () => void; onGenerator: () => void; rowCount: number }) {
  return (
    <div
      className="flex items-center justify-between shrink-0"
      style={{
        height: 56,
        padding: "10px 24px",
        background: T.bg,
        borderBottom: `1px solid ${T.border}`,
      }}
    >
      {/* Frame383: breadcrumb */}
      <div style={{ width: 286, display: "flex", alignItems: "center" }}>
        <div
          style={{
            display: "flex",
            gap: 8,
            height: 24,
            alignItems: "center",
            borderRadius: 2,
          }}
        >
          <span
            style={{
              fontFamily: "'Neue Frutiger World', Inter, sans-serif",
              fontWeight: 300,
              fontSize: 16,
              lineHeight: "24px",
              color: T.fgMuted,
              whiteSpace: "nowrap",
            }}
          >
            PTR 管理
          </span>
        </div>
      </div>

      {/* Frame418: buttons */}
      <div className="flex items-center gap-[10px]">
        {/* Frame381: 新增 PTR */}
        <button
          onClick={onNewPtr}
          className="flex items-center gap-2"
          style={{
            background: T.primary,
            border: "none",
            borderRadius: 999,
            padding: "8px 16px",
            cursor: "pointer",
          }}
        >
          <div style={{ width: 24, height: 24, overflow: "hidden", position: "relative" }}>
            <IPtrNew />
          </div>
          <span
            style={{
              fontFamily: "'Neue Frutiger World', Inter, sans-serif",
              fontWeight: 700,
              fontSize: 16,
              lineHeight: "24px",
              color: "white",
              whiteSpace: "nowrap",
            }}
          >
            新增 PTR
          </span>
        </button>

        {/* Frame382: PTR 生成器 (outlined) */}
        <button
          onClick={onGenerator}
          className="flex items-center gap-2"
          style={{
            background: "transparent",
            border: `2px solid ${T.fg}`,
            borderRadius: 999,
            padding: "8px 16px",
            cursor: "pointer",
            position: "relative",
          }}
        >
          <div style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <IGenerator />
          </div>
          <span
            style={{
              fontFamily: "'Neue Frutiger World', Inter, sans-serif",
              fontWeight: 700,
              fontSize: 16,
              lineHeight: "24px",
              color: T.fg,
              whiteSpace: "nowrap",
            }}
          >
            PTR 生成器
          </span>
        </button>
      </div>
    </div>
  );
}

// ─── Data Table ───────────────────────────────────────────────────────────────
// Matches: DataGrid / DatagridContainer from PtrList

const COLS = [
  { key: "model", label: "产品型号", flex: 14 },
  { key: "type", label: "类型", flex: 8 },
  { key: "regNo", label: "注册证号", flex: 22 },
  { key: "approveDate", label: "批准日期", flex: 15 },
  { key: "effectiveDate", label: "生效日期", flex: 15 },
  { key: "expireDate", label: "有效期至", flex: 15 },
  { key: "updatedBy", label: "最后更新人", flex: 17 },
  { key: "updatedAt", label: "最近更新", flex: 18, alignRight: true },
  { key: "actions", label: "操作", flex: 16 },
];

function SortHeader({ label, active, dir, onClick }: { label: string; active?: boolean; dir?: "asc" | "desc"; onClick?: () => void }) {
  return (
    <div onClick={onClick} className="flex items-center gap-1" style={{ padding: "8px 12px", minHeight: 48, cursor: "pointer", userSelect: "none" }}>
      <span
        style={{
          fontFamily: "'Neue Frutiger One', Inter, sans-serif",
          fontWeight: active ? 400 : 300,
          fontSize: 14,
          lineHeight: "20px",
          color: active ? T.primary : T.fgMuted,
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </span>
      <div style={{ display: "flex", alignItems: "center", opacity: active ? 1 : 0.6, transform: active && dir === "desc" ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>
        <ISort />
      </div>
    </div>
  );
}

const pillBtn: React.CSSProperties = {
  height: 28,
  padding: "4px",
  borderRadius: "var(--button-border-radius-round, 999px)",
  background: "var(--button-background-secondary-default, rgba(0, 67, 138, 0.06))",
  border: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};
const pillText: React.CSSProperties = {
  fontFamily: "'Montserrat', 'Neue Frutiger One', Inter, sans-serif",
  fontWeight: 600,
  fontSize: 16,
  lineHeight: "normal",
  color: "#000000",
  whiteSpace: "nowrap",
};

function ActionButtons({ onArchive, onUpdate, onDetail }: { onArchive?: () => void; onUpdate?: () => void; onDetail?: () => void }) {
  return (
    <div className="flex items-center gap-2" style={{ padding: "8px 12px" }}>
      <button style={{ ...pillBtn, width: 56 }} onClick={onDetail}>
        <span style={pillText}>详情</span>
      </button>
      <button style={{ ...pillBtn, width: 63 }} onClick={onArchive}>
        <span style={pillText}>归档</span>
      </button>
    </div>
  );
}

function PtrDataGrid({ rows, onArchive, onUpdate, onDetail }: { rows: PtrRow[]; onArchive?: (row: PtrRow) => void; onUpdate?: (row: PtrRow) => void; onDetail?: (row: PtrRow) => void }) {
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" } | null>(null);

  const toggleSort = (key: string) =>
    setSort(prev => {
      if (!prev || prev.key !== key) return { key, dir: "asc" };
      if (prev.dir === "asc") return { key, dir: "desc" };
      return null; // 第三次点击取消排序
    });

  const sortedRows = sort
    ? [...rows].sort((a, b) => {
        const av = String((a as unknown as Record<string, unknown>)[sort.key] ?? "");
        const bv = String((b as unknown as Record<string, unknown>)[sort.key] ?? "");
        const cmp = av.localeCompare(bv, "zh-Hans-CN", { numeric: true });
        return sort.dir === "asc" ? cmp : -cmp;
      })
    : rows;

  return (
    <div
      style={{
        background: T.bg,
        borderRadius: 0,
        borderTop: `1px solid ${T.border}`,
        borderBottom: `1px solid ${T.border}`,
        overflow: "hidden",
        width: "100%",
      }}
    >
      {/* Header row */}
      <div className="flex" style={{ borderBottom: `1px solid ${T.border}` }}>
        {COLS.map(col => (
          <div
            key={col.key}
            style={{ flex: col.flex, minWidth: 0, border: "none" }}
          >
            {col.key === "actions"
              ? <div style={{ padding: "8px 12px", minHeight: 48, display: "flex", alignItems: "center" }}>
                  <span style={{ fontFamily: "'Neue Frutiger One', Inter, sans-serif", fontWeight: 300, fontSize: 14, lineHeight: "20px", color: T.fgMuted }}>操作</span>
                </div>
              : <SortHeader
                  label={col.label}
                  active={sort?.key === col.key}
                  dir={sort?.key === col.key ? sort.dir : undefined}
                  onClick={() => toggleSort(col.key)}
                />
            }
          </div>
        ))}
      </div>

      {/* Data rows */}
      {sortedRows.map(row => (
        <motion.div
          key={row.id}
          {...(row.isNew ? {
            initial: { backgroundColor: "rgba(0,114,219,0.06)" },
            animate: { backgroundColor: "rgba(0,114,219,0)" },
            transition: { duration: 2, delay: 0.3 },
          } : {})}
          className="flex"
          style={{ height: 80, borderBottom: `1px solid ${T.border}` }}
        >
          {COLS.map(col => (
            <div
              key={col.key}
              style={{
                flex: col.flex,
                minWidth: 0,
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: col.alignRight ? "flex-end" : "flex-start",
                border: "none",
              }}
            >
              {col.key === "actions"
                ? <ActionButtons onArchive={() => onArchive?.(row)} onUpdate={() => onUpdate?.(row)} onDetail={() => onDetail?.(row)} />
                : <div style={{ padding: "8px 12px", overflow: "hidden", width: "100%", minWidth: 0 }}>
                    <span
                      style={{
                        fontFamily: "'Neue Frutiger One', Inter, sans-serif",
                        fontWeight: 400,
                        fontSize: 16,
                        lineHeight: "24px",
                        color: T.fg,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        display: "block",
                      }}
                    >
                      {row[col.key as keyof PtrRow] as string}
                    </span>
                  </div>
              }
            </div>
          ))}
        </motion.div>
      ))}

      {/* Footer: Entries + Pagination */}
      <div
        className="flex items-center justify-between"
        style={{
          padding: "8px 8px 8px 24px",
          borderTop: `1px solid ${T.border}`,
        }}
      >
        {/* Entries per page */}
        <div className="flex items-center gap-2">
          <span style={{ fontFamily: "'Neue Frutiger One', Inter, sans-serif", fontSize: 12, lineHeight: "18px", color: T.fgMuted, whiteSpace: "nowrap" }}>
            Entries per page
          </span>
          <div className="flex items-center" style={{ padding: "8px 8px 8px 12px", borderRadius: 6 }}>
            <span style={{ fontFamily: "'Neue Frutiger One', Inter, sans-serif", fontSize: 16, lineHeight: "24px", color: T.fg, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {rows.length}
            </span>
            <div style={{ paddingLeft: 8 }}><IChevronDown /></div>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center gap-2">
          <span style={{ fontFamily: "'Neue Frutiger One', Inter, sans-serif", fontSize: 12, lineHeight: "18px", color: T.fgMuted }}>Page</span>
          <div style={{ width: 52, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div
              style={{
                background: T.bg,
                borderRadius: 4,
                border: `1px solid #6b8094`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
              }}
            >
              <div style={{ padding: "4px 8px" }}>
                <span style={{ fontFamily: "'Neue Frutiger One', Inter, sans-serif", fontSize: 16, lineHeight: "24px", color: T.fg }}>1</span>
              </div>
            </div>
          </div>
          <span style={{ fontFamily: "'Neue Frutiger One', Inter, sans-serif", fontSize: 12, lineHeight: "18px", color: T.fgMuted }}>of 2</span>
          <div className="flex items-center gap-1">
            <button style={{ background: "transparent", border: "none", padding: 8, borderRadius: 6, opacity: 0.32, cursor: "default" }}><IPrevPage /></button>
            <button style={{ background: "transparent", border: "none", padding: 8, borderRadius: 6, cursor: "pointer" }}><INextPage /></button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Upload Dialog ────────────────────────────────────────────────────────────
// Matches: Dialog (PtrPtr1) — "新增产品 PTR" with 4 file upload rows

const INIT_SLOTS: FileSlot[] = [
  { label: "注册证书（pdf）",    required: true,  file: null, status: "idle" },
  { label: "获批PTR（pdf）",     required: true,  file: null, status: "idle" },
  { label: "获批PTR中文版（docx）",       required: false, file: null, status: "idle" },
  { label: "获批PTR英文版（docx）", required: false, file: null, status: "idle" },
];

const INIT_SLOT_FILES = [
  "NMPA_Azurion_FlexPlus_注册证书.PDF",
  "PTR_Azurion_FlexPlus.PDF",
  "PTR_Azurion_FlexPlus.docx",
  "PTR_Azurion_FlexPlus_EN.docx",
];

function UploadDialog({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  const [slots, setSlots] = useState<FileSlot[]>(INIT_SLOTS.map(s => ({ ...s })));

  const requiredDone = slots.filter(s => s.required).every(s => s.status === "done");

  const browse = (idx: number) => {
    setSlots(prev => prev.map((s, i) => i === idx ? { ...s, status: "uploading", file: INIT_SLOT_FILES[idx] } : s));
    const delay = idx === 1 ? 1200 : 800;
    setTimeout(() => {
      setSlots(prev => prev.map((s, i) => {
        if (i !== idx) return s;
        return { ...s, status: "done" };
      }));
    }, delay);
  };

  const remove = (idx: number) => {
    setSlots(prev => prev.map((s, i) => i === idx ? { ...s, status: "idle", file: null } : s));
  };

  const retry = (idx: number) => {
    setSlots(prev => prev.map((s, i) => i === idx ? { ...s, status: "idle", file: null } : s));
  };

  const fontBase: React.CSSProperties = {
    fontFamily: "'Neue Frutiger One', Inter, sans-serif",
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -10 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      style={{
        background: T.bg,
        borderRadius: 12,
        border: `1px solid ${T.border}`,
        boxShadow: "0px 0px 1px rgba(58,69,80,0.16), 0px 16px 8px rgba(58,69,80,0.08), 0px 24px 16px rgba(58,69,80,0.16)",
        width: 500,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Dialog header */}
      <div
        className="flex items-center gap-2"
        style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ ...fontBase, fontWeight: 700, fontSize: 20, lineHeight: "24px", color: T.fg }}>
            新增产品 PTR
          </span>
        </div>
        <button
          onClick={onCancel}
          style={{ background: "transparent", border: "none", padding: 8, borderRadius: 999, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
        >
          <IClose />
        </button>
      </div>

      {/* Dialog content: flex-wrap with 460px items stacking vertically */}
      <div style={{ padding: "20px 20px 8px", display: "flex", flexWrap: "wrap", gap: 12 }}>
        {slots.map((slot, idx) => (
          <React.Fragment key={idx}>
            {/* Upload row: label + 浏览 */}
            <div style={{ width: 460, display: "flex", alignItems: "center", gap: 8 }}>
              {/* Label: label text + optional red asterisk for required */}
              <div style={{ flex: 1, minWidth: 0, display: "flex", alignItems: "center", alignSelf: "stretch" }}>
                <span style={{ ...fontBase, fontWeight: 400, fontSize: 16, lineHeight: "24px", color: T.fg }}>
                  {slot.label}
                  {slot.required && <span style={{ color: "#D60012" }}> *</span>}
                </span>
              </div>
              <button
                onClick={() => slot.status === "idle" ? browse(idx) : undefined}
                style={{
                  background: "rgba(0,67,138,0.06)",
                  border: "none",
                  borderRadius: 6,
                  padding: "8px 12px",
                  cursor: slot.status === "idle" ? "pointer" : "default",
                  flexShrink: 0,
                }}
              >
                <span style={{ ...fontBase, fontWeight: 700, fontSize: 16, lineHeight: "24px", color: T.fg }}>
                  浏览
                </span>
              </button>
            </div>

            {/* File item row — shown when status is not idle */}
            <AnimatePresence>
              {slot.status !== "idle" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.18 }}
                  style={{ width: 460, overflow: "hidden" }}
                >
                  <div style={{ background: "#f6f8f9", borderRadius: 6, display: "flex", alignItems: "center", gap: 8, padding: 8 }}>
                    {/* Status icon */}
                    <div style={{ width: 24, height: 24, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {slot.status === "uploading" && (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                          style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${T.border}`, borderTopColor: T.primary }}
                        />
                      )}
                      {slot.status === "done" && <ICheckGreen />}
                      {slot.status === "error" && <IWarnCircle />}
                    </div>

                    {/* File info: name + size or error message */}
                    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 0 }}>
                      <span style={{ ...fontBase, fontWeight: 300, fontSize: 16, lineHeight: "24px", color: "#0061C2", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block" }}>
                        {slot.file ?? "上传中..."}
                      </span>
                      {slot.status === "uploading" && (
                        <span style={{ ...fontBase, fontWeight: 400, fontSize: 14, lineHeight: "20px", color: T.fgMuted }}>
                          正在上传...
                        </span>
                      )}
                      {slot.status === "done" && (
                        <span style={{ ...fontBase, fontWeight: 400, fontSize: 14, lineHeight: "20px", color: T.fgMuted }}>
                          (3.2 MB)
                        </span>
                      )}
                      {slot.status === "error" && (
                        <span style={{ ...fontBase, fontWeight: 400, fontSize: 12, lineHeight: "18px", color: T.fgMuted }}>
                          Server error. Please try again
                        </span>
                      )}
                    </div>

                    {/* Right action: delete (done) or retry (error) */}
                    {slot.status === "done" && (
                      <button
                        onClick={() => remove(idx)}
                        style={{ background: "transparent", border: "none", borderRadius: 999, padding: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        <svg width="15" height="19" viewBox="0 0 15.5 19.5" fill="none">
                          <path d={svgPaths.p28f2500} fill={T.fg} />
                        </svg>
                      </button>
                    )}
                    {slot.status === "error" && (
                      <button
                        onClick={() => retry(idx)}
                        style={{ background: "transparent", border: "none", borderRadius: 999, padding: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                      >
                        <IRetry />
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </React.Fragment>
        ))}
      </div>

      {/* Dialog footer */}
      <div className="flex items-center justify-end gap-2" style={{ padding: "8px 20px 16px" }}>
        <button
          onClick={onCancel}
          style={{ background: "transparent", border: "none", borderRadius: 999, padding: "8px 16px", cursor: "pointer" }}
        >
          <span style={{ ...fontBase, fontWeight: 700, fontSize: 16, lineHeight: "24px", color: T.fg }}>
            取消
          </span>
        </button>
        <button
          onClick={requiredDone ? onConfirm : undefined}
          style={{
            background: T.primary,
            border: "none",
            borderRadius: 999,
            padding: "8px 16px",
            cursor: requiredDone ? "pointer" : "not-allowed",
            opacity: requiredDone ? 1 : 0.32,
          }}
        >
          <span style={{ ...fontBase, fontWeight: 700, fontSize: 16, lineHeight: "24px", color: "white" }}>
            确认
          </span>
        </button>
      </div>
    </motion.div>
  );
}

// ─── Reading / Processing Dialog ──────────────────────────────────────────────
// Matches: PtrPtr6 — "数据处理中" with spinner + subtitle

function ReadingDialog({ label = "正在识别PTR注册证书中的相关数据...", title = "数据处理中" }: { label?: string; title?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.18 }}
      style={{
        background: T.bg,
        borderRadius: 12,
        border: `1px solid ${T.border}`,
        boxShadow: "0px 0px 1px rgba(58,69,80,0.16), 0px 16px 8px rgba(58,69,80,0.08), 0px 24px 16px rgba(58,69,80,0.16)",
        width: 600,
        padding: "48px 40px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 40,
      }}
    >
      {/* Title */}
      <span style={{ fontFamily: "'Neue Frutiger One', Inter, sans-serif", fontWeight: 700, fontSize: 24, lineHeight: "28px", color: T.fg }}>
        {title}
      </span>

      {/* 48px spinner */}
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
        style={{
          width: 48,
          height: 48,
          borderRadius: "50%",
          border: `4px solid ${T.border}`,
          borderTopColor: T.primary,
          flexShrink: 0,
        }}
      />

      {/* Subtitle label */}
      <span style={{ fontFamily: "'Neue Frutiger One', Inter, sans-serif", fontWeight: 300, fontSize: 16, lineHeight: "24px", color: T.fgMuted, textAlign: "center" }}>
        {label}
      </span>
    </motion.div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
// Matches: PtrPtr4 — "新增产品PTR -识别结果" with form fields

function ConfirmDialog({
  form,
  onChange,
  onCancel,
  onConfirm,
  title = "新增产品PTR -识别结果",
  confirmText = "确认新增",
}: {
  form: ConfirmForm;
  onChange: (f: ConfirmForm) => void;
  onCancel: () => void;
  onConfirm: () => void;
  title?: string;
  confirmText?: string;
}) {
  const inputStyle: React.CSSProperties = {
    background: T.bg,
    border: `1px solid #6b8094`,
    borderRadius: 6,
    padding: "8px 12px",
    fontSize: 16,
    fontFamily: "'Neue Frutiger One', Inter, sans-serif",
    fontWeight: 400,
    lineHeight: "24px",
    color: T.fg,
    width: "100%",
    outline: "none",
    boxSizing: "border-box",
  };

  const handleSource = (src: "进口" | "国产") => {
    let model = form.model;
    if (src === "国产" && !model.endsWith(" L4L")) model = model + " L4L";
    if (src === "进口" && model.endsWith(" L4L")) model = model.slice(0, -4);
    onChange({ ...form, source: src, model });
  };

  const FormRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex items-start gap-[10px]" style={{ width: "100%" }}>
      <div style={{ width: 120, height: 40, display: "flex", alignItems: "center", flexShrink: 0 }}>
        <span style={{ fontFamily: "'Neue Frutiger One', Inter, sans-serif", fontWeight: 400, fontSize: 16, lineHeight: "24px", color: T.fg, whiteSpace: "nowrap" }}>
          {label}
        </span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -10 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      style={{
        background: T.bg,
        borderRadius: 12,
        border: `1px solid ${T.border}`,
        boxShadow: "0px 0px 1px rgba(58,69,80,0.16), 0px 16px 8px rgba(58,69,80,0.08), 0px 24px 16px rgba(58,69,80,0.16)",
        width: 520,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2" style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ flex: 1 }}>
          <span style={{ fontFamily: "'Neue Frutiger One', Inter, sans-serif", fontWeight: 700, fontSize: 20, lineHeight: "24px", color: T.fg }}>
            {title}
          </span>
        </div>
        <button onClick={onCancel} style={{ background: "transparent", border: "none", padding: 8, borderRadius: 999, cursor: "pointer", display: "flex", alignItems: "center" }}>
          <IClose />
        </button>
      </div>

      {/* Form */}
      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>

        {/* 产品来源 - radio */}
        <FormRow label="产品来源:">
          <div className="flex items-center gap-6" style={{ height: 40 }}>
            {(["进口", "国产"] as const).map(opt => (
              <label key={opt} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <div
                  onClick={() => handleSource(opt)}
                  style={{
                    width: 20, height: 20, borderRadius: "50%",
                    border: `2px solid ${form.source === opt ? T.primary : "#6b8094"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, transition: "border-color 0.15s",
                    background: T.bg,
                  }}
                >
                  {form.source === opt && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      style={{ width: 10, height: 10, borderRadius: "50%", background: T.primary }}
                    />
                  )}
                </div>
                <span style={{ fontFamily: "'Neue Frutiger One', Inter, sans-serif", fontWeight: 400, fontSize: 16, lineHeight: "24px", color: T.fg }}>
                  {opt}
                </span>
              </label>
            ))}
          </div>
        </FormRow>

        {/* 产品型号 - active/focused state with blue border */}
        <FormRow label="产品型号:">
          <div style={{ height: 40 }}>
            <input
              value={form.model}
              onChange={e => onChange({ ...form, model: e.target.value })}
              style={{ ...inputStyle, border: `2px solid ${T.primary}`, boxShadow: `0 0 0 2px ${T.primary}22` }}
            />
          </div>
        </FormRow>

        {/* 注册证号 */}
        <FormRow label="注册证号:">
          <div style={{ height: 40 }}>
            <input value={form.regNo} onChange={e => onChange({ ...form, regNo: e.target.value })} style={inputStyle} />
          </div>
        </FormRow>

        {/* 批准日期 */}
        <FormRow label="批准日期:">
          <div style={{ height: 40 }}>
            <div style={{ ...inputStyle, display: "flex", alignItems: "center", padding: 0 }}>
              <input
                type="date"
                value={form.approveDate}
                onChange={e => onChange({ ...form, approveDate: e.target.value })}
                style={{ border: "none", outline: "none", flex: 1, padding: "8px 12px", fontSize: 16, fontFamily: "'Neue Frutiger One', Inter, sans-serif", color: T.fg, background: "transparent" }}
              />
            </div>
          </div>
        </FormRow>

        {/* 生效日期 */}
        <FormRow label="生效日期:">
          <div style={{ height: 40 }}>
            <div style={{ ...inputStyle, display: "flex", alignItems: "center", padding: 0 }}>
              <input
                type="date"
                value={form.effectiveDate}
                onChange={e => onChange({ ...form, effectiveDate: e.target.value })}
                style={{ border: "none", outline: "none", flex: 1, padding: "8px 12px", fontSize: 16, fontFamily: "'Neue Frutiger One', Inter, sans-serif", color: T.fg, background: "transparent" }}
              />
            </div>
          </div>
        </FormRow>

        {/* 有效期至 */}
        <FormRow label="有效期至:">
          <div style={{ height: 40 }}>
            <div style={{ ...inputStyle, display: "flex", alignItems: "center", padding: 0 }}>
              <input
                type="date"
                value={form.expireDate}
                onChange={e => onChange({ ...form, expireDate: e.target.value })}
                style={{ border: "none", outline: "none", flex: 1, padding: "8px 12px", fontSize: 16, fontFamily: "'Neue Frutiger One', Inter, sans-serif", color: T.fg, background: "transparent" }}
              />
            </div>
          </div>
        </FormRow>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2" style={{ padding: "0 20px 16px" }}>
        <button onClick={onCancel} style={{ background: "transparent", border: "none", borderRadius: 999, padding: "8px 16px", cursor: "pointer" }}>
          <span style={{ fontFamily: "'Neue Frutiger One', Inter, sans-serif", fontWeight: 700, fontSize: 16, lineHeight: "24px", color: T.fg }}>取消</span>
        </button>
        <button
          onClick={onConfirm}
          style={{ background: T.primary, border: "none", borderRadius: 999, padding: "8px 16px", cursor: "pointer" }}
        >
          <span style={{ fontFamily: "'Neue Frutiger One', Inter, sans-serif", fontWeight: 700, fontSize: 16, lineHeight: "24px", color: "white" }}>{confirmText}</span>
        </button>
      </div>
    </motion.div>
  );
}

// ─── Error Dialog ─────────────────────────────────────────────────────────────
// Matches: PtrPtr5 — "新增失败" dialog

function ErrorDialog({ onRetry, onDismiss }: { onRetry: () => void; onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -10 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      style={{
        background: "#FFF5F0",
        borderRadius: 12,
        border: `1px solid #C24100`,
        boxShadow: "0px 0px 1px rgba(58,69,80,0.16), 0px 16px 8px rgba(58,69,80,0.08), 0px 24px 16px rgba(58,69,80,0.16)",
        width: 480,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2" style={{ padding: "16px 20px", borderBottom: `1px solid #C24100` }}>
        <div style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <IErrorIcon />
        </div>
        <span style={{ fontFamily: "'Neue Frutiger One', Inter, sans-serif", fontWeight: 700, fontSize: 20, lineHeight: "24px", color: T.red, flex: 1 }}>
          新增失败
        </span>
        <button onClick={onDismiss} style={{ background: "transparent", border: "none", padding: 8, borderRadius: 999, cursor: "pointer", display: "flex", alignItems: "center" }}>
          <IClose color={T.fgMuted} />
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: 20 }}>
        <p style={{ fontFamily: "'Neue Frutiger One', Inter, sans-serif", fontWeight: 400, fontSize: 16, lineHeight: "24px", color: T.fg }}>
          注册证书识别失败，请检查文件后重试。
        </p>
        <p style={{ fontFamily: "'Neue Frutiger One', Inter, sans-serif", fontWeight: 300, fontSize: 16, lineHeight: "24px", color: T.fg, marginTop: 8 }}>
          这里是系统根据失败原因，展示的一段提示内容，告知用户具体原因。
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2" style={{ padding: "0 20px 16px" }}>
        <button onClick={onDismiss} style={{ background: "transparent", border: "none", borderRadius: 999, padding: "8px 16px", cursor: "pointer" }}>
          <span style={{ fontFamily: "'Neue Frutiger One', Inter, sans-serif", fontWeight: 700, fontSize: 16, color: T.fg }}>知道了</span>
        </button>
        <button onClick={onRetry} style={{ background: "#FF5500", border: "none", borderRadius: 999, padding: "8px 16px", cursor: "pointer" }}>
          <span style={{ fontFamily: "'Neue Frutiger One', Inter, sans-serif", fontWeight: 700, fontSize: 16, color: "white" }}>重试</span>
        </button>
      </div>
    </motion.div>
  );
}

// ─── Success Toast ─────────────────────────────────────────────────────────────
// Matches: Frame447 / 成功 state in PtrPtr

function SuccessToast({ model, onClose, message }: { model: string; onClose: () => void; message?: string }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -12, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -12, scale: 0.97 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      style={{
        background: "#E0FFED",
        borderRadius: 12,
        border: `1px solid ${T.green}`,
        padding: 12,
        display: "flex",
        alignItems: "center",
        gap: 8,
        minWidth: 360,
        maxWidth: 480,
        boxShadow: "0px 0px 1px rgba(58,69,80,0.16), 0px 16px 8px rgba(58,69,80,0.08), 0px 24px 16px rgba(58,69,80,0.16)",
      }}
    >
      {/* Green checkmark icon */}
      <div style={{ flexShrink: 0, width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <ICheckGreen />
      </div>
      <span style={{ fontFamily: "'Neue Frutiger One', Inter, sans-serif", fontWeight: 300, fontSize: 16, lineHeight: "24px", color: T.fg, flex: 1, minWidth: 0 }}>
        {message ?? `新产品${model} PTR已创建成功。`}
      </span>
      <button
        onClick={onClose}
        style={{ background: "transparent", border: "none", borderRadius: 999, padding: 8, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
      >
        <IClose />
      </button>
    </motion.div>
  );
}

// ─── Generator Form Dialog ────────────────────────────────────────────────────
// Triggered by "PTR 生成器" button — 3 tabs, each with file upload slots

const GEN_TAB_SLOTS: Record<GenTab, FileSlot[]> = {
  "PTR对比表生成": [
    { label: "上传当前PTR（word）", required: true, file: null, status: "idle" },
    { label: "上传变更后PTR（word）", required: true, file: null, status: "idle" },
  ],
  "单PTR生成": [
    { label: "上传当前PTR（word）", required: true, file: null, status: "idle" },
    { label: "上传PTR变更表（word）", required: true, file: null, status: "idle" },
  ],
  "批量PTR生成": [
    { label: "上传变更后PTR（excl）", required: true, file: null, status: "idle" },
  ],
};

const GEN_MOCK_FILES: Record<GenTab, string[]> = {
  "PTR对比表生成": ["PTR_Azurion_3M12_当前版本.docx", "PTR_Azurion_3M12_变更后.docx"],
  "单PTR生成": ["PTR_Azurion_3M12_当前版本.docx", "PTR_变更表_Azurion_3M12.docx"],
  "批量PTR生成": ["PTR_批量_Azurion.xlsx"],
};

const GEN_TIPS_BY_TAB: Record<GenTab, string[]> = {
  "PTR对比表生成": [
    "系统将基于当前PTR和变更后PTR生成PTR对比表。",
    "请确认产品型号、语言版本和文件版本是否一致。",
    "下载后请在线下Docx中完成最终审阅和格式调整。",
  ],
  "单PTR生成": [
    "系统将基于当前PTR和PTR变更表合并生成最新版PTR。",
    "当前PTR用于作为合并基准，请确认文件版本正确。",
    "下载后请在线下docx中完成最终审阅和格式调整。",
  ],
  "批量PTR生成": [
    "系统将从Family PTR中识别可生成的型号，可批量勾选。",
    "下载结果将按所选型号打包为ZIP压缩包。",
  ],
};

// 批量PTR生成下按物料类型细分 Tips
const GEN_BATCH_TIPS_BY_MATERIAL: Record<BatchMaterialType, string[]> = {
  "生成PTR": [
    "系统将从Family PTR中识别可生成的型号，可批量勾选。",
    "下载结果将按所选型号打包为ZIP压缩包。",
  ],
  "生成PTR对比表": [
    "系统将从变更后PTR中识别可生成的型号，可批量勾选。",
    "生成PTR对比表时需为已选型号上传对应当前PTR。",
    "下载结果将按所选型号打包为ZIP压缩包。",
  ],
};

function GeneratorFormDialog({
  onCancel,
  onGenerate,
}: {
  onCancel: () => void;
  onGenerate: (tab: GenTab) => void;
}) {
  const [activeTab, setActiveTab] = useState<GenTab>("PTR对比表生成");
  const [slots, setSlots] = useState<FileSlot[]>(GEN_TAB_SLOTS["PTR对比表生成"].map(s => ({ ...s })));
  const [batchMaterialType, setBatchMaterialType] = useState<BatchMaterialType>("生成PTR");
  const [checkedModels, setCheckedModels] = useState<Set<string>>(new Set());
  const [modelFiles, setModelFiles] = useState<Record<string, { status: "idle" | "uploading" | "done" | "error"; file: string | null }>>({});

  const toggleModel = (model: string) => {
    const isChecking = !checkedModels.has(model);
    setCheckedModels(prev => { const s = new Set(prev); s.has(model) ? s.delete(model) : s.add(model); return s; });
    // 生成PTR对比表: 勾选 → 自动打开文件选择；取消勾选 → 移除已上传文件
    if (batchMaterialType === "生成PTR对比表") {
      if (isChecking) {
        const mf = modelFiles[model];
        if (!mf || mf.status === "idle") browseModel(model);
      } else {
        removeModel(model);
      }
    }
  };

  const browseModel = (model: string) => {
    setModelFiles(prev => ({ ...prev, [model]: { status: "uploading", file: null } }));
    setTimeout(() => {
      setModelFiles(prev => ({ ...prev, [model]: { status: "done", file: `PTR_${model}_变更版本.docx` } }));
      // 上传完成 → 自动勾选对应型号
      setCheckedModels(prev => { const s = new Set(prev); s.add(model); return s; });
    }, 700);
  };

  const removeModel = (model: string) =>
    setModelFiles(prev => ({ ...prev, [model]: { status: "idle", file: null } }));

  const fontBase: React.CSSProperties = { fontFamily: "'Neue Frutiger One', Inter, sans-serif" };

  const switchTab = (tab: GenTab) => {
    setActiveTab(tab);
    setSlots(GEN_TAB_SLOTS[tab].map(s => ({ ...s })));
  };

  const excelUploaded = activeTab === "批量PTR生成" && slots.every(s => s.status === "done");
  const requiredDone = slots.filter(s => s.required).every(s => s.status === "done")
    && (!excelUploaded || checkedModels.size > 0);

  const browse = (idx: number) => {
    setSlots(prev => prev.map((s, i) => i === idx ? { ...s, status: "uploading" } : s));
    setTimeout(() => {
      setSlots(prev => prev.map((s, i) => {
        if (i !== idx) return s;
        return { ...s, status: "done", file: GEN_MOCK_FILES[activeTab][idx] };
      }));
    }, 700);
  };

  const remove = (idx: number) => {
    setSlots(prev => prev.map((s, i) => i === idx ? { ...s, status: "idle", file: null } : s));
  };

  const TABS: GenTab[] = ["PTR对比表生成", "单PTR生成", "批量PTR生成"];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -10 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      style={{
        background: T.bg, borderRadius: 12, border: `1px solid ${T.border}`,
        boxShadow: "0px 0px 1px rgba(58,69,80,0.16), 0px 16px 8px rgba(58,69,80,0.08), 0px 24px 16px rgba(58,69,80,0.16)",
        width: 488, display: "flex", flexDirection: "column",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2" style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <IGenerator />
        </div>
        <span style={{ ...fontBase, fontWeight: 700, fontSize: 20, lineHeight: "24px", color: T.fg, flex: 1 }}>
          PTR生成器
        </span>
        <button onClick={onCancel} style={{ background: "transparent", border: "none", padding: 8, borderRadius: 999, cursor: "pointer", display: "flex", alignItems: "center" }}>
          <IClose />
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Tab bar */}
        <div style={{ display: "flex", width: 448, borderBottom: `1px solid ${T.border}` }}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => switchTab(tab)}
              style={{
                flex: 1, border: "none", background: "transparent", cursor: "pointer",
                padding: "16px 12px 0",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              }}
            >
              <span style={{ ...fontBase, fontSize: 16, lineHeight: "24px", color: activeTab === tab ? T.primary : T.fgMuted }}>
                {tab}
              </span>
              <div style={{ height: 2, width: "100%", background: activeTab === tab ? T.primary : "transparent", borderRadius: 1 }} />
            </button>
          ))}
        </div>

        {/* Batch material type (only for 批量PTR生成) */}
        {activeTab === "批量PTR生成" && (
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <div style={{ width: 120, height: 40, display: "flex", alignItems: "center", flexShrink: 0 }}>
              <span style={{ ...fontBase, fontSize: 16, lineHeight: "24px", color: T.fg, whiteSpace: "nowrap" }}>生成材料类型:</span>
            </div>
            <div style={{ display: "flex", gap: 16, alignItems: "center", height: 40 }}>
              {(["生成PTR", "生成PTR对比表"] as BatchMaterialType[]).map(opt => (
                <label key={opt} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                  <div
                    onClick={() => setBatchMaterialType(opt)}
                    style={{
                      width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                      background: batchMaterialType === opt ? T.primary : T.bg,
                      border: batchMaterialType === opt ? "none" : `1px solid #6b8094`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    {batchMaterialType === opt && (
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "white" }} />
                    )}
                  </div>
                  <span style={{ ...fontBase, fontSize: 16, lineHeight: "24px", color: T.fg }}>{opt}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* File upload slots */}
        {slots.map((slot, idx) => (
          <React.Fragment key={`${activeTab}-${idx}`}>
            {/* Upload row */}
            <div style={{ width: 448, display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ ...fontBase, fontSize: 16, lineHeight: "24px", color: T.fg }}>
                  {slot.label}
                  {slot.required && <span style={{ color: "#D60012" }}> *</span>}
                </span>
              </div>
              <button
                onClick={() => (slot.status === "idle" || slot.status === "error") && browse(idx)}
                disabled={slot.status === "uploading"}
                style={{
                  background: "rgba(0,67,138,0.06)", border: "none", borderRadius: 6,
                  padding: "8px 12px", cursor: slot.status === "uploading" ? "default" : "pointer",
                  flexShrink: 0, opacity: slot.status === "uploading" ? 0.5 : 1,
                }}
              >
                <span style={{ ...fontBase, fontWeight: 700, fontSize: 16, lineHeight: "24px", color: T.fg }}>Browse</span>
              </button>
            </div>
            {/* File item row */}
            <AnimatePresence>
              {slot.status !== "idle" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }}
                  style={{ overflow: "hidden" }}
                >
                  <div style={{ background: T.bg, borderRadius: 6, border: `1px solid ${T.border}`, padding: "8px 12px", display: "flex", flexDirection: "column", gap: 0, maxHeight: 420, overflowY: "auto" }}>
                    {/* File info row */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {slot.status === "uploading"
                          ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                              style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${T.border}`, borderTopColor: T.primary }} />
                          : slot.status === "error"
                            ? <IWarnCircle />
                            : <ICheckGreen />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                        <span style={{ ...fontBase, fontSize: 16, lineHeight: "24px", color: slot.status === "error" ? T.fg : "#0061C2", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {slot.file ?? "上传中..."}
                        </span>
                        {slot.status === "done" && (
                          <span style={{ ...fontBase, fontSize: 12, lineHeight: "16px", color: T.fgMuted }}>3.2 MB</span>
                        )}
                        {slot.status === "error" && (
                          <span style={{ ...fontBase, fontSize: 12, lineHeight: "16px", color: T.red }}>Server error. Please try again</span>
                        )}
                      </div>
                      {slot.status === "done" && (
                        <button onClick={() => remove(idx)} style={{ background: "transparent", border: "none", padding: 4, cursor: "pointer", display: "flex", alignItems: "center", flexShrink: 0 }}>
                          <svg width="16" height="20" viewBox="0 0 15.5 19.5" fill="none"><path d={svgPaths.p28f2500} fill={T.fgMuted} /></svg>
                        </button>
                      )}
                      {slot.status === "error" && (
                        <button onClick={() => browse(idx)} style={{ background: "transparent", border: "none", padding: 4, cursor: "pointer", display: "flex", alignItems: "center", flexShrink: 0 }}>
                          <IRetry />
                        </button>
                      )}
                    </div>

                    {/* Product model list — only for 批量PTR生成 after upload */}
                    {activeTab === "批量PTR生成" && slot.status === "done" && (() => {
                      const ALL_MODELS = ["3M12", "3M15", "3M15 L4L", "FlexArm", "5M20", "7 M20 E L4L", "7 B12", "7M12", "7M20", "7 B20"];

                      const CheckboxCol = ({ models }: { models: string[] }) => (
                        <div style={{ display: "flex", flexDirection: "column", gap: 4, flexShrink: 0 }}>
                          {models.map(model => {
                            const checked = checkedModels.has(model);
                            return (
                              <label key={model} style={{ display: "flex", alignItems: "center", gap: 8, height: 40, cursor: "pointer" }}>
                                <div onClick={() => toggleModel(model)} style={{
                                  width: 20, height: 20, borderRadius: 4, flexShrink: 0,
                                  background: checked ? T.primary : T.bg,
                                  border: checked ? "none" : `1px solid #6b8094`,
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                }}>
                                  {checked && <svg width="11" height="11" viewBox="0 0 10.9707 10.5601" fill="none"><path d={svgPaths3.p2af3100} fill="white" /></svg>}
                                </div>
                                <span style={{ ...fontBase, fontSize: 16, lineHeight: "24px", color: T.fg, whiteSpace: "nowrap" }}>{model}</span>
                              </label>
                            );
                          })}
                        </div>
                      );

                      if (batchMaterialType === "生成PTR") {
                        // 3-column checkbox grid
                        const modelCols = [
                          ["3M12", "3M15", "3M15 L4L", "FlexArm"],
                          ["5M20", "7 M20 E L4L", "7 B12"],
                          ["7M12", "7M20", "7 B20"],
                        ];
                        return (
                          <div style={{ marginTop: 12, display: "flex", gap: 0 }}>
                            <div style={{ width: 28, flexShrink: 0 }} />
                            {modelCols.map((col, ci) => <CheckboxCol key={ci} models={col} />)}
                          </div>
                        );
                      }

                      // 生成PTR对比表: 2-column layout — checkboxes left, per-model file upload right
                      return (
                        <div style={{ marginTop: 12, display: "flex", alignItems: "flex-start", gap: 12 }}>
                          <CheckboxCol models={ALL_MODELS} />
                          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                            {ALL_MODELS.map(model => {
                              const mf = modelFiles[model] ?? { status: "idle", file: null };
                              return (
                                <div key={model} style={{ height: 40 }}>
                                  {mf.status === "idle" && (
                                    <button onClick={() => browseModel(model)} style={{
                                      width: "100%", height: 40, background: "rgba(0,67,138,0.06)", border: "none",
                                      borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                                    }}>
                                      <span style={{ ...fontBase, fontWeight: 700, fontSize: 16, lineHeight: "24px", color: T.fg }}>Browse</span>
                                    </button>
                                  )}
                                  {mf.status === "uploading" && (
                                    <div style={{ width: "100%", height: 40, background: T.bg, borderRadius: 6, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", padding: "0 12px", gap: 8 }}>
                                      <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                                        style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${T.border}`, borderTopColor: T.primary, flexShrink: 0 }} />
                                      <span style={{ ...fontBase, fontSize: 14, color: T.fgMuted }}>上传中...</span>
                                    </div>
                                  )}
                                  {mf.status === "done" && (
                                    <div style={{ width: "100%", height: 40, background: T.bg, borderRadius: 6, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", padding: "0 4px 0 12px", gap: 8 }}>
                                      <ICheckGreen />
                                      <span style={{ ...fontBase, fontSize: 14, lineHeight: "24px", color: "#0061C2", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{mf.file}</span>
                                      <button onClick={() => removeModel(model)} style={{ background: "transparent", border: "none", padding: 4, cursor: "pointer", display: "flex", alignItems: "center", flexShrink: 0 }}>
                                        <svg width="14" height="17" viewBox="0 0 15.5 19.5" fill="none"><path d={svgPaths.p28f2500} fill={T.fgMuted} /></svg>
                                      </button>
                                    </div>
                                  )}
                                  {mf.status === "error" && (
                                    <div style={{ width: "100%", height: 40, background: T.bg, borderRadius: 6, border: `1px solid ${T.red}`, display: "flex", alignItems: "center", padding: "0 4px 0 12px", gap: 8 }}>
                                      <IWarnCircle />
                                      <span style={{ ...fontBase, fontSize: 14, lineHeight: "24px", color: T.red, flex: 1 }}>Server error. Please try again</span>
                                      <button onClick={() => browseModel(model)} style={{ background: "transparent", border: "none", padding: 4, cursor: "pointer", display: "flex", alignItems: "center", flexShrink: 0 }}>
                                        <IRetry />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </React.Fragment>
        ))}

        {/* Tips section */}
        <div style={{ paddingTop: 4 }}>
          <p style={{ margin: 0, ...fontBase, fontWeight: 700, fontSize: 16, lineHeight: "24px", color: T.fg }}>Tips</p>
          <ul style={{ margin: "0 0 0 24px", padding: 0 }}>
            {(activeTab === "批量PTR生成" ? GEN_BATCH_TIPS_BY_MATERIAL[batchMaterialType] : GEN_TIPS_BY_TAB[activeTab]).map((tip, i) => (
              <li key={i} style={{ ...fontBase, fontWeight: 300, fontSize: 16, lineHeight: "24px", color: T.fg }}>{tip}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2" style={{ padding: "0 20px 16px" }}>
        <button onClick={onCancel} style={{ background: "transparent", border: "none", borderRadius: 999, padding: "8px 16px", cursor: "pointer" }}>
          <span style={{ ...fontBase, fontWeight: 700, fontSize: 16, lineHeight: "24px", color: T.fg }}>取消</span>
        </button>
        <button
          onClick={requiredDone ? () => onGenerate(activeTab) : undefined}
          style={{ background: T.primary, border: "none", borderRadius: 999, padding: "8px 16px", cursor: requiredDone ? "pointer" : "not-allowed", opacity: requiredDone ? 1 : 0.32 }}
        >
          <span style={{ ...fontBase, fontWeight: 700, fontSize: 16, lineHeight: "24px", color: "white" }}>开始生成</span>
        </button>
      </div>
    </motion.div>
  );
}

// ─── Generator Done Dialog ────────────────────────────────────────────────────

function GeneratorDoneDialog({
  genTab,
  onClose,
  onSimulateError,
}: {
  genTab: GenTab;
  onClose: () => void;
  onSimulateError: () => void;
}) {
  const fontBase: React.CSSProperties = { fontFamily: "'Neue Frutiger One', Inter, sans-serif" };
  const today = new Date();
  const ds = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
  const downloadName =
    genTab === "PTR对比表生成" ? `Azurion_3M12_对比表_${ds}_001.docx` :
    genTab === "单PTR生成"    ? `Azurion_3M12_PTR_${ds}_001.docx` :
                                `Azurion_批量PTR_${ds}_001.zip`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -10 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      style={{
        background: T.bg, borderRadius: 12, border: `1px solid ${T.border}`,
        boxShadow: "0px 0px 1px rgba(58,69,80,0.16), 0px 16px 8px rgba(58,69,80,0.08), 0px 24px 16px rgba(58,69,80,0.16)",
        width: 360, display: "flex", flexDirection: "column",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2" style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <IRocket />
        </div>
        <span style={{ ...fontBase, fontWeight: 700, fontSize: 20, lineHeight: "24px", color: T.fg, flex: 1 }}>生成完成</span>
        <button onClick={onClose} style={{ background: "transparent", border: "none", padding: 8, borderRadius: 999, cursor: "pointer", display: "flex", alignItems: "center" }}>
          <IClose />
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: "0 20px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        {genTab === "PTR对比表生成" ? (
          <p style={{ ...fontBase, fontWeight: 300, fontSize: 16, lineHeight: "24px", color: T.fg, margin: 0 }}>
            {"生成 "}
            <span style={{ ...fontBase, fontWeight: 700, fontSize: 18, lineHeight: "26px", color: T.primary }}>12</span>
            {" 条对比项，其中有 "}
            <span style={{ ...fontBase, fontWeight: 700, fontSize: 18, lineHeight: "26px", color: "#D60012" }}>3</span>
            {" 处需要重点关注 "}
            <span style={{ color: "#D60012" }}>1.1、2.1、2.3</span>
            {"。"}
          </p>
        ) : genTab === "单PTR生成" ? (
          <p style={{ ...fontBase, fontWeight: 300, fontSize: 16, lineHeight: "24px", color: T.fg, margin: 0 }}>
            {"生成 "}
            <span style={{ ...fontBase, fontWeight: 700, fontSize: 18, lineHeight: "26px", color: T.primary }}>12</span>
            {" 条对比项，其中有 "}
            <span style={{ ...fontBase, fontWeight: 700, fontSize: 18, lineHeight: "26px", color: "#D60012" }}>3</span>
            {" 处需要重点关注 "}
            <span style={{ color: "#D60012" }}>1.1、2.1、2.3</span>
            {"。"}
          </p>
        ) : (
          <p style={{ ...fontBase, fontWeight: 300, fontSize: 16, lineHeight: "24px", color: T.fg, margin: 0 }}>
            {"生成 "}
            <span style={{ ...fontBase, fontWeight: 700, fontSize: 18, lineHeight: "26px", color: T.primary }}>12</span>
            {" 个PTR对比表，其中"}
            <br />
            {"3M12 有 "}
            <span style={{ ...fontBase, fontWeight: 700, fontSize: 18, lineHeight: "26px", color: "#D60012" }}>3</span>
            {" 处需要重点关注 "}
            <span style={{ color: "#D60012" }}>1.1、2.1、2.3</span>
            {"。"}
            <br />
            {"7M12 有 "}
            <span style={{ ...fontBase, fontWeight: 700, fontSize: 18, lineHeight: "26px", color: "#D60012" }}>2</span>
            {" 处需要重点关注 "}
            <span style={{ color: "#D60012" }}>1.1、2.1</span>
            {"。"}
            <br />
            {"5M12 有 "}
            <span style={{ ...fontBase, fontWeight: 700, fontSize: 18, lineHeight: "26px", color: "#D60012" }}>2</span>
            {" 处需要重点关注 "}
            <span style={{ color: "#D60012" }}>1.1、2.1</span>
            {"。"}
          </p>
        )}
        <p style={{ ...fontBase, fontSize: 12, lineHeight: "18px", color: T.fgMuted, fontStyle: "italic", margin: 0 }}>
          * 下载文件名：{downloadName}
        </p>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2" style={{ padding: "0 20px 16px" }}>
        <button onClick={onSimulateError} style={{ background: "transparent", border: `2px solid ${T.fg}`, borderRadius: 999, padding: "8px 16px", cursor: "pointer" }}>
          <span style={{ ...fontBase, fontWeight: 700, fontSize: 16, color: T.fg }}>模拟失败</span>
        </button>
        <button onClick={onClose} style={{ background: T.primary, border: "none", borderRadius: 999, padding: "8px 16px", cursor: "pointer" }}>
          <span style={{ ...fontBase, fontWeight: 700, fontSize: 16, lineHeight: "24px", color: "white" }}>确定</span>
        </button>
      </div>
    </motion.div>
  );
}

// ─── Generator Error Dialog ───────────────────────────────────────────────────

function GeneratorErrorDialog({ onRetry, onDismiss }: { onRetry: () => void; onDismiss: () => void }) {
  const fontBase: React.CSSProperties = { fontFamily: "'Neue Frutiger One', Inter, sans-serif" };
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -10 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      style={{
        background: T.bg, borderRadius: 12, border: `1px solid ${T.border}`,
        boxShadow: "0px 0px 1px rgba(58,69,80,0.16), 0px 16px 8px rgba(58,69,80,0.08), 0px 24px 16px rgba(58,69,80,0.16)",
        width: 440, display: "flex", flexDirection: "column",
      }}
    >
      <div className="flex items-center gap-2" style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <IErrorIcon />
        </div>
        <span style={{ ...fontBase, fontWeight: 700, fontSize: 20, lineHeight: "24px", color: T.red, flex: 1 }}>生成失败</span>
        <button onClick={onDismiss} style={{ background: "transparent", border: "none", padding: 8, borderRadius: 999, cursor: "pointer", display: "flex", alignItems: "center" }}>
          <IClose />
        </button>
      </div>
      <div style={{ padding: "0 20px 20px" }}>
        <p style={{ ...fontBase, fontWeight: 300, fontSize: 16, lineHeight: "24px", color: T.fg, margin: 0 }}>
          这里是系统根据失败原因，展示的一段提示内容，告知用户具体原因。
        </p>
      </div>
      <div className="flex items-center justify-end gap-2" style={{ padding: "0 20px 16px" }}>
        <button onClick={onDismiss} style={{ background: "transparent", border: "none", borderRadius: 999, padding: "8px 16px", cursor: "pointer" }}>
          <span style={{ ...fontBase, fontWeight: 700, fontSize: 16, color: T.fg }}>知道了</span>
        </button>
        <button onClick={onRetry} style={{ background: "#FF5500", border: "none", borderRadius: 999, padding: "8px 16px", cursor: "pointer" }}>
          <span style={{ ...fontBase, fontWeight: 700, fontSize: 16, color: "white" }}>重试</span>
        </button>
      </div>
    </motion.div>
  );
}

// ─── Archive Upload Dialog ────────────────────────────────────────────────────
// "PTR归档" — radio 变更归档/延续归档 + 4 file slots

const ARCHIVE_SLOTS: Record<ArchiveType, FileSlot[]> = {
  "变更归档": [
    { label: "变更批件（PDF）", required: true, file: null, status: "idle" },
    { label: "PTR对比表（PDF）", required: true, file: null, status: "idle" },
    { label: "PTR对比表中文版（docx）", required: false, file: null, status: "idle" },
    { label: "PTR对比表英文版（docx）", required: false, file: null, status: "idle" },
  ],
  "延续归档": [
    { label: "注册证书（PDF）", required: true, file: null, status: "idle" },
    { label: "延续归档PTR（PDF）", required: true, file: null, status: "idle" },
    { label: "延续归档PTR中文版（Word）", required: false, file: null, status: "idle" },
    { label: "延续归档PTR英文版（Word）", required: false, file: null, status: "idle" },
  ],
};

const ARCHIVE_MOCK_FILES: Record<ArchiveType, string[]> = {
  "变更归档": ["NMPA_Azurion_FlexPlus_变更批件.PDF", "PTR_对比表.PDF", "PTR_对比表_中文版.docx", "PTR_对比表_英文版.docx"],
  "延续归档": ["NMPA_Azurion_FlexPlus_注册证书.PDF", "延续归档PTR.PDF", "延续归档PTR_中文版.docx", "延续归档PTR_英文版.docx"],
};

function ArchiveUploadDialog({
  model, onCancel, onConfirm,
}: { model: string; onCancel: () => void; onConfirm: (type: ArchiveType) => void }) {
  const [archiveType, setArchiveType] = useState<ArchiveType>("变更归档");
  const [slots, setSlots] = useState<FileSlot[]>(ARCHIVE_SLOTS["变更归档"].map(s => ({ ...s })));

  const switchType = (t: ArchiveType) => {
    setArchiveType(t);
    setSlots(ARCHIVE_SLOTS[t].map(s => ({ ...s })));
  };

  const requiredDone = slots.filter(s => s.required).every(s => s.status === "done");

  const browse = (idx: number) => {
    setSlots(prev => prev.map((s, i) => i === idx ? { ...s, status: "uploading" } : s));
    setTimeout(() => {
      setSlots(prev => prev.map((s, i) => {
        if (i !== idx) return s;
        return { ...s, status: "done", file: ARCHIVE_MOCK_FILES[archiveType][idx] };
      }));
    }, 700);
  };

  const remove = (idx: number) => {
    setSlots(prev => prev.map((s, i) => i === idx ? { ...s, status: "idle", file: null } : s));
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -10 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      style={{
        background: T.bg,
        borderRadius: 12,
        border: `1px solid ${T.border}`,
        boxShadow: "0px 0px 1px rgba(58,69,80,0.16), 0px 16px 8px rgba(58,69,80,0.08), 0px 24px 16px rgba(58,69,80,0.16)",
        width: 488,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2" style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
        <span style={{ fontFamily: "'Neue Frutiger One', Inter, sans-serif", fontWeight: 700, fontSize: 20, lineHeight: "24px", color: T.fg, flex: 1 }}>
          {model} PTR归档
        </span>
        <button onClick={onCancel} style={{ background: "transparent", border: "none", padding: 8, borderRadius: 999, cursor: "pointer", display: "flex", alignItems: "center" }}>
          <IClose />
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 12 }}>
        {/* Radio row */}
        <div className="flex items-start gap-[10px]">
          <div style={{ width: 120, height: 40, display: "flex", alignItems: "center", flexShrink: 0 }}>
            <span style={{ fontFamily: "'Neue Frutiger One', Inter, sans-serif", fontSize: 16, lineHeight: "24px", color: T.fg, whiteSpace: "nowrap" }}>
              归档类型:
            </span>
          </div>
          <div className="flex items-center gap-6" style={{ height: 40 }}>
            {(["变更归档", "延续归档"] as ArchiveType[]).map(opt => (
              <label key={opt} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <div
                  onClick={() => switchType(opt)}
                  style={{
                    width: 20, height: 20, borderRadius: "50%",
                    border: `2px solid ${archiveType === opt ? T.primary : "#6b8094"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, transition: "border-color 0.15s", background: T.bg,
                  }}
                >
                  {archiveType === opt && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                      style={{ width: 10, height: 10, borderRadius: "50%", background: T.primary }} />
                  )}
                </div>
                <span style={{ fontFamily: "'Neue Frutiger One', Inter, sans-serif", fontSize: 16, lineHeight: "24px", color: T.fg }}>
                  {opt}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* File upload slots */}
        {slots.map((slot, idx) => (
          <React.Fragment key={`${archiveType}-${idx}`}>
            {/* Upload row */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontFamily: "'Neue Frutiger One', Inter, sans-serif", fontSize: 16, lineHeight: "24px", color: T.fg }}>
                  {slot.label}
                  {slot.required && <span style={{ color: "#D60012" }}> *</span>}
                </span>
              </div>
              <button
                onClick={() => (slot.status === "idle" || slot.status === "error") && browse(idx)}
                disabled={slot.status === "uploading"}
                style={{
                  background: "rgba(0,67,138,0.06)", border: "none", borderRadius: 6,
                  padding: "8px 12px", cursor: slot.status === "uploading" ? "default" : "pointer",
                  flexShrink: 0, opacity: slot.status === "uploading" ? 0.5 : 1,
                }}
              >
                <span style={{ fontFamily: "'Neue Frutiger One', Inter, sans-serif", fontWeight: 700, fontSize: 16, lineHeight: "24px", color: T.fg }}>Browse</span>
              </button>
            </div>
            {/* File item row */}
            <AnimatePresence>
              {slot.status !== "idle" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }}
                  style={{ overflow: "hidden" }}
                >
                  <div style={{ background: T.bg, borderRadius: 6, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 8, padding: "8px 12px" }}>
                    {/* Status icon */}
                    <div style={{ width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {slot.status === "uploading"
                        ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                            style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${T.border}`, borderTopColor: T.primary }} />
                        : slot.status === "error"
                          ? <IWarnCircle />
                          : <ICheckGreen />}
                    </div>
                    {/* Filename + size / error message */}
                    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                      <span style={{ fontFamily: "'Neue Frutiger One', Inter, sans-serif", fontSize: 16, lineHeight: "24px", color: slot.status === "error" ? T.fg : "#0061C2", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {slot.file ?? "上传中..."}
                      </span>
                      {slot.status === "done" && (
                        <span style={{ fontFamily: "'Neue Frutiger One', Inter, sans-serif", fontSize: 12, lineHeight: "16px", color: T.fgMuted }}>2.4 MB</span>
                      )}
                      {slot.status === "error" && (
                        <span style={{ fontFamily: "'Neue Frutiger One', Inter, sans-serif", fontSize: 12, lineHeight: "16px", color: T.red }}>Server error. Please try again</span>
                      )}
                    </div>
                    {/* Right action */}
                    {slot.status === "done" && (
                      <button onClick={() => remove(idx)} style={{ background: "transparent", border: "none", padding: 4, cursor: "pointer", display: "flex", alignItems: "center", flexShrink: 0 }}>
                        <svg width="16" height="20" viewBox="0 0 15.5 19.5" fill="none"><path d={svgPaths.p28f2500} fill={T.fgMuted} /></svg>
                      </button>
                    )}
                    {slot.status === "error" && (
                      <button onClick={() => browse(idx)} style={{ background: "transparent", border: "none", padding: 4, cursor: "pointer", display: "flex", alignItems: "center", flexShrink: 0 }}>
                        <IRetry />
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </React.Fragment>
        ))}

        {/* Tips section */}
        <div style={{ paddingTop: 4 }}>
          <p style={{ margin: 0, fontFamily: "'Neue Frutiger One', Inter, sans-serif", fontWeight: 700, fontSize: 16, lineHeight: "24px", color: T.fg }}>Tips</p>
          <p style={{ margin: 0, fontFamily: "'Neue Frutiger One', Inter, sans-serif", fontSize: 16, lineHeight: "24px", color: T.fg }}>
            {archiveType === "变更归档" ? (
              <>
                {"请上传产品的 "}
                <strong>变更批件（PDF）</strong>
                <span style={{ color: "#D60012" }}>*</span>
                {"、"}
                <strong>PTR对比表（PDF）</strong>
                <span style={{ color: "#D60012" }}>*</span>
                {"、"}
                <strong>PTR对比表中文版（docx）</strong>
                {"、"}
                <strong>PTR对比表英文版（docx）</strong>
                {"；"}
              </>
            ) : (
              <>
                {"请上传产品的 "}
                <strong>注册证书（PDF）</strong>
                <span style={{ color: "#D60012" }}>*</span>
                {"、"}
                <strong>延续归档PTR（PDF）</strong>
                <span style={{ color: "#D60012" }}>*</span>
                {"、"}
                <strong>延续归档PTR中文版（Word）</strong>
                {"、"}
                <strong>延续归档PTR英文版（Word）</strong>
                {"；"}
              </>
            )}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2" style={{ padding: "0 20px 16px" }}>
        <button onClick={onCancel} style={{ background: "transparent", border: "none", borderRadius: 999, padding: "8px 16px", cursor: "pointer" }}>
          <span style={{ fontFamily: "'Neue Frutiger One', Inter, sans-serif", fontWeight: 700, fontSize: 16, lineHeight: "24px", color: T.fg }}>取消</span>
        </button>
        <button
          onClick={requiredDone ? () => onConfirm(archiveType) : undefined}
          style={{ background: T.primary, border: "none", borderRadius: 999, padding: "8px 16px", cursor: requiredDone ? "pointer" : "not-allowed", opacity: requiredDone ? 1 : 0.32 }}
        >
          <span style={{ fontFamily: "'Neue Frutiger One', Inter, sans-serif", fontWeight: 700, fontSize: 16, lineHeight: "24px", color: "white" }}>归档</span>
        </button>
      </div>
    </motion.div>
  );
}

// ─── Archive Confirm Dialog ───────────────────────────────────────────────────
// "PTR变更归档 -识别结果" — review extracted data before confirming

function ArchiveConfirmDialog({
  archiveType, model, onCancel, onConfirm, onError,
}: {
  archiveType: ArchiveType;
  model: string;
  onCancel: () => void;
  onConfirm: () => void;
  onError: () => void;
}) {
  const [form, setForm] = useState({
    model,
    regNo: "国械注进20257220001",
    approveDate: "2025-07-22",
    effectiveDate: "2026-07-22",
    expireDate: "2031-07-22",
  });

  const inputStyle: React.CSSProperties = {
    background: T.bg, border: `1px solid #6b8094`, borderRadius: 6,
    padding: "8px 12px", fontSize: 16, fontFamily: "'Neue Frutiger One', Inter, sans-serif",
    fontWeight: 400, lineHeight: "24px", color: T.fg, width: "100%", outline: "none", boxSizing: "border-box",
  };

  const FormRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex items-start gap-[10px]" style={{ width: "100%" }}>
      <div style={{ width: 120, height: 40, display: "flex", alignItems: "center", flexShrink: 0 }}>
        <span style={{ fontFamily: "'Neue Frutiger One', Inter, sans-serif", fontSize: 16, lineHeight: "24px", color: T.fg, whiteSpace: "nowrap" }}>{label}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -10 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      style={{
        background: T.bg, borderRadius: 12, border: `1px solid ${T.border}`,
        boxShadow: "0px 0px 1px rgba(58,69,80,0.16), 0px 16px 8px rgba(58,69,80,0.08), 0px 24px 16px rgba(58,69,80,0.16)",
        width: 520, display: "flex", flexDirection: "column",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2" style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
        <span style={{ fontFamily: "'Neue Frutiger One', Inter, sans-serif", fontWeight: 700, fontSize: 20, lineHeight: "24px", color: T.fg, flex: 1 }}>
          PTR{archiveType} -识别结果
        </span>
        <button onClick={onCancel} style={{ background: "transparent", border: "none", padding: 8, borderRadius: 999, cursor: "pointer", display: "flex", alignItems: "center" }}>
          <IClose />
        </button>
      </div>

      {/* Form */}
      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        <FormRow label="产品型号:">
          <div style={{ height: 40 }}>
            <input value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))}
              style={{ ...inputStyle, border: `2px solid ${T.primary}`, boxShadow: `0 0 0 2px ${T.primary}22` }} />
          </div>
        </FormRow>
        <FormRow label="注册证号:">
          <div style={{ height: 40 }}>
            <input value={form.regNo} onChange={e => setForm(f => ({ ...f, regNo: e.target.value }))} style={inputStyle} />
          </div>
        </FormRow>
        <FormRow label="批准日期:">
          <div style={{ height: 40 }}>
            <div style={{ ...inputStyle, display: "flex", alignItems: "center", padding: 0 }}>
              <input type="date" value={form.approveDate} onChange={e => setForm(f => ({ ...f, approveDate: e.target.value }))}
                style={{ border: "none", outline: "none", flex: 1, padding: "8px 12px", fontSize: 16, fontFamily: "'Neue Frutiger One', Inter, sans-serif", color: T.fg, background: "transparent" }} />
            </div>
          </div>
        </FormRow>
        <FormRow label="生效日期:">
          <div style={{ height: 40 }}>
            <div style={{ ...inputStyle, display: "flex", alignItems: "center", padding: 0 }}>
              <input type="date" value={form.effectiveDate} onChange={e => setForm(f => ({ ...f, effectiveDate: e.target.value }))}
                style={{ border: "none", outline: "none", flex: 1, padding: "8px 12px", fontSize: 16, fontFamily: "'Neue Frutiger One', Inter, sans-serif", color: T.fg, background: "transparent" }} />
            </div>
          </div>
        </FormRow>
        <FormRow label="有效期至:">
          <div style={{ height: 40 }}>
            <div style={{ ...inputStyle, display: "flex", alignItems: "center", padding: 0 }}>
              <input type="date" value={form.expireDate} onChange={e => setForm(f => ({ ...f, expireDate: e.target.value }))}
                style={{ border: "none", outline: "none", flex: 1, padding: "8px 12px", fontSize: 16, fontFamily: "'Neue Frutiger One', Inter, sans-serif", color: T.fg, background: "transparent" }} />
            </div>
          </div>
        </FormRow>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2" style={{ padding: "0 20px 16px" }}>
        <button onClick={onCancel} style={{ background: "transparent", border: "none", borderRadius: 999, padding: "8px 16px", cursor: "pointer" }}>
          <span style={{ fontFamily: "'Neue Frutiger One', Inter, sans-serif", fontWeight: 700, fontSize: 16, lineHeight: "24px", color: T.fg }}>取消</span>
        </button>
        <button onClick={onError} style={{ background: "transparent", border: `2px solid ${T.fg}`, borderRadius: 999, padding: "8px 16px", cursor: "pointer" }}>
          <span style={{ fontFamily: "'Neue Frutiger One', Inter, sans-serif", fontWeight: 700, fontSize: 16, lineHeight: "24px", color: T.fg }}>模拟失败</span>
        </button>
        <button onClick={onConfirm} style={{ background: T.primary, border: "none", borderRadius: 999, padding: "8px 16px", cursor: "pointer" }}>
          <span style={{ fontFamily: "'Neue Frutiger One', Inter, sans-serif", fontWeight: 700, fontSize: 16, lineHeight: "24px", color: "white" }}>确认归档</span>
        </button>
      </div>
    </motion.div>
  );
}

// ─── Archive Error Dialog ─────────────────────────────────────────────────────

function ArchiveErrorDialog({ onRetry, onDismiss }: { onRetry: () => void; onDismiss: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -10 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      style={{
        background: T.bg, borderRadius: 12, border: `1px solid ${T.border}`,
        boxShadow: "0px 0px 1px rgba(58,69,80,0.16), 0px 16px 8px rgba(58,69,80,0.08), 0px 24px 16px rgba(58,69,80,0.16)",
        width: 440, display: "flex", flexDirection: "column",
      }}
    >
      <div className="flex items-center gap-2" style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
        <div style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <IErrorIcon />
        </div>
        <span style={{ fontFamily: "'Neue Frutiger One', Inter, sans-serif", fontWeight: 700, fontSize: 20, lineHeight: "24px", color: T.red, flex: 1 }}>归档失败</span>
        <button onClick={onDismiss} style={{ background: "transparent", border: "none", padding: 8, borderRadius: 999, cursor: "pointer", display: "flex", alignItems: "center" }}>
          <IClose />
        </button>
      </div>
      <div style={{ padding: "0 20px 20px" }}>
        <p style={{ fontFamily: "'Neue Frutiger One', Inter, sans-serif", fontWeight: 300, fontSize: 16, lineHeight: "24px", color: T.fg, margin: 0 }}>
          这里是系统根据失败原因，展示的一段提示内容，告知用户具体原因。
        </p>
      </div>
      <div className="flex items-center justify-end gap-2" style={{ padding: "0 20px 16px" }}>
        <button onClick={onDismiss} style={{ background: "transparent", border: "none", borderRadius: 999, padding: "8px 16px", cursor: "pointer" }}>
          <span style={{ fontFamily: "'Neue Frutiger One', Inter, sans-serif", fontWeight: 700, fontSize: 16, color: T.fg }}>知道了</span>
        </button>
        <button onClick={onRetry} style={{ background: "#FF5500", border: "none", borderRadius: 999, padding: "8px 16px", cursor: "pointer" }}>
          <span style={{ fontFamily: "'Neue Frutiger One', Inter, sans-serif", fontWeight: 700, fontSize: 16, color: "white" }}>重试</span>
        </button>
      </div>
    </motion.div>
  );
}

// ─── Archive Success Toast ────────────────────────────────────────────────────
// Light green bg — matches Figma PtrToast design

function ArchiveSuccessToast({ model, archiveType, onClose }: { model: string; archiveType: ArchiveType; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.97 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      style={{
        background: "#E0FFED",
        borderRadius: 12,
        border: `1px solid ${T.green}`,
        padding: "12px 16px",
        display: "flex",
        alignItems: "center",
        gap: 12,
        minWidth: 360,
        maxWidth: 520,
        boxShadow: "0px 0px 1px rgba(58,69,80,0.16), 0px 16px 8px rgba(58,69,80,0.08), 0px 24px 16px rgba(58,69,80,0.16)",
      }}
    >
      <div style={{ flexShrink: 0, width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d={svgPaths.p3d3c7380} fill={T.green} />
        </svg>
      </div>
      <span style={{ fontFamily: "'Neue Frutiger One', Inter, sans-serif", fontSize: 16, lineHeight: "24px", color: T.fg, flex: 1 }}>
        {model} PTR{archiveType}已完成。
      </span>
      <button onClick={onClose} style={{ background: "transparent", border: "none", padding: 8, cursor: "pointer", display: "flex", alignItems: "center" }}>
        <IClose color={T.fgMuted} />
      </button>
    </motion.div>
  );
}

// ─── Update Record Flow ───────────────────────────────────────────────────────

const UPDATE_SLOTS: FileSlot[] = [
  { label: "注册证书（PDF）", required: true, file: null, status: "idle" },
  { label: "PTR（PDF）",      required: true, file: null, status: "idle" },
  { label: "PTR中文版（docx）",  required: false, file: null, status: "idle" },
  { label: "PTR 英文版（Word）", required: false, file: null, status: "idle" },
];

const UPDATE_MOCK_FILES = [
  "NMPA_Azurion_FlexPlus_注册证书.PDF",
  "PTR_Azurion_FlexPlus.PDF",
  "PTR_Azurion_FlexPlus.docx",
  "PTR_Azurion_FlexPlus_EN.docx",
];

const UPDATE_TIPS = [
  "系统将基于当前PTR和变更后PTR生成PTR对比表。",
  "请确认产品型号、语言版本和文件版本是否一致。",
  "生成文件不会改变用户上传的原始Word结构。",
  "下载后请在线下Word中完成最终审阅和格式调整。",
];

function UpdateRecordDialog({
  model, onCancel, onUpdate, onDelete,
  title, dateLabel, dateValue, onDateChange, canDelete = true, deleteHint, tips,
}: {
  model: string; onCancel: () => void; onUpdate: () => void; onDelete: () => void;
  title?: string;
  dateLabel?: string; dateValue?: string; onDateChange?: (v: string) => void;
  canDelete?: boolean; deleteHint?: string; tips?: string[];
}) {
  const fontBase: React.CSSProperties = { fontFamily: "'Neue Frutiger One', Inter, sans-serif" };
  const [slots, setSlots] = useState<FileSlot[]>(UPDATE_SLOTS.map(s => ({ ...s })));
  const [recordName, setRecordName] = useState(title ? model : "");

  const requiredDone = slots.filter(s => s.required).every(s => s.status === "done");

  const browse = (idx: number) => {
    setSlots(prev => prev.map((s, i) => i === idx ? { ...s, status: "uploading" } : s));
    setTimeout(() => {
      setSlots(prev => prev.map((s, i) => i !== idx ? s : { ...s, status: "done", file: UPDATE_MOCK_FILES[idx] }));
    }, 700);
  };

  const remove = (idx: number) => {
    setSlots(prev => prev.map((s, i) => i === idx ? { ...s, status: "idle", file: null } : s));
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -10 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      style={{
        background: T.bg, borderRadius: 12, border: `1px solid ${T.border}`,
        boxShadow: "0px 0px 1px rgba(58,69,80,0.16), 0px 16px 8px rgba(58,69,80,0.08), 0px 24px 16px rgba(58,69,80,0.16)",
        width: 488, display: "flex", flexDirection: "column",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2" style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
        <span style={{ ...fontBase, fontWeight: 700, fontSize: 20, lineHeight: "24px", color: T.fg, flex: 1 }}>
          {title ?? `${model} 更新记录`}
        </span>
        <button onClick={onCancel} style={{ background: "transparent", border: "none", padding: 8, borderRadius: 999, cursor: "pointer", display: "flex", alignItems: "center" }}>
          <IClose />
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: "20px 20px 8px", display: "flex", flexWrap: "wrap", gap: 12 }}>
        {/* Record name field */}
        <div className="flex items-start gap-[10px]" style={{ width: 448 }}>
          <div style={{ width: 120, height: 40, display: "flex", alignItems: "center", flexShrink: 0 }}>
            <span style={{ ...fontBase, fontSize: 16, lineHeight: "24px", color: T.fg, whiteSpace: "nowrap" }}>记录名称:</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <input
              value={recordName}
              onChange={e => setRecordName(e.target.value)}
              placeholder="请输入记录名称"
              style={{
                background: T.bg, border: `1px solid #6b8094`, borderRadius: 6,
                padding: "8px 12px", fontSize: 16, fontFamily: "'Neue Frutiger One', Inter, sans-serif",
                lineHeight: "24px", color: T.fg, width: "100%", outline: "none", boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        {/* Conditional date row: 生效时间 (待生效PTR) / 有效期至 (PTR对比表) */}
        {dateLabel && (
          <div className="flex items-start gap-[10px]" style={{ width: 448 }}>
            <div style={{ width: 120, height: 40, display: "flex", alignItems: "center", flexShrink: 0 }}>
              <span style={{ ...fontBase, fontSize: 16, lineHeight: "24px", color: T.fg, whiteSpace: "nowrap" }}>{dateLabel}:</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ background: T.bg, border: `1px solid #6b8094`, borderRadius: 6, display: "flex", alignItems: "center", padding: 0 }}>
                <input
                  type="date"
                  value={dateValue ?? ""}
                  onChange={e => onDateChange?.(e.target.value)}
                  style={{ border: "none", outline: "none", flex: 1, padding: "8px 12px", fontSize: 16, fontFamily: "'Neue Frutiger One', Inter, sans-serif", color: T.fg, background: "transparent" }}
                />
              </div>
            </div>
          </div>
        )}

        {/* File upload slots */}
        {slots.map((slot, idx) => (
          <React.Fragment key={idx}>
            <div style={{ width: 448, display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ ...fontBase, fontSize: 16, lineHeight: "24px", color: T.fg }}>
                  {slot.label}
                  {slot.required && <span style={{ color: "#D60012" }}> *</span>}
                </span>
              </div>
              <button
                onClick={() => (slot.status === "idle" || slot.status === "error") && browse(idx)}
                disabled={slot.status === "uploading"}
                style={{
                  background: "rgba(0,67,138,0.06)", border: "none", borderRadius: 6,
                  padding: "8px 12px", cursor: slot.status === "uploading" ? "default" : "pointer",
                  flexShrink: 0, opacity: slot.status === "uploading" ? 0.5 : 1,
                }}
              >
                <span style={{ ...fontBase, fontWeight: 700, fontSize: 16, lineHeight: "24px", color: T.fg }}>Browse</span>
              </button>
            </div>
            <AnimatePresence>
              {slot.status !== "idle" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.18 }}
                  style={{ overflow: "hidden", width: 448 }}
                >
                  <div style={{ background: T.bg, borderRadius: 6, border: `1px solid ${T.border}`, display: "flex", alignItems: "center", gap: 8, padding: "8px 12px" }}>
                    <div style={{ width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {slot.status === "uploading"
                        ? <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: "linear" }}
                            style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${T.border}`, borderTopColor: T.primary }} />
                        : slot.status === "error" ? <IWarnCircle /> : <ICheckGreen />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                      <span style={{ ...fontBase, fontSize: 16, lineHeight: "24px", color: slot.status === "error" ? T.fg : "#0061C2", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {slot.file ?? "上传中..."}
                      </span>
                      {slot.status === "done" && <span style={{ ...fontBase, fontSize: 12, lineHeight: "16px", color: T.fgMuted }}>2.4 MB</span>}
                      {slot.status === "error" && <span style={{ ...fontBase, fontSize: 12, lineHeight: "16px", color: T.red }}>Server error. Please try again</span>}
                    </div>
                    {slot.status === "done" && (
                      <button onClick={() => remove(idx)} style={{ background: "transparent", border: "none", padding: 4, cursor: "pointer", display: "flex", alignItems: "center", flexShrink: 0 }}>
                        <svg width="16" height="20" viewBox="0 0 15.5 19.5" fill="none"><path d={svgPaths.p28f2500} fill={T.fgMuted} /></svg>
                      </button>
                    )}
                    {slot.status === "error" && (
                      <button onClick={() => browse(idx)} style={{ background: "transparent", border: "none", padding: 4, cursor: "pointer", display: "flex", alignItems: "center", flexShrink: 0 }}>
                        <IRetry />
                      </button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </React.Fragment>
        ))}

        {/* Tips */}
        <div style={{ width: 448, paddingTop: 4 }}>
          <p style={{ margin: 0, ...fontBase, fontWeight: 700, fontSize: 16, lineHeight: "24px", color: T.fg }}>Tips</p>
          <ul style={{ margin: "0 0 0 24px", padding: 0 }}>
            {(tips ?? UPDATE_TIPS).map((tip, i) => (
              <li key={i} style={{ ...fontBase, fontWeight: 300, fontSize: 16, lineHeight: "24px", color: T.fg }}>{tip}</li>
            ))}
            {deleteHint && (
              <li style={{ ...fontBase, fontWeight: 300, fontSize: 16, lineHeight: "24px", color: canDelete ? T.fg : T.fgMuted }}>{deleteHint}</li>
            )}
          </ul>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center" style={{ padding: "12px 20px 16px" }}>
        <button
          onClick={canDelete ? onDelete : undefined}
          style={{ background: "transparent", border: `2px solid #EB0014`, borderRadius: 999, padding: "8px 16px", cursor: canDelete ? "pointer" : "not-allowed", opacity: canDelete ? 1 : 0.32 }}
        >
          <span style={{ ...fontBase, fontWeight: 700, fontSize: 16, lineHeight: "24px", color: "#EB0014" }}>删除记录</span>
        </button>
        <div className="flex items-center gap-2" style={{ marginLeft: "auto" }}>
          <button onClick={onCancel} style={{ background: "transparent", border: "none", borderRadius: 999, padding: "8px 16px", cursor: "pointer" }}>
            <span style={{ ...fontBase, fontWeight: 700, fontSize: 16, lineHeight: "24px", color: T.fg }}>取消</span>
          </button>
          <button
            onClick={requiredDone ? onUpdate : undefined}
            style={{ background: T.primary, border: "none", borderRadius: 999, padding: "8px 16px", cursor: requiredDone ? "pointer" : "not-allowed", opacity: requiredDone ? 1 : 0.32 }}
          >
            <span style={{ ...fontBase, fontWeight: 700, fontSize: 16, lineHeight: "24px", color: "white" }}>更新文档</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function UpdateRecognitionDialog({
  model, onCancel, onConfirm,
}: { model: string; onCancel: () => void; onConfirm: () => void }) {
  const fontBase: React.CSSProperties = { fontFamily: "'Neue Frutiger One', Inter, sans-serif" };
  const [source, setSource] = useState<"进口" | "国产">("进口");
  const [form, setForm] = useState({
    model,
    regNo: "国械注进 20257220001",
    approveDate: "2025-07-22",
    effectiveDate: "2026-07-22",
    expireDate: "2031-07-21",
  });

  const inputStyle: React.CSSProperties = {
    background: T.bg, border: `1px solid #6b8094`, borderRadius: 6,
    padding: "8px 12px", fontSize: 16, fontFamily: "'Neue Frutiger One', Inter, sans-serif",
    lineHeight: "24px", color: T.fg, width: "100%", outline: "none", boxSizing: "border-box",
  };

  const FormRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex items-start gap-[10px]" style={{ width: "100%" }}>
      <div style={{ width: 120, height: 40, display: "flex", alignItems: "center", flexShrink: 0 }}>
        <span style={{ ...fontBase, fontSize: 16, lineHeight: "24px", color: T.fg, whiteSpace: "nowrap" }}>{label}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -10 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      style={{
        background: T.bg, borderRadius: 12, border: `1px solid ${T.border}`,
        boxShadow: "0px 0px 1px rgba(58,69,80,0.16), 0px 16px 8px rgba(58,69,80,0.08), 0px 24px 16px rgba(58,69,80,0.16)",
        width: 500, display: "flex", flexDirection: "column",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2" style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
        <span style={{ ...fontBase, fontWeight: 700, fontSize: 20, lineHeight: "24px", color: T.fg, flex: 1 }}>
          {model} 更新记录 -识别结果
        </span>
        <button onClick={onCancel} style={{ background: "transparent", border: "none", padding: 8, borderRadius: 999, cursor: "pointer", display: "flex", alignItems: "center" }}>
          <IClose />
        </button>
      </div>

      {/* Form */}
      <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
        {/* 产品来源 radio */}
        <FormRow label="产品来源:">
          <div style={{ height: 40, display: "flex", alignItems: "center", gap: 24 }}>
            {(["进口", "国产"] as const).map(opt => (
              <label key={opt} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                <div onClick={() => setSource(opt)} style={{
                  width: 20, height: 20, borderRadius: "50%", background: T.bg,
                  border: `2px solid ${source === opt ? T.primary : "#6b8094"}`,
                  display: "flex", alignItems: "center", justifyContent: "center", transition: "border-color 0.15s",
                }}>
                  {source === opt && (
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                      style={{ width: 10, height: 10, borderRadius: "50%", background: T.primary }} />
                  )}
                </div>
                <span style={{ ...fontBase, fontSize: 16, lineHeight: "24px", color: T.fg }}>{opt}</span>
              </label>
            ))}
          </div>
        </FormRow>
        <FormRow label="产品型号:">
          <div style={{ height: 40 }}>
            <input value={form.model} onChange={e => setForm(f => ({ ...f, model: e.target.value }))} style={inputStyle} />
          </div>
        </FormRow>
        <FormRow label="注册证号:">
          <div style={{ height: 40 }}>
            <input value={form.regNo} onChange={e => setForm(f => ({ ...f, regNo: e.target.value }))} style={inputStyle} />
          </div>
        </FormRow>
        <FormRow label="批准日期:">
          <div style={{ height: 40 }}>
            <div style={{ ...inputStyle, display: "flex", alignItems: "center", padding: 0 }}>
              <input type="date" value={form.approveDate} onChange={e => setForm(f => ({ ...f, approveDate: e.target.value }))}
                style={{ border: "none", outline: "none", flex: 1, padding: "8px 12px", fontSize: 16, fontFamily: "'Neue Frutiger One', Inter, sans-serif", color: T.fg, background: "transparent" }} />
              <div style={{ paddingRight: 8, flexShrink: 0 }}><ICalendar /></div>
            </div>
          </div>
        </FormRow>
        <FormRow label="生效日期:">
          <div style={{ height: 40 }}>
            <div style={{ ...inputStyle, display: "flex", alignItems: "center", padding: 0 }}>
              <input type="date" value={form.effectiveDate} onChange={e => setForm(f => ({ ...f, effectiveDate: e.target.value }))}
                style={{ border: "none", outline: "none", flex: 1, padding: "8px 12px", fontSize: 16, fontFamily: "'Neue Frutiger One', Inter, sans-serif", color: T.fg, background: "transparent" }} />
              <div style={{ paddingRight: 8, flexShrink: 0 }}><ICalendar /></div>
            </div>
          </div>
        </FormRow>
        <FormRow label="有效期至:">
          <div style={{ height: 40 }}>
            <div style={{ ...inputStyle, display: "flex", alignItems: "center", padding: 0 }}>
              <input type="date" value={form.expireDate} onChange={e => setForm(f => ({ ...f, expireDate: e.target.value }))}
                style={{ border: "none", outline: "none", flex: 1, padding: "8px 12px", fontSize: 16, fontFamily: "'Neue Frutiger One', Inter, sans-serif", color: T.fg, background: "transparent" }} />
              <div style={{ paddingRight: 8, flexShrink: 0 }}><ICalendar /></div>
            </div>
          </div>
        </FormRow>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2" style={{ padding: "0 20px 16px" }}>
        <button onClick={onCancel} style={{ background: "transparent", border: "none", borderRadius: 999, padding: "8px 16px", cursor: "pointer" }}>
          <span style={{ ...fontBase, fontWeight: 700, fontSize: 16, lineHeight: "24px", color: T.fg }}>取消</span>
        </button>
        <button onClick={onConfirm} style={{ background: T.primary, border: "none", borderRadius: 999, padding: "8px 16px", cursor: "pointer" }}>
          <span style={{ ...fontBase, fontWeight: 700, fontSize: 16, lineHeight: "24px", color: "white" }}>确认</span>
        </button>
      </div>
    </motion.div>
  );
}

function UpdateDeleteConfirmDialog({
  model, onCancel, onDelete, message,
}: { model: string; onCancel: () => void; onDelete: () => void; message?: string }) {
  const fontBase: React.CSSProperties = { fontFamily: "'Neue Frutiger One', Inter, sans-serif" };
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -10 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      style={{
        background: T.bg, borderRadius: 12, border: `1px solid ${T.border}`,
        boxShadow: "0px 0px 1px rgba(58,69,80,0.16), 0px 16px 8px rgba(58,69,80,0.08), 0px 24px 16px rgba(58,69,80,0.16)",
        width: 488, display: "flex", flexDirection: "column",
      }}
    >
      <div className="flex items-center gap-2" style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
        <span style={{ ...fontBase, fontWeight: 700, fontSize: 20, lineHeight: "24px", color: "#D60012", flex: 1 }}>{model}</span>
        <button onClick={onCancel} style={{ background: "transparent", border: "none", padding: 8, borderRadius: 999, cursor: "pointer", display: "flex", alignItems: "center" }}>
          <IClose />
        </button>
      </div>
      <div style={{ padding: "20px 20px 16px" }}>
        <p style={{ ...fontBase, fontWeight: 300, fontSize: 16, lineHeight: "24px", color: T.fg, margin: 0 }}>
          {message ?? "确认删除 PTR对比表4？删除后该记录将从当前PTR更新记录中移除。"}
        </p>
      </div>
      <div className="flex items-center justify-end gap-2" style={{ padding: "0 20px 16px" }}>
        <button onClick={onCancel} style={{ background: "transparent", border: "none", borderRadius: 999, padding: "8px 16px", cursor: "pointer" }}>
          <span style={{ ...fontBase, fontWeight: 700, fontSize: 16, lineHeight: "24px", color: T.fg }}>取消</span>
        </button>
        <button onClick={onDelete} style={{ background: "#EB0014", border: "none", borderRadius: 999, padding: "8px 16px", cursor: "pointer" }}>
          <span style={{ ...fontBase, fontWeight: 700, fontSize: 16, lineHeight: "24px", color: "white" }}>删除</span>
        </button>
      </div>
    </motion.div>
  );
}

function UpdateSuccessToast({ model, onClose }: { model: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4500); return () => clearTimeout(t); }, [onClose]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.97 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      style={{
        background: "#E0FFED", borderRadius: 12, border: `1px solid ${T.green}`,
        padding: "12px 16px", display: "flex", alignItems: "center", gap: 12,
        minWidth: 360, maxWidth: 520,
        boxShadow: "0px 0px 1px rgba(58,69,80,0.16), 0px 16px 8px rgba(58,69,80,0.08), 0px 24px 16px rgba(58,69,80,0.16)",
      }}
    >
      <div style={{ flexShrink: 0, width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <ICheckGreen />
      </div>
      <span style={{ fontFamily: "'Neue Frutiger One', Inter, sans-serif", fontSize: 16, lineHeight: "24px", color: T.fg, flex: 1 }}>
        {model} PTR更新已完成。
      </span>
      <button onClick={onClose} style={{ background: "transparent", border: "none", padding: 8, cursor: "pointer", display: "flex", alignItems: "center" }}>
        <IClose color={T.fgMuted} />
      </button>
    </motion.div>
  );
}

function UpdateDeleteSuccessToast({ model, onClose }: { model: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4500); return () => clearTimeout(t); }, [onClose]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.97 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      style={{
        background: "#FFF0F0", borderRadius: 12, border: `1px solid #EB0014`,
        padding: "12px 16px", display: "flex", alignItems: "center", gap: 12,
        minWidth: 360, maxWidth: 520,
        boxShadow: "0px 0px 1px rgba(58,69,80,0.16), 0px 16px 8px rgba(58,69,80,0.08), 0px 24px 16px rgba(58,69,80,0.16)",
      }}
    >
      <div style={{ flexShrink: 0, width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d={svgPaths4.p1970ad00} fill="#EB0014" /></svg>
      </div>
      <span style={{ fontFamily: "'Neue Frutiger One', Inter, sans-serif", fontSize: 16, lineHeight: "24px", color: T.fg, flex: 1 }}>
        {model} PTR更新记录已删除。
      </span>
      <button onClick={onClose} style={{ background: "transparent", border: "none", padding: 8, cursor: "pointer", display: "flex", alignItems: "center" }}>
        <IClose color={T.fgMuted} />
      </button>
    </motion.div>
  );
}

// ─── PTR Detail Side Panel ────────────────────────────────────────────────────

type DetailTab = "有效" | "待生效" | "失效";

// 时间线按 Tab（PTR 版本状态）过滤，匹配 Figma「展开详情页」流程：
//  · 有效 / 失效：原始PTR + PTR对比表1-4
//  · 待生效：仅「原始PTR」（对比表尚未生效）
const DETAIL_TIMELINE_FULL = [
  { name: "原始PTR",    date: "2024-03-18" },
  { name: "PTR对比表1", date: "2025-03-18" },
  { name: "PTR对比表2", date: "2025-09-18" },
  { name: "PTR对比表3", date: "2025-12-18" },
  { name: "PTR对比表4", date: "2026-03-18" },
];

const DETAIL_TIMELINE_BY_TAB: Record<DetailTab, { name: string; date: string }[]> = {
  "有效":   DETAIL_TIMELINE_FULL,
  "待生效": DETAIL_TIMELINE_FULL.slice(0, 1),
  "失效":   DETAIL_TIMELINE_FULL,
};


function PtrDetailPanel({ row, onClose, onEdit, onDownload, onOpenDoc, onMerge }: { row: PtrRow; onClose: () => void; onEdit?: () => void; onDownload?: (docName: string) => void; onOpenDoc?: (info: { name: string; isLatest: boolean; dateLabel?: string }) => void; onMerge?: () => void }) {
  const [activeTab, setActiveTab] = useState<DetailTab>("有效");
  const timeline = DETAIL_TIMELINE_BY_TAB[activeTab];

  const fields = [
    { label: "注册证号",  value: row.regNo,          blue: true },
    { label: "批准日期",  value: row.approveDate,    blue: true },
    { label: "生效日期",  value: row.effectiveDate,  blue: true },
    { label: "有效期至",  value: row.expireDate,      blue: true },
    { label: "最后更新人", value: row.updatedBy,      blue: false },
    { label: "最近更新",  value: row.updatedAt,       blue: false },
  ];

  const font: React.CSSProperties = { fontFamily: "'Neue Frutiger One', Inter, sans-serif" };

  return (
    <motion.div
      initial={{ x: 380 }}
      animate={{ x: 0 }}
      exit={{ x: 380 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        bottom: 0,
        width: 380,
        background: T.bg,
        borderLeft: `1px solid ${T.border}`,
        zIndex: 30,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        boxShadow: "-4px 0 16px rgba(21,25,30,0.08)",
      }}
    >
      {/* Header */}
      <div
        style={{
          height: 56,
          padding: "0 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${T.border}`,
          flexShrink: 0,
        }}
      >
        <span style={{ ...font, fontWeight: 700, fontSize: 18, lineHeight: "26px", color: "#0061C2" }}>
          Azurion {row.model}
        </span>
        <button
          onClick={onClose}
          style={{ background: "transparent", border: "none", padding: 8, cursor: "pointer", display: "flex", alignItems: "center" }}
        >
          <IClose color={T.fgMuted} />
        </button>
      </div>

      {/* Info fields */}
      <div style={{ padding: "16px 18px", display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
        {fields.map(f => (
          <div key={f.label} style={{ display: "flex", alignItems: "center", minHeight: 24, gap: 8 }}>
            <span style={{ ...font, fontWeight: 300, fontSize: 16, lineHeight: "24px", color: T.fg, flex: 1, whiteSpace: "nowrap" }}>
              {f.label}
            </span>
            <span style={{ ...font, fontSize: 16, lineHeight: "24px", color: f.blue ? "#0061C2" : T.fg, textAlign: "right" }}>
              {f.value}
            </span>
          </div>
        ))}
      </div>

      {/* 编辑PTR信息 button */}
      <div style={{ padding: "0 18px 16px", flexShrink: 0, display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={onEdit}
          style={{
            background: "transparent",
            border: `2px solid ${T.fg}`,
            borderRadius: 999,
            padding: "8px 16px",
            cursor: "pointer",
          }}
        >
          <span style={{ ...font, fontWeight: 700, fontSize: 16, lineHeight: "24px", color: T.fg }}>
            编辑PTR信息
          </span>
        </button>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: T.border, flexShrink: 0 }} />

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        {(["有效", "待生效", "失效"] as DetailTab[]).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1,
              background: "transparent",
              border: "none",
              padding: "16px 12px",
              cursor: "pointer",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{
              ...font,
              fontSize: 16,
              lineHeight: "24px",
              color: activeTab === tab ? "#0072DB" : T.fgMuted,
              fontWeight: activeTab === tab ? 700 : 300,
            }}>
              {tab}
            </span>
            {activeTab === tab && (
              <div style={{
                position: "absolute",
                bottom: 0,
                left: 4,
                right: 4,
                height: 3,
                background: "#0072DB",
                borderRadius: "2px 2px 0 0",
              }} />
            )}
          </button>
        ))}
      </div>

      {/* Timeline list */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {timeline.length === 0 ? (
          <div style={{ padding: "24px 18px", textAlign: "center", ...font, fontWeight: 300, fontSize: 14, lineHeight: "20px", color: T.fgMuted }}>
            暂无{activeTab}的 PTR 版本
          </div>
        ) : timeline.map((item, idx) => {
          const isOrig = item.name === "原始PTR";
          const doc1 = isOrig ? "注册证书.pdf" : "变更批件.pdf";
          const doc2 = isOrig ? "获批PTR.pdf" : "获批PTR对比表.pdf";
          const doc3 = isOrig ? "获批PTR中文版.docx" : "获批PTR对比表中文版.docx";
          return (
          <div key={item.name} style={{ display: "flex", alignItems: "stretch" }}>
            {/* Timeline track */}
            <div style={{ width: 44, display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, paddingTop: 20 }}>
              <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#0072DB", flexShrink: 0 }} />
              {idx < timeline.length - 1 && (
                <div style={{ flex: 1, width: 2, background: "#BBC5CD", marginTop: 4, minHeight: 24 }} />
              )}
            </div>
            {/* Row content */}
            <div style={{ flex: 1, padding: "12px 12px 12px 4px", display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...font, fontWeight: 300, fontSize: 16, lineHeight: "24px", color: T.fg }}>{item.name}</div>
                <div style={{ ...font, fontSize: 12, lineHeight: "16px", color: T.fgMuted }}>{item.date}</div>
              </div>
              {/* File type icons */}
              <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                <div onClick={() => onDownload?.(doc1)} title={`下载 ${doc1}`} style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <svg width="26" height="26" viewBox="0 0 26 25.502" fill="none"><path d={svgPaths5.p3e670900} fill={T.fgMuted} /></svg>
                </div>
                <div onClick={() => onDownload?.(doc2)} title={`下载 ${doc2}`} style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <svg width="18" height="26" viewBox="0 0 18 26" fill="none"><path d={svgPaths5.p27fe600} fill={T.fgMuted} /></svg>
                </div>
                <div onClick={() => onDownload?.(doc3)} title={`下载 ${doc3}`} style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <svg width="18" height="26" viewBox="0 0 18 26" fill="none"><path d={svgPaths5.p3782e040} fill={T.fgMuted} /></svg>
                </div>
              </div>
              {/* Chevron */}
              <button
                onClick={() => onOpenDoc?.({
                  name: item.name,
                  isLatest: idx === timeline.length - 1,
                  dateLabel: activeTab === "待生效" ? "生效时间" : undefined,
                })}
                title={`维护 ${item.name} 文档`}
                style={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: "transparent", border: "none", padding: 0, cursor: "pointer" }}
              >
                <svg width="9" height="17" viewBox="0 0 8.06055 16.1211" fill="none">
                  <path d={svgPaths5.p21514d80} fill={T.fg} />
                </svg>
              </button>
            </div>
          </div>
          );
        })}
      </div>

      {/* 合并下载PTR button */}
      <div style={{ padding: "16px 18px", borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>
        {(() => {
          const disabled = activeTab === "待生效" || activeTab === "失效";
          return (
            <button
              disabled={disabled}
              onClick={disabled ? undefined : onMerge}
              style={{
                width: "100%",
                background: disabled ? "#E8EBEE" : "#0072DB",
                border: "none",
                borderRadius: 999,
                padding: "8px 16px",
                cursor: disabled ? "not-allowed" : "pointer",
              }}
            >
              <span style={{ ...font, fontWeight: 700, fontSize: 16, lineHeight: "24px", color: disabled ? "#A3ADB6" : "white" }}>
                合并下载PTR
              </span>
            </button>
          );
        })()}
      </div>
    </motion.div>
  );
}

// ─── Merge Download Dialog ─────────────────────────────────────────────────────
// 入口：详情页(有效tab)「合并下载PTR」。Figma 设计：700px 宽，Label + 中文/英文两列复选矩阵。

type MergeLang = "zh" | "en";
type MergeFile = { key: string; label: string; zh: string | null; en: string | null; required?: boolean };

function MergeDownloadDialog({ model, onCancel, onConfirm }: { model: string; onCancel: () => void; onConfirm: () => void }) {
  const fontBase: React.CSSProperties = { fontFamily: "'Neue Frutiger One', Inter, sans-serif" };

  const FILES: MergeFile[] = [
    { key: "orig", label: "原始PTR",   zh: `PTR_Azurion_${model}_原始版本.docx`, en: `PTR_Azurion_${model}_原始版本_EN.docx`, required: true },
    { key: "c1",   label: "PTR对比表1", zh: `PTR_Azurion_${model}_对比表1.docx`,  en: `PTR_Azurion_${model}_对比表1_EN.docx` },
    { key: "c2",   label: "PTR对比表2", zh: null,                                 en: `PTR_Azurion_${model}_对比表2_EN.docx` },
    { key: "c3",   label: "PTR对比表3", zh: `PTR_Azurion_${model}_对比表3.docx`,  en: `PTR_Azurion_${model}_对比表3_EN.docx` },
    { key: "c4",   label: "PTR对比表4", zh: `PTR_Azurion_${model}_对比表4.docx`,  en: `PTR_Azurion_${model}_对比表4_EN.docx` },
  ];

  const [langZh, setLangZh] = useState(true);
  const [langEn, setLangEn] = useState(false);
  const [checked, setChecked] = useState<Set<string>>(() => new Set(["zh:orig", "zh:c1"]));
  const [warn, setWarn] = useState(false);

  const langOn = (l: MergeLang) => (l === "zh" ? langZh : langEn);
  const cellKey = (l: MergeLang, key: string) => `${l}:${key}`;

  // 某语言下，index 是否可选：该行有文档，且之前各行均有文档（无对比表则中断变更链）
  const available = (l: MergeLang, idx: number) => {
    for (let i = 0; i <= idx; i++) if (FILES[i][l] == null) return false;
    return true;
  };

  const anyLang = langZh || langEn;
  const canConfirm = anyLang;

  // 选择某语言 → 默认选中该语言可合并的原始PTR与对比表（按变更链）
  const toggleLang = (l: MergeLang) => {
    const turningOn = !langOn(l);
    if (l === "zh") setLangZh(turningOn); else setLangEn(turningOn);
    setChecked(prev => {
      const s = new Set(prev);
      if (turningOn) {
        for (let i = 0; i < FILES.length; i++) if (available(l, i)) s.add(cellKey(l, FILES[i].key));
      } else {
        FILES.forEach(f => s.delete(cellKey(l, f.key)));
      }
      return s;
    });
  };

  // 勾选较后对比表 → 自动包含其之前同语言项；取消 → 取消其之后项；原始PTR为必选基线不可取消
  const toggleCell = (l: MergeLang, idx: number) => {
    if (!langOn(l) || !available(l, idx)) return;
    const key = FILES[idx].key;
    const isChecking = !checked.has(cellKey(l, key));
    if (!isChecking && FILES[idx].required) { setWarn(true); return; }
    setChecked(prev => {
      const s = new Set(prev);
      if (isChecking) { for (let i = 0; i <= idx; i++) if (available(l, i)) s.add(cellKey(l, FILES[i].key)); }
      else { for (let i = idx; i < FILES.length; i++) s.delete(cellKey(l, FILES[i].key)); }
      return s;
    });
  };

  const Check = ({ on, disabled }: { on: boolean; disabled?: boolean }) => (
    <div style={{
      width: 20, height: 20, borderRadius: 4, flexShrink: 0,
      background: on ? T.primary : T.bg,
      border: on ? "none" : `1px solid #6b8094`,
      display: "flex", alignItems: "center", justifyContent: "center",
      opacity: disabled ? 0.4 : 1,
    }}>
      {on && <svg width="11" height="11" viewBox="0 0 10.9707 10.5601" fill="none"><path d={svgPaths3.p2af3100} fill="white" /></svg>}
    </div>
  );

  // 文件单元格（中文/英文列）
  const FileCell = ({ l, idx }: { l: MergeLang; idx: number }) => {
    const doc = FILES[idx][l];
    if (doc == null) {
      return (
        <div style={{ width: 260, display: "flex", alignItems: "center", gap: 8 }}>
          <Check on={false} disabled />
          <span style={{ ...fontBase, fontSize: 16, lineHeight: "24px", color: T.fgMuted }}>无对比表</span>
        </div>
      );
    }
    const on = checked.has(cellKey(l, FILES[idx].key));
    const disabled = !langOn(l) || !available(l, idx);
    return (
      <div
        onClick={disabled ? undefined : () => toggleCell(l, idx)}
        style={{ width: 260, display: "flex", alignItems: "center", gap: 8, cursor: disabled ? "not-allowed" : "pointer" }}
      >
        <Check on={on} disabled={disabled} />
        <span style={{ ...fontBase, fontSize: 16, lineHeight: "24px", color: disabled ? T.fgMuted : "#0061C2", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc}</span>
      </div>
    );
  };

  const FieldRow = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 10, minHeight: 40 }}>
      <div style={{ width: 120, flexShrink: 0 }}>
        <span style={{ ...fontBase, fontSize: 16, lineHeight: "24px", color: T.fg, whiteSpace: "nowrap" }}>{label}</span>
      </div>
      {children}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: -10 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      style={{
        background: T.bg, borderRadius: 12, border: `1px solid ${T.border}`,
        boxShadow: "0px 0px 1px rgba(58,69,80,0.16), 0px 16px 8px rgba(58,69,80,0.08), 0px 24px 16px rgba(58,69,80,0.16)",
        width: 700, maxHeight: "86vh", display: "flex", flexDirection: "column",
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2" style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}`, flexShrink: 0 }}>
        <span style={{ ...fontBase, fontWeight: 700, fontSize: 20, lineHeight: "24px", color: T.fg, flex: 1 }}>合并下载PTR</span>
        <button onClick={onCancel} style={{ background: "transparent", border: "none", padding: 8, borderRadius: 999, cursor: "pointer", display: "flex", alignItems: "center" }}>
          <IClose />
        </button>
      </div>

      {/* Body */}
      <div style={{ padding: "16px 20px", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
        {/* 语言行 */}
        <FieldRow label="语言:">
          <div onClick={() => toggleLang("zh")} style={{ width: 260, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <Check on={langZh} /><span style={{ ...fontBase, fontSize: 16, lineHeight: "24px", color: T.fg }}>中文</span>
          </div>
          <div onClick={() => toggleLang("en")} style={{ width: 260, display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <Check on={langEn} /><span style={{ ...fontBase, fontSize: 16, lineHeight: "24px", color: T.fg }}>英文</span>
          </div>
        </FieldRow>

        {/* 文件矩阵 */}
        {FILES.map((f, idx) => (
          <FieldRow key={f.key} label={`${f.label}${f.required ? " *" : ""}:`}>
            <FileCell l="zh" idx={idx} />
            <FileCell l="en" idx={idx} />
          </FieldRow>
        ))}

        {!anyLang && <div style={{ ...fontBase, fontSize: 12, lineHeight: "16px", color: T.red }}>请至少选择一个语言版本。</div>}
        {warn && <div style={{ ...fontBase, fontSize: 12, lineHeight: "16px", color: T.red }}>原始PTR为必选基线，必须保留。</div>}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2" style={{ padding: "12px 20px 16px", borderTop: `1px solid ${T.border}`, flexShrink: 0 }}>
        <button onClick={onCancel} style={{ background: "transparent", border: "none", borderRadius: 999, padding: "8px 16px", cursor: "pointer" }}>
          <span style={{ ...fontBase, fontWeight: 700, fontSize: 16, lineHeight: "24px", color: T.fg }}>取消</span>
        </button>
        <button
          onClick={canConfirm ? onConfirm : undefined}
          style={{ background: T.primary, border: "none", borderRadius: 999, padding: "8px 16px", cursor: canConfirm ? "pointer" : "not-allowed", opacity: canConfirm ? 1 : 0.32 }}
        >
          <span style={{ ...fontBase, fontWeight: 700, fontSize: 16, lineHeight: "24px", color: "white" }}>合并下载</span>
        </button>
      </div>
    </motion.div>
  );
}

// ─── Backdrop ─────────────────────────────────────────────────────────────────

function Backdrop({ children, onBgClick }: { children: React.ReactNode; onBgClick?: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      style={{
        position: "absolute",
        inset: 0,
        background: "rgba(21,25,30,0.5)",
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onBgClick}
    >
      <div onClick={e => e.stopPropagation()}>{children}</div>
    </motion.div>
  );
}

// ─── Global Comment Layer ────────────────────────────────────────────────────

function GlobalCommentLayer({ scope, onJumpToScope }: { scope: string; onJumpToScope: (scope: string) => void }) {
  const [commentMode, setCommentMode] = useState(false);
  const [commentUser, setCommentUser] = useState<CommentAuthor>(() => {
    try {
      const raw = window.localStorage.getItem(COMMENTS_USER_STORAGE_KEY);
      if (!raw) return { name: "当前用户", role: "" };
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return { name: "当前用户", role: "" };
      return {
        name: typeof parsed.name === "string" && parsed.name.trim() ? parsed.name.trim() : "当前用户",
        role: typeof parsed.role === "string" ? parsed.role.trim() : "",
      };
    } catch {
      return { name: "当前用户", role: "" };
    }
  });
  const [isUserEditorOpen, setIsUserEditorOpen] = useState(false);
  const [userNameInput, setUserNameInput] = useState("");
  const [userRoleInput, setUserRoleInput] = useState("");
  const [notes, setNotes] = useState<CommentNote[]>(() => {
    try {
      const raw = window.localStorage.getItem(COMMENTS_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return normalizeCommentNotes(parsed);
    } catch {
      return [];
    }
  });
  const [draftPos, setDraftPos] = useState<{ x: number; y: number } | null>(null);
  const [draftText, setDraftText] = useState("");
  const [replyText, setReplyText] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "open" | "resolved">("all");
  const dragStateRef = useRef<{ id: string; startX: number; startY: number; moved: boolean } | null>(null);
  const suppressClickRef = useRef<string | null>(null);
  const isRemoteEnabled = true;
  const [isRemoteReady, setIsRemoteReady] = useState(false);
  const notesRef = useRef<CommentNote[]>(notes);
  const initialNotesRef = useRef<CommentNote[]>(notes);
  const lastSyncedSnapshotRef = useRef<string>(JSON.stringify(notes));

  useEffect(() => {
    try {
      window.localStorage.setItem(COMMENTS_STORAGE_KEY, JSON.stringify(notes));
    } catch {
      // Ignore storage errors for prototype behavior.
    }
  }, [notes]);

  useEffect(() => {
    try {
      window.localStorage.setItem(COMMENTS_USER_STORAGE_KEY, JSON.stringify(commentUser));
    } catch {
      // Ignore storage errors for prototype behavior.
    }
  }, [commentUser]);

  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      try {
        const resp = await fetch(COMMENTS_API_URL, { method: "GET" });
        if (!active) return;
        if (!resp.ok) {
          setIsRemoteReady(true);
          return;
        }

        const data = await resp.json() as { payload?: unknown };
        if (Array.isArray(data?.payload)) {
          const incoming = normalizeCommentNotes(data.payload);
          const incomingSerialized = JSON.stringify(incoming);
          if (incoming.length) {
            lastSyncedSnapshotRef.current = incomingSerialized;
            setNotes(incoming);
          } else {
            const initialNotes = initialNotesRef.current;
            await fetch(COMMENTS_API_URL, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ payload: initialNotes }),
            });
            lastSyncedSnapshotRef.current = JSON.stringify(initialNotes);
          }
        }
      } catch {
        // Keep local fallback when API is not reachable.
      }
      if (active) setIsRemoteReady(true);
    };

    bootstrap();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!isRemoteReady) return;

    const iv = window.setInterval(async () => {
      try {
        const resp = await fetch(COMMENTS_API_URL, { method: "GET" });
        if (!resp.ok) return;
        const data = await resp.json() as { payload?: unknown };
        if (!Array.isArray(data?.payload)) return;

        const incoming = normalizeCommentNotes(data.payload);
        const incomingSerialized = JSON.stringify(incoming);
        const currentSerialized = JSON.stringify(notesRef.current);
        if (incomingSerialized !== currentSerialized) {
          lastSyncedSnapshotRef.current = incomingSerialized;
          setNotes(incoming);
        }
      } catch {
        // Ignore temporary network errors.
      }
    }, 2000);

    return () => window.clearInterval(iv);
  }, [isRemoteReady]);

  useEffect(() => {
    if (!isRemoteReady) return;

    const serialized = JSON.stringify(notes);
    if (serialized === lastSyncedSnapshotRef.current) return;

    const t = window.setTimeout(async () => {
      try {
        const resp = await fetch(COMMENTS_API_URL, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ payload: notes }),
        });
        if (resp.ok) {
          lastSyncedSnapshotRef.current = serialized;
        }
      } catch {
        // Keep local data and retry on next update.
      }
    }, 400);

    return () => window.clearTimeout(t);
  }, [notes, isRemoteReady]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setCommentMode(false);
      setDraftPos(null);
      setDraftText("");
      setReplyText("");
      setActiveId(null);
      setIsUserEditorOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isTyping = !!target && (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      );
      if (isTyping) return;
      if (e.key.toLowerCase() !== "c" || e.metaKey || e.ctrlKey || e.altKey) return;
      e.preventDefault();
      setCommentMode(v => !v);
      setDraftPos(null);
      setDraftText("");
      setReplyText("");
      setActiveId(null);
      setIsUserEditorOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      const drag = dragStateRef.current;
      if (!drag) return;

      const dx = e.clientX - drag.startX;
      const dy = e.clientY - drag.startY;
      if (!drag.moved && (Math.abs(dx) > 2 || Math.abs(dy) > 2)) {
        drag.moved = true;
      }
      if (!drag.moved) return;

      setNotes(prev => prev.map(note => {
        if (note.id !== drag.id || note.scope !== scope) return note;
        return {
          ...note,
          x: Math.max(13, Math.min(note.x + dx, window.innerWidth - 13)),
          y: Math.max(13, Math.min(note.y + dy, window.innerHeight - 13)),
        };
      }));

      drag.startX = e.clientX;
      drag.startY = e.clientY;
    };

    const onMouseUp = () => {
      const drag = dragStateRef.current;
      if (!drag) return;
      if (drag.moved) {
        suppressClickRef.current = drag.id;
        window.setTimeout(() => {
          if (suppressClickRef.current === drag.id) suppressClickRef.current = null;
        }, 0);
      }
      dragStateRef.current = null;
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, []);

  useEffect(() => {
    setCommentMode(false);
    setDraftPos(null);
    setDraftText("");
    setReplyText("");
    setActiveId(prev => {
      if (!prev) return null;
      return notesRef.current.some(note => note.id === prev && note.scope === scope) ? prev : null;
    });
    setIsUserEditorOpen(false);
  }, [scope]);

  const scopedNotes = notes.filter(note => note.scope === scope);
  const activeNote = activeId ? scopedNotes.find(n => n.id === activeId) ?? null : null;
  const openCount = scopedNotes.filter(note => !note.resolved).length;
  const resolvedCount = scopedNotes.length - openCount;
  const totalOpenCount = notes.filter(note => !note.resolved).length;
  const totalResolvedCount = notes.length - totalOpenCount;
  const visibleNotes = scopedNotes.filter(note => {
    if (filter === "open") return !note.resolved;
    if (filter === "resolved") return note.resolved;
    return true;
  });
  const openNotes = scopedNotes.filter(note => !note.resolved);
  const allOpenNotes = notes.filter(note => !note.resolved);

  const formatTimestamp = (ts: string) => {
    const d = new Date(ts);
    if (Number.isNaN(d.getTime())) return ts;
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const calcPanelPos = (x: number, y: number) => {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const panelW = 320;
    const panelH = 420;
    return {
      left: Math.max(16, Math.min(x + 14, vw - panelW - 16)),
      top: Math.max(70, Math.min(y + 14, vh - panelH - 16)),
    };
  };

  const getInitials = (name: string) => {
    const clean = name.trim();
    if (!clean) return "我";
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`.toUpperCase();
    return clean.slice(0, 2).toUpperCase();
  };

  const openDraftAt = (x: number, y: number) => {
    setDraftPos({ x, y });
    setDraftText("");
    setReplyText("");
    setActiveId(null);
  };

  const submitDraft = () => {
    if (!draftPos) return;
    const text = draftText.trim();
    if (!text) return;
    const now = new Date().toISOString();
    const newNote: CommentNote = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      scope,
      x: draftPos.x,
      y: draftPos.y,
      resolved: false,
      messages: [{
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        text,
        createdAt: now,
        author: commentUser,
      }],
    };
    setNotes(prev => [...prev, newNote]);
    setDraftPos(null);
    setDraftText("");
    setReplyText("");
    setActiveId(newNote.id);
    setCommentMode(false);
  };

  const submitReply = () => {
    const text = replyText.trim();
    if (!activeId || !text) return;
    const message: CommentMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      text,
      createdAt: new Date().toISOString(),
      author: commentUser,
    };
    setNotes(prev => prev.map(note => (
      note.id === activeId
        ? { ...note, resolved: false, messages: [...note.messages, message] }
        : note
    )));
    setReplyText("");
  };

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
    if (activeId === id) setActiveId(null);
  };

  const toggleResolved = (id: string) => {
    setNotes(prev => prev.map(note => (
      note.id === id ? { ...note, resolved: !note.resolved } : note
    )));
  };

  const startDragPin = (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    dragStateRef.current = {
      id,
      startX: e.clientX,
      startY: e.clientY,
      moved: false,
    };
  };

  const focusNextOpenNote = () => {
    if (!allOpenNotes.length) return;
    const currentIdx = allOpenNotes.findIndex(note => note.id === activeId);
    const nextIdx = currentIdx >= 0 ? (currentIdx + 1) % allOpenNotes.length : 0;
    const nextNote = allOpenNotes[nextIdx];
    setActiveId(nextNote.id);
    onJumpToScope(nextNote.scope);
    setCommentMode(false);
    setDraftPos(null);
    setDraftText("");
    setReplyText("");
  };

  const closeAllDrafts = () => {
    setCommentMode(false);
    setDraftPos(null);
    setDraftText("");
    setReplyText("");
    setIsUserEditorOpen(false);
  };

  const openUserEditor = () => {
    setUserNameInput(commentUser.name);
    setUserRoleInput(commentUser.role);
    setIsUserEditorOpen(true);
  };

  const saveUserInfo = () => {
    setCommentUser({
      name: userNameInput.trim() || "当前用户",
      role: userRoleInput.trim(),
    });
    setIsUserEditorOpen(false);
  };

  return (
    <>
      <div
        style={{
          position: "fixed",
          right: 20,
          bottom: 20,
          zIndex: 130,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            borderRadius: 999,
            padding: "7px 10px",
            background: "rgba(255,255,255,0.9)",
            border: `1px solid ${T.border}`,
            color: T.fgMuted,
            fontFamily: "Inter, sans-serif",
            fontWeight: 600,
            fontSize: 12,
            lineHeight: "16px",
          }}
        >
          快捷键 C
        </div>
        <button
          onClick={openUserEditor}
          style={{
            border: `1px solid ${T.border}`,
            borderRadius: 999,
            padding: "8px 12px",
            background: "#fff",
            color: T.fg,
            cursor: "pointer",
            fontFamily: "Inter, sans-serif",
            fontWeight: 600,
            fontSize: 12,
            lineHeight: "16px",
            maxWidth: 180,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
          title={`留言人：${commentUser.name}${commentUser.role ? ` (${commentUser.role})` : ""}`}
        >
          留言人：{commentUser.name}
        </button>
        <button
          onClick={() => {
            setCommentMode(v => !v);
            setDraftPos(null);
            setDraftText("");
            setReplyText("");
            setActiveId(null);
            setIsUserEditorOpen(false);
          }}
          style={{
            border: "none",
            borderRadius: 999,
            padding: "10px 16px",
            cursor: "pointer",
            background: commentMode ? "#003D75" : T.primary,
            color: "#fff",
            fontFamily: "'Neue Frutiger One', Inter, sans-serif",
            fontWeight: 700,
            fontSize: 14,
            lineHeight: "20px",
            boxShadow: "0 10px 24px rgba(0, 114, 219, 0.28)",
          }}
        >
          {commentMode ? "退出留言模式" : "留言模式"}
        </button>
        <div
          style={{
            borderRadius: 999,
            padding: "8px 12px",
            background: "rgba(21,25,30,0.78)",
            color: "#fff",
            fontFamily: "Inter, sans-serif",
            fontWeight: 600,
            fontSize: 12,
            lineHeight: "16px",
          }}
        >
          {totalOpenCount} 未解决 / {totalResolvedCount} 已解决
        </div>
        {!isRemoteReady && (
          <div
            style={{
              borderRadius: 999,
              padding: "8px 12px",
              background: "rgba(194,65,0,0.12)",
              color: T.red,
              fontFamily: "Inter, sans-serif",
              fontWeight: 600,
              fontSize: 12,
              lineHeight: "16px",
            }}
            title="请启动本地留言服务：pnpm dev:api 或 pnpm dev:all"
          >
            等待留言服务连接
          </div>
        )}
        <div style={{ display: "flex", alignItems: "center", border: `1px solid ${T.border}`, borderRadius: 999, overflow: "hidden", background: "#fff" }}>
          {[
            { key: "all", label: "全部" },
            { key: "open", label: "未解决" },
            { key: "resolved", label: "已解决" },
          ].map((opt) => {
            const active = filter === opt.key;
            return (
              <button
                key={opt.key}
                onClick={() => {
                  setFilter(opt.key as "all" | "open" | "resolved");
                  setDraftPos(null);
                  setDraftText("");
                  setReplyText("");
                  if (activeId && !scopedNotes.find(n => n.id === activeId && (opt.key === "all" || (opt.key === "open" ? !n.resolved : n.resolved)))) {
                    setActiveId(null);
                  }
                }}
                style={{
                  border: "none",
                  borderRight: opt.key === "resolved" ? "none" : `1px solid ${T.border}`,
                  padding: "8px 10px",
                  background: active ? "rgba(0,114,219,0.12)" : "#fff",
                  color: active ? T.primary : T.fgMuted,
                  cursor: "pointer",
                  fontFamily: "Inter, sans-serif",
                  fontWeight: 700,
                  fontSize: 12,
                  lineHeight: "16px",
                }}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
        <button
          onClick={focusNextOpenNote}
          disabled={!allOpenNotes.length}
          style={{
            border: "none",
            borderRadius: 999,
            padding: "8px 12px",
            background: allOpenNotes.length ? "rgba(0,114,219,0.12)" : "rgba(86,102,118,0.14)",
            color: allOpenNotes.length ? T.primary : T.fgMuted,
            cursor: allOpenNotes.length ? "pointer" : "not-allowed",
            fontFamily: "'Neue Frutiger One', Inter, sans-serif",
            fontWeight: 700,
            fontSize: 12,
            lineHeight: "16px",
          }}
        >
          下一条未解决
        </button>
      </div>

      {(draftPos || activeId) && !commentMode && (
        <div
          onClick={() => {
            setDraftPos(null);
            setDraftText("");
            setReplyText("");
            setActiveId(null);
            setIsUserEditorOpen(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 125,
            background: "transparent",
          }}
        />
      )}

      {commentMode && (
        <div
          onClick={(e) => openDraftAt(e.clientX, e.clientY)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 120,
            cursor: "crosshair",
            background: "rgba(0, 114, 219, 0.05)",
          }}
        />
      )}

      {isUserEditorOpen && (
        <div
          style={{
            position: "fixed",
            right: 20,
            bottom: 72,
            zIndex: 132,
            width: 300,
            borderRadius: 12,
            background: "#fff",
            border: `1px solid ${T.border}`,
            boxShadow: "0 14px 28px rgba(21,25,30,0.18)",
            overflow: "hidden",
          }}
        >
          <div style={{ padding: "12px 14px", borderBottom: `1px solid ${T.border}` }}>
            <p style={{ margin: 0, fontFamily: "'Neue Frutiger One', Inter, sans-serif", fontWeight: 700, fontSize: 15, lineHeight: "22px", color: T.fg }}>
              设置留言人
            </p>
          </div>
          <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 8 }}>
            <input
              value={userNameInput}
              onChange={(e) => setUserNameInput(e.target.value)}
              placeholder="姓名"
              style={{ height: 36, borderRadius: 8, border: `1px solid ${T.border}`, padding: "0 10px", fontFamily: "Inter, sans-serif", fontSize: 13, color: T.fg, outline: "none" }}
            />
            <input
              value={userRoleInput}
              onChange={(e) => setUserRoleInput(e.target.value)}
              placeholder="角色/部门（可选）"
              style={{ height: 36, borderRadius: 8, border: `1px solid ${T.border}`, padding: "0 10px", fontFamily: "Inter, sans-serif", fontSize: 13, color: T.fg, outline: "none" }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
              <button
                onClick={() => setIsUserEditorOpen(false)}
                style={{ border: `1px solid ${T.border}`, borderRadius: 999, padding: "6px 14px", background: "#fff", color: T.fg, cursor: "pointer", fontFamily: "'Neue Frutiger One', Inter, sans-serif", fontWeight: 700, fontSize: 13 }}
              >
                取消
              </button>
              <button
                onClick={saveUserInfo}
                style={{ border: "none", borderRadius: 999, padding: "6px 14px", background: T.primary, color: "#fff", cursor: "pointer", fontFamily: "'Neue Frutiger One', Inter, sans-serif", fontWeight: 700, fontSize: 13 }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {visibleNotes.map((note, index) => (
        <button
          key={note.id}
          onMouseDown={(e) => startDragPin(note.id, e)}
          onClick={(e) => {
            e.stopPropagation();
            if (suppressClickRef.current === note.id) {
              suppressClickRef.current = null;
              return;
            }
            setActiveId(note.id);
            setDraftPos(null);
            setCommentMode(false);
            setReplyText("");
          }}
          title={note.messages[note.messages.length - 1]?.text ?? "留言"}
          style={{
            position: "fixed",
            left: note.x,
            top: note.y,
            transform: "translate(-50%, -50%)",
            zIndex: 126,
            width: 26,
            height: 26,
            borderRadius: 999,
            border: `2px solid ${activeId === note.id ? "#003D75" : "#fff"}`,
            background: note.resolved ? "#0C8F50" : (activeId === note.id ? "#003D75" : T.primary),
            boxShadow: "0 6px 14px rgba(21,25,30,0.32)",
            color: "#fff",
            fontFamily: "Inter, sans-serif",
            fontWeight: 700,
            fontSize: 11,
            lineHeight: "22px",
            cursor: "pointer",
            padding: 0,
          }}
        >
          {index + 1}
        </button>
      ))}

      {draftPos && (() => {
        const pos = calcPanelPos(draftPos.x, draftPos.y);
        return (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              left: pos.left,
              top: pos.top,
              zIndex: 128,
              width: 320,
              borderRadius: 12,
              background: "#fff",
              border: `1px solid ${T.border}`,
              boxShadow: "0 14px 28px rgba(21,25,30,0.18)",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "12px 14px", borderBottom: `1px solid ${T.border}` }}>
              <p style={{ margin: 0, fontFamily: "'Neue Frutiger One', Inter, sans-serif", fontWeight: 700, fontSize: 15, lineHeight: "22px", color: T.fg }}>
                新建留言
              </p>
              <p style={{ margin: "2px 0 0", fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: 12, lineHeight: "18px", color: T.fgMuted }}>
                可在此位置记录需要修改或确认的信息
              </p>
            </div>
            <div style={{ padding: 14 }}>
              <textarea
                autoFocus
                value={draftText}
                onChange={e => setDraftText(e.target.value)}
                placeholder="输入留言..."
                style={{
                  width: "100%",
                  minHeight: 96,
                  resize: "vertical",
                  borderRadius: 8,
                  border: `1px solid ${T.border}`,
                  padding: "10px 12px",
                  fontFamily: "Inter, sans-serif",
                  fontSize: 14,
                  lineHeight: "20px",
                  color: T.fg,
                  outline: "none",
                }}
              />
              <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button
                  onClick={() => {
                    closeAllDrafts();
                  }}
                  style={{
                    border: `1px solid ${T.border}`,
                    borderRadius: 999,
                    padding: "6px 14px",
                    background: "#fff",
                    color: T.fg,
                    cursor: "pointer",
                    fontFamily: "'Neue Frutiger One', Inter, sans-serif",
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  取消
                </button>
                <button
                  onClick={submitDraft}
                  style={{
                    border: "none",
                    borderRadius: 999,
                    padding: "6px 14px",
                    background: T.primary,
                    color: "#fff",
                    cursor: "pointer",
                    fontFamily: "'Neue Frutiger One', Inter, sans-serif",
                    fontWeight: 700,
                    fontSize: 14,
                    opacity: draftText.trim() ? 1 : 0.5,
                  }}
                >
                  发布留言
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {activeNote && (() => {
        const pos = calcPanelPos(activeNote.x, activeNote.y);
        return (
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              left: pos.left,
              top: pos.top,
              zIndex: 128,
              width: 320,
              borderRadius: 12,
              background: "#fff",
              border: `1px solid ${T.border}`,
              boxShadow: "0 14px 28px rgba(21,25,30,0.18)",
              overflow: "hidden",
            }}
          >
            <div style={{ padding: "12px 14px", borderBottom: `1px solid ${T.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <p style={{ margin: 0, fontFamily: "'Neue Frutiger One', Inter, sans-serif", fontWeight: 700, fontSize: 15, lineHeight: "22px", color: T.fg }}>
                  留言线程
                </p>
                <span
                  style={{
                    borderRadius: 999,
                    padding: "2px 8px",
                    background: activeNote.resolved ? "rgba(0,122,51,0.12)" : "rgba(0,114,219,0.12)",
                    color: activeNote.resolved ? T.green : T.primary,
                    fontFamily: "Inter, sans-serif",
                    fontWeight: 700,
                    fontSize: 11,
                    lineHeight: "16px",
                  }}
                >
                  {activeNote.resolved ? "已解决" : "未解决"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <button
                  onClick={() => toggleResolved(activeNote.id)}
                  style={{
                    border: "none",
                    borderRadius: 999,
                    padding: "5px 10px",
                    background: activeNote.resolved ? "rgba(0,114,219,0.12)" : "rgba(0,122,51,0.12)",
                    color: activeNote.resolved ? T.primary : T.green,
                    cursor: "pointer",
                    fontFamily: "'Neue Frutiger One', Inter, sans-serif",
                    fontWeight: 700,
                    fontSize: 12,
                    lineHeight: "16px",
                  }}
                >
                  {activeNote.resolved ? "重新打开" : "标记解决"}
                </button>
                <button
                  onClick={() => setActiveId(null)}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: T.fgMuted,
                    cursor: "pointer",
                    fontFamily: "Inter, sans-serif",
                    fontSize: 18,
                    lineHeight: "18px",
                    padding: 0,
                  }}
                >
                  ×
                </button>
              </div>
            </div>
            <div style={{ padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ maxHeight: 186, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
                {activeNote.messages.map((msg, idx) => (
                  <div key={msg.id} style={{ border: `1px solid ${T.border}`, borderRadius: 8, background: idx === 0 ? "rgba(0,114,219,0.04)" : "#fff", padding: "8px 10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <div
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 999,
                          background: "rgba(0,114,219,0.14)",
                          color: T.primary,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontFamily: "Inter, sans-serif",
                          fontWeight: 700,
                          fontSize: 10,
                          lineHeight: "12px",
                          flexShrink: 0,
                        }}
                      >
                        {getInitials(msg.author.name)}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 12, lineHeight: "16px", color: T.fg, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {msg.author.name}
                        </p>
                        {msg.author.role && (
                          <p style={{ margin: 0, fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: 10, lineHeight: "14px", color: T.fgMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                            {msg.author.role}
                          </p>
                        )}
                      </div>
                    </div>
                    <p style={{ margin: 0, whiteSpace: "pre-wrap", fontFamily: "Inter, sans-serif", fontWeight: 400, fontSize: 13, lineHeight: "20px", color: T.fg }}>
                      {msg.text}
                    </p>
                    <p style={{ margin: "4px 0 0", fontFamily: "Inter, sans-serif", fontWeight: 500, fontSize: 11, lineHeight: "16px", color: T.fgMuted }}>
                      {formatTimestamp(msg.createdAt)}
                    </p>
                  </div>
                ))}
              </div>

              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={activeNote.resolved ? "该线程已解决，回复将自动重新打开" : "输入回复..."}
                style={{
                  width: "100%",
                  minHeight: 76,
                  resize: "vertical",
                  borderRadius: 8,
                  border: `1px solid ${T.border}`,
                  padding: "8px 10px",
                  fontFamily: "Inter, sans-serif",
                  fontSize: 13,
                  lineHeight: "19px",
                  color: T.fg,
                  outline: "none",
                }}
              />

              <div style={{ marginTop: 2, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button
                  onClick={() => deleteNote(activeNote.id)}
                  style={{
                    border: "none",
                    borderRadius: 999,
                    padding: "6px 14px",
                    background: "rgba(194,65,0,0.08)",
                    color: T.red,
                    cursor: "pointer",
                    fontFamily: "'Neue Frutiger One', Inter, sans-serif",
                    fontWeight: 700,
                    fontSize: 14,
                  }}
                >
                  删除线程
                </button>
                <button
                  onClick={submitReply}
                  style={{
                    border: "none",
                    borderRadius: 999,
                    padding: "6px 14px",
                    background: T.primary,
                    color: "#fff",
                    cursor: "pointer",
                    fontFamily: "'Neue Frutiger One', Inter, sans-serif",
                    fontWeight: 700,
                    fontSize: 14,
                    opacity: replyText.trim() ? 1 : 0.5,
                  }}
                >
                  发送回复
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}

// ─── Main App ──────────────────────────────────────────────────────────────────

export default function App() {
  const [accessGranted, setAccessGranted] = useState(() => {
    try {
      return window.localStorage.getItem(ACCESS_STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [screen, setScreen] = useState<Screen>("list");
  const [rows, setRows] = useState<PtrRow[]>(INITIAL_ROWS);
  const [progress, setProgress] = useState(0);
  const [showToast, setShowToast] = useState(false);
  const [newModel, setNewModel] = useState("");
  const [confirmForm, setConfirmForm] = useState<ConfirmForm>({
    source: "进口",
    model: "9M10",
    regNo: "国械注进20259220001",
    approveDate: "2025-10-15",
    effectiveDate: "2026-10-15",
    expireDate: "2031-10-15",
  });
  const [triggerError, setTriggerError] = useState(false);

  // Archive flow state
  const [archiveRow, setArchiveRow] = useState<PtrRow | null>(null);
  const [archiveType, setArchiveType] = useState<ArchiveType>("变更归档");
  const [showArchiveToast, setShowArchiveToast] = useState(false);

  // Generator flow state
  const [genTab, setGenTab] = useState<GenTab>("PTR对比表生成");

  // Update document flow state
  const [updRow, setUpdRow] = useState<PtrRow | null>(null);
  const [showUpdToast, setShowUpdToast] = useState(false);
  const [showUpdDeleteToast, setShowUpdDeleteToast] = useState(false);

  // Detail panel state
  const [detailRow, setDetailRow] = useState<PtrRow | null>(null);

  // Document download toast state
  const [downloadDoc, setDownloadDoc] = useState<string | null>(null);

  // Document maintenance flow state
  const [docRecord, setDocRecord] = useState<{ name: string; isLatest: boolean; dateLabel?: string } | null>(null);
  const [docDate, setDocDate] = useState("");
  const [docToast, setDocToast] = useState<string | null>(null);

  // Edit PTR flow state
  const [editForm, setEditForm] = useState<ConfirmForm>({
    source: "进口",
    model: "",
    regNo: "",
    approveDate: "",
    effectiveDate: "",
    expireDate: "",
  });

  const handleNewPtr = () => setScreen("upload");

  // Edit PTR flow handlers
  const handleEditOpen = () => {
    if (!detailRow) return;
    setEditForm({
      source: detailRow.type === "国产" ? "国产" : "进口",
      model: detailRow.model,
      regNo: detailRow.regNo,
      approveDate: detailRow.approveDate,
      effectiveDate: detailRow.effectiveDate,
      expireDate: detailRow.expireDate,
    });
    setScreen("edit");
  };

  const handleEditConfirm = () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const ts = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const updated: Partial<PtrRow> = {
      model: editForm.model,
      type: editForm.source,
      regNo: editForm.regNo,
      approveDate: editForm.approveDate,
      effectiveDate: editForm.effectiveDate,
      expireDate: editForm.expireDate,
      updatedBy: "Xinyue, LIANG",
      updatedAt: ts,
    };
    setRows(prev => prev.map(r => r.id === detailRow?.id ? { ...r, ...updated } : r));
    setDetailRow(prev => prev ? { ...prev, ...updated } : prev);
    setScreen("list");
  };

  const handleUploadConfirm = () => {
    setProgress(0);
    setScreen("reading");
    let p = 0;
    const iv = setInterval(() => {
      p += 0.035 + Math.random() * 0.025;
      if (p >= 1) {
        p = 1;
        clearInterval(iv);
        setProgress(1);
        setTimeout(() => {
          if (triggerError) { setTriggerError(false); setScreen("error"); }
          else setScreen("confirm");
        }, 350);
      }
      setProgress(p);
    }, 70);
  };

  const handleConfirmSubmit = () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const ts = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    const newRow: PtrRow = {
      id: rows.length + 1,
      model: confirmForm.model,
      type: confirmForm.source,
      regNo: confirmForm.regNo,
      approveDate: confirmForm.approveDate,
      effectiveDate: confirmForm.effectiveDate,
      expireDate: confirmForm.expireDate,
      updatedBy: "Xinyue, LIANG",
      updatedAt: ts,
      isNew: true,
    };
    setNewModel(confirmForm.model);
    setRows(prev => [newRow, ...prev.map(r => ({ ...r, isNew: false }))]);
    setScreen("success");
    setShowToast(true);
  };

  // Archive flow handlers
  const handleArchiveClick = (row: PtrRow) => {
    setArchiveRow(row);
    setScreen("archive-upload");
  };

  // Update document flow handlers
  const handleUpdateClick = (row: PtrRow) => {
    setUpdRow(row);
    setProgress(0);
    setScreen("upd-loading");
    let p = 0;
    const iv = setInterval(() => {
      p += 0.06 + Math.random() * 0.04;
      if (p >= 1) {
        p = 1;
        clearInterval(iv);
        setTimeout(() => setScreen("upd-record"), 200);
      }
      setProgress(p);
    }, 60);
  };

  const handleUpdUpdate = () => {
    setProgress(0);
    setScreen("upd-recognizing");
    let p = 0;
    const iv = setInterval(() => {
      p += 0.05 + Math.random() * 0.03;
      if (p >= 1) {
        p = 1;
        clearInterval(iv);
        setTimeout(() => setScreen("upd-recognition"), 300);
      }
      setProgress(p);
    }, 60);
  };

  const handleUpdConfirm = () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const ts = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    setRows(prev => prev.map(r => r.id === updRow?.id ? { ...r, updatedBy: "Xinyue, LIANG", updatedAt: ts } : r));
    setScreen("upd-success");
    setShowUpdToast(true);
  };

  const handleUpdDelete = () => setScreen("upd-delete-confirm");

  const handleUpdDeleteConfirm = () => {
    setRows(prev => prev.filter(r => r.id !== updRow?.id));
    setScreen("upd-delete-success");
    setShowUpdDeleteToast(true);
  };

  // Generator handlers
  const handleGeneratorOpen = () => setScreen("gen-form");

  const handleGeneratorRun = (tab: GenTab) => {
    setGenTab(tab);
    setProgress(0);
    setScreen("gen-running");
    let p = 0;
    const iv = setInterval(() => {
      p += 0.04 + Math.random() * 0.03;
      if (p >= 1) {
        p = 1;
        clearInterval(iv);
        setProgress(1);
        setTimeout(() => setScreen("gen-done"), 350);
      }
      setProgress(p);
    }, 70);
  };

  const handleArchiveUploadConfirm = (type: ArchiveType) => {
    setArchiveType(type);
    setProgress(0);
    setScreen("archive-reading");
    let p = 0;
    const iv = setInterval(() => {
      p += 0.035 + Math.random() * 0.025;
      if (p >= 1) {
        p = 1;
        clearInterval(iv);
        setProgress(1);
        setTimeout(() => setScreen("archive-confirm"), 350);
      }
      setProgress(p);
    }, 70);
  };

  const handleArchiveConfirm = () => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const ts = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;
    setRows(prev => prev.map(r =>
      r.id === archiveRow?.id ? { ...r, updatedBy: "Xinyue, LIANG", updatedAt: ts } : r
    ));
    setScreen("archive-success");
    setShowArchiveToast(true);
  };

  const isDialogOpen =
    screen === "upload" || screen === "reading" || screen === "confirm" || screen === "error" ||
    screen === "archive-upload" || screen === "archive-reading" || screen === "archive-confirm" || screen === "archive-error" ||
    screen === "gen-form" || screen === "gen-running" || screen === "gen-done" || screen === "gen-error" ||
    screen === "upd-loading" || screen === "upd-record" || screen === "upd-recognizing" || screen === "upd-recognition" || screen === "upd-delete-confirm" ||
    screen === "edit" || screen === "edit-confirm" ||
    screen === "doc-maintain" || screen === "doc-delete-confirm" ||
    screen === "merge";

  const commentScope = isDialogOpen ? `dialog:${screen}` : "main";

  const jumpToCommentScope = (targetScope: string) => {
    if (targetScope === "main") {
      setScreen("list");
      return;
    }

    if (!targetScope.startsWith("dialog:")) return;
    const target = targetScope.slice("dialog:".length) as Screen;
    setScreen(target);
  };

  const displayRows = rows;

  const handlePasswordSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (passwordInput.trim() === ACCESS_PASSWORD) {
      setAccessGranted(true);
      setPasswordError("");
      setPasswordInput("");
      try {
        window.localStorage.setItem(ACCESS_STORAGE_KEY, "1");
      } catch {
        // Ignore storage errors to avoid blocking access.
      }
      return;
    }
    setPasswordError("密码错误，请重试。");
  };

  const handleLogout = () => {
    try {
      window.localStorage.removeItem(ACCESS_STORAGE_KEY);
    } catch {
      // Ignore storage errors to keep logout responsive.
    }
    setAccessGranted(false);
    setPasswordInput("");
    setPasswordError("");
  };

  if (!accessGranted) {
    return (
      <div
        style={{
          width: "100vw",
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(140deg, #f1f6fb 0%, #e8f0f9 100%)",
          padding: 16,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 420,
            background: "#fff",
            border: `1px solid ${T.border}`,
            borderRadius: 16,
            boxShadow: "0 16px 48px rgba(21,25,30,0.12)",
            padding: 24,
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: "'Neue Frutiger One', Inter, sans-serif",
              fontWeight: 700,
              fontSize: 24,
              lineHeight: "30px",
              color: T.fg,
            }}
          >
            PTR 管理访问验证
          </p>
          <p
            style={{
              margin: "8px 0 20px",
              fontFamily: "'Neue Frutiger One', Inter, sans-serif",
              fontWeight: 300,
              fontSize: 15,
              lineHeight: "22px",
              color: T.fgMuted,
            }}
          >
            请输入访问密码以继续。
          </p>

          <form onSubmit={handlePasswordSubmit}>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                fontFamily: "'Neue Frutiger One', Inter, sans-serif",
                fontWeight: 700,
                fontSize: 14,
                color: T.fg,
              }}
            >
              访问密码
            </label>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => {
                setPasswordInput(e.target.value);
                if (passwordError) setPasswordError("");
              }}
              placeholder="请输入密码"
              autoFocus
              style={{
                width: "100%",
                height: 44,
                borderRadius: 10,
                border: `1px solid ${passwordError ? T.red : T.border}`,
                padding: "0 12px",
                fontFamily: "'Neue Frutiger One', Inter, sans-serif",
                fontSize: 15,
                color: T.fg,
                outline: "none",
              }}
            />
            {passwordError && (
              <p
                style={{
                  margin: "8px 0 0",
                  fontFamily: "'Neue Frutiger One', Inter, sans-serif",
                  fontWeight: 400,
                  fontSize: 13,
                  lineHeight: "20px",
                  color: T.red,
                }}
              >
                {passwordError}
              </p>
            )}

            <button
              type="submit"
              style={{
                marginTop: 16,
                width: "100%",
                height: 44,
                borderRadius: 999,
                border: "none",
                background: T.primary,
                color: "#fff",
                cursor: "pointer",
                fontFamily: "'Neue Frutiger One', Inter, sans-serif",
                fontWeight: 700,
                fontSize: 16,
              }}
            >
              进入系统
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100vw",
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        background: T.bg,
      }}
    >
      {/* ── Global Top Bar ── */}
      <GlobalTopBar onLogout={handleLogout} />

      {/* ── Below top bar ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>
        {/* Sidebar */}
        <AppSidebar />

        {/* Main content column */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>
          {/* Secondary top bar */}
          <SecondaryTopBar onNewPtr={handleNewPtr} onGenerator={handleGeneratorOpen} rowCount={displayRows.length} />

          {/* Search bar (TopArea1 from Frame407) */}
          <div
            style={{
              background: T.bg,
              borderBottom: `1px solid ${T.border}`,
              padding: "18px 24px",
              flexShrink: 0,
              display: "none",
            }}
          >
            <div
              style={{
                width: 400,
                background: T.bg,
                border: `1px solid #6b8094`,
                borderRadius: 999,
                display: "flex",
                alignItems: "center",
                padding: "8px 12px",
                gap: 8,
              }}
            >
              <ISearch />
              <span
                style={{
                  fontFamily: "'Neue Frutiger One', Inter, sans-serif",
                  fontWeight: 400,
                  fontSize: 16,
                  lineHeight: "24px",
                  color: T.fgMuted,
                  flex: 1,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                在发补文件库中检索
              </span>
            </div>
          </div>

          {/* Scrollable page content */}
          <div style={{ flex: 1, overflow: "auto", padding: 24, background: T.bg }}>

            {/* Page header: Frame405 */}
            <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 8 }}>
              <p
                style={{
                  fontFamily: "'Neue Frutiger One', Inter, sans-serif",
                  fontWeight: 700,
                  fontSize: 24,
                  lineHeight: "28px",
                  color: "#000",
                }}
              >
                PTR 列表（{displayRows.length}）
              </p>
              <p
                style={{
                  fontFamily: "'Neue Frutiger One', Inter, sans-serif",
                  fontWeight: 300,
                  fontSize: 18,
                  lineHeight: "26px",
                  color: "#000",
                }}
              >
                管理产品 PTR 注册证书及其有效期信息
              </p>
            </div>

            {/* Data grid */}
            <PtrDataGrid rows={displayRows} onArchive={handleArchiveClick} onUpdate={handleUpdateClick} onDetail={row => setDetailRow(row)} />

            {/* Prototype hint */}
            <div
              style={{
                marginTop: 16,
                padding: "6px 12px",
                background: "rgba(0,114,219,0.05)",
                borderRadius: 6,
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                border: `1px solid rgba(0,114,219,0.15)`,
              }}
            >
              <span style={{ fontFamily: "Inter, sans-serif", fontSize: 12, color: T.fgMuted }}>
                原型演示：点击「新增 PTR」录入新证书；点击表格行「归档」体验归档流程；点击「更新文档」体验更新与删除记录流程
              </span>
              <button
                onClick={() => setTriggerError(v => !v)}
                style={{
                  fontFamily: "Inter, sans-serif",
                  fontSize: 11,
                  color: triggerError ? T.red : T.fgMuted,
                  background: triggerError ? "rgba(194,65,0,0.08)" : "rgba(0,0,0,0.05)",
                  border: "none",
                  borderRadius: 4,
                  padding: "2px 8px",
                  cursor: "pointer",
                  fontWeight: 500,
                }}
              >
                {triggerError ? "✓ 下次将触发失败" : "模拟识别失败"}
              </button>
            </div>
          </div>
        </div>

        {/* ── PTR Detail side panel ── */}
        <AnimatePresence>
          {detailRow && (
            <PtrDetailPanel
              row={detailRow}
              onClose={() => setDetailRow(null)}
              onEdit={handleEditOpen}
              onDownload={setDownloadDoc}
              onOpenDoc={info => { setDocRecord(info); setDocDate(""); setScreen("doc-maintain"); }}
              onMerge={() => setScreen("merge")}
            />
          )}
        </AnimatePresence>

        {/* ── Dialog overlay ── */}
        <AnimatePresence>
          {isDialogOpen && (
            <Backdrop onBgClick={
              screen === "upload" ? () => setScreen("list") :
              screen === "archive-upload" ? () => setScreen("list") :
              screen === "gen-form" ? () => setScreen("list") :
              screen === "upd-record" ? () => setScreen("list") : undefined
            }>
              {/* New PTR flow */}
              {screen === "upload" && (
                <UploadDialog onCancel={() => setScreen("list")} onConfirm={handleUploadConfirm} />
              )}
              {screen === "reading" && <ReadingDialog />}
              {screen === "confirm" && (
                <ConfirmDialog
                  form={confirmForm}
                  onChange={setConfirmForm}
                  onCancel={() => setScreen("list")}
                  onConfirm={handleConfirmSubmit}
                />
              )}
              {screen === "error" && (
                <ErrorDialog onRetry={() => setScreen("upload")} onDismiss={() => setScreen("list")} />
              )}

              {/* Edit PTR flow — reuses ConfirmDialog component */}
              {screen === "edit" && (
                <ConfirmDialog
                  form={editForm}
                  onChange={setEditForm}
                  onCancel={() => setScreen("list")}
                  onConfirm={() => setScreen("edit-confirm")}
                  title="编辑PTR信息"
                  confirmText="确认"
                />
              )}
              {screen === "edit-confirm" && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -10 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  style={{
                    background: T.bg, borderRadius: 12, border: `1px solid ${T.border}`,
                    boxShadow: "0px 0px 1px rgba(58,69,80,0.16), 0px 16px 8px rgba(58,69,80,0.08), 0px 24px 16px rgba(58,69,80,0.16)",
                    width: 488, display: "flex", flexDirection: "column",
                  }}
                >
                  <div className="flex items-center gap-2" style={{ padding: "16px 20px", borderBottom: `1px solid ${T.border}` }}>
                    <span style={{ fontFamily: "'Neue Frutiger One', Inter, sans-serif", fontWeight: 700, fontSize: 20, lineHeight: "24px", color: T.fg, flex: 1 }}>确认修改</span>
                    <button onClick={() => setScreen("edit")} style={{ background: "transparent", border: "none", padding: 8, borderRadius: 999, cursor: "pointer", display: "flex", alignItems: "center" }}>
                      <IClose />
                    </button>
                  </div>
                  <div style={{ padding: "20px 20px 16px" }}>
                    <p style={{ fontFamily: "'Neue Frutiger One', Inter, sans-serif", fontWeight: 300, fontSize: 16, lineHeight: "24px", color: T.fg, margin: 0 }}>
                      确认保存对「{editForm.model}」的 PTR 信息修改吗？保存后将更新该记录。
                    </p>
                  </div>
                  <div className="flex items-center justify-end gap-2" style={{ padding: "0 20px 16px" }}>
                    <button onClick={() => setScreen("edit")} style={{ background: "transparent", border: "none", borderRadius: 999, padding: "8px 16px", cursor: "pointer" }}>
                      <span style={{ fontFamily: "'Neue Frutiger One', Inter, sans-serif", fontWeight: 700, fontSize: 16, lineHeight: "24px", color: T.fg }}>取消</span>
                    </button>
                    <button onClick={handleEditConfirm} style={{ background: T.primary, border: "none", borderRadius: 999, padding: "8px 16px", cursor: "pointer" }}>
                      <span style={{ fontFamily: "'Neue Frutiger One', Inter, sans-serif", fontWeight: 700, fontSize: 16, lineHeight: "24px", color: "white" }}>确认</span>
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Document maintenance flow — reuses UpdateRecordDialog / UpdateDeleteConfirmDialog */}
              {screen === "doc-maintain" && docRecord && (
                <UpdateRecordDialog
                  model={docRecord.name}
                  title={`${detailRow?.model ?? ""} 更新记录`}
                  dateLabel={docRecord.dateLabel}
                  dateValue={docDate}
                  onDateChange={setDocDate}
                  canDelete={docRecord.isLatest}
                  tips={["更新文档会替换当前记录下对应文件。", "删除记录会移除此条更新记录。"]}
                  onCancel={() => setScreen("list")}
                  onUpdate={() => { setDocToast(`「${docRecord.name}」文档已更新。`); setScreen("list"); }}
                  onDelete={() => setScreen("doc-delete-confirm")}
                />
              )}
              {screen === "doc-delete-confirm" && docRecord && (
                <UpdateDeleteConfirmDialog
                  model={docRecord.name}
                  message={`确认删除「${docRecord.name}」？删除后该记录将从当前PTR更新记录中移除。`}
                  onCancel={() => setScreen("doc-maintain")}
                  onDelete={() => { setDocToast(`「${docRecord.name}」更新记录已删除。`); setScreen("list"); }}
                />
              )}

              {/* Merge download flow */}
              {screen === "merge" && detailRow && (
                <MergeDownloadDialog
                  model={detailRow.model}
                  onCancel={() => setScreen("list")}
                  onConfirm={() => { setDocToast(`「${detailRow.model} 最新版PTR」合并下载已开始。`); setScreen("list"); }}
                />
              )}

              {/* Archive flow */}
              {screen === "archive-upload" && archiveRow && (
                <ArchiveUploadDialog
                  model={archiveRow.model}
                  onCancel={() => setScreen("list")}
                  onConfirm={handleArchiveUploadConfirm}
                />
              )}
              {screen === "archive-reading" && <ReadingDialog />}
              {screen === "archive-confirm" && archiveRow && (
                <ArchiveConfirmDialog
                  archiveType={archiveType}
                  model={archiveRow.model}
                  onCancel={() => setScreen("list")}
                  onConfirm={handleArchiveConfirm}
                  onError={() => setScreen("archive-error")}
                />
              )}
              {screen === "archive-error" && (
                <ArchiveErrorDialog
                  onRetry={() => setScreen("archive-upload")}
                  onDismiss={() => setScreen("list")}
                />
              )}

              {/* Update document flow */}
              {screen === "upd-loading" && <ReadingDialog label="正在读取数据..." />}
              {screen === "upd-record" && updRow && (
                <UpdateRecordDialog
                  model={updRow.model}
                  onCancel={() => setScreen("list")}
                  onUpdate={handleUpdUpdate}
                  onDelete={handleUpdDelete}
                />
              )}
              {screen === "upd-recognizing" && <ReadingDialog label="正在识别文档..." />}
              {screen === "upd-recognition" && updRow && (
                <UpdateRecognitionDialog
                  model={updRow.model}
                  onCancel={() => setScreen("list")}
                  onConfirm={handleUpdConfirm}
                />
              )}
              {screen === "upd-delete-confirm" && updRow && (
                <UpdateDeleteConfirmDialog
                  model={updRow.model}
                  onCancel={() => setScreen("upd-record")}
                  onDelete={handleUpdDeleteConfirm}
                />
              )}

              {/* Generator flow */}
              {screen === "gen-form" && (
                <GeneratorFormDialog
                  onCancel={() => setScreen("list")}
                  onGenerate={handleGeneratorRun}
                />
              )}
              {screen === "gen-running" && <ReadingDialog label="正在生成 PTR 文档..." />}
              {screen === "gen-done" && (
                <GeneratorDoneDialog
                  genTab={genTab}
                  onClose={() => setScreen("list")}
                  onSimulateError={() => setScreen("gen-error")}
                />
              )}
              {screen === "gen-error" && (
                <GeneratorErrorDialog
                  onRetry={() => setScreen("gen-form")}
                  onDismiss={() => setScreen("list")}
                />
              )}
            </Backdrop>
          )}
        </AnimatePresence>
      </div>

      {/* ── New PTR success toast ── */}
      <div style={{ position: "fixed", top: 80, left: "50%", transform: "translateX(-50%)", zIndex: 100, pointerEvents: showToast ? "auto" : "none" }}>
        <AnimatePresence>
          {showToast && <SuccessToast model={newModel} onClose={() => setShowToast(false)} />}
        </AnimatePresence>
      </div>

      {/* ── Document download success toast ── reuses SuccessToast */}
      <div style={{ position: "fixed", top: 80, left: "50%", transform: "translateX(-50%)", zIndex: 100, pointerEvents: downloadDoc ? "auto" : "none" }}>
        <AnimatePresence>
          {downloadDoc && (
            <SuccessToast model="" message={`「${downloadDoc}」下载成功。`} onClose={() => setDownloadDoc(null)} />
          )}
        </AnimatePresence>
      </div>

      {/* ── Document maintenance success toast ── reuses SuccessToast */}
      <div style={{ position: "fixed", top: 80, left: "50%", transform: "translateX(-50%)", zIndex: 100, pointerEvents: docToast ? "auto" : "none" }}>
        <AnimatePresence>
          {docToast && (
            <SuccessToast model="" message={docToast} onClose={() => setDocToast(null)} />
          )}
        </AnimatePresence>
      </div>

      {/* ── Archive success toast ── */}
      <div style={{ position: "fixed", top: 80, left: "50%", transform: "translateX(-50%)", zIndex: 100, pointerEvents: showArchiveToast ? "auto" : "none" }}>
        <AnimatePresence>
          {showArchiveToast && archiveRow && (
            <ArchiveSuccessToast
              model={archiveRow.model}
              archiveType={archiveType}
              onClose={() => setShowArchiveToast(false)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* ── Update success toast ── */}
      <div style={{ position: "fixed", top: 80, left: "50%", transform: "translateX(-50%)", zIndex: 100, pointerEvents: showUpdToast ? "auto" : "none" }}>
        <AnimatePresence>
          {showUpdToast && updRow && (
            <UpdateSuccessToast model={updRow.model} onClose={() => { setShowUpdToast(false); setScreen("list"); }} />
          )}
        </AnimatePresence>
      </div>

      {/* ── Update delete success toast ── */}
      <div style={{ position: "fixed", top: 80, left: "50%", transform: "translateX(-50%)", zIndex: 100, pointerEvents: showUpdDeleteToast ? "auto" : "none" }}>
        <AnimatePresence>
          {showUpdDeleteToast && updRow && (
            <UpdateDeleteSuccessToast model={updRow.model} onClose={() => { setShowUpdDeleteToast(false); setScreen("list"); }} />
          )}
        </AnimatePresence>
      </div>

      {/* ── subtle version label ── */}
      <div
        style={{
          position: "fixed",
          left: 14,
          bottom: 10,
          zIndex: 15,
          pointerEvents: "none",
          fontFamily: "Inter, sans-serif",
          fontSize: 11,
          lineHeight: "14px",
          color: "rgba(86,102,118,0.55)",
          letterSpacing: "0.02em",
          userSelect: "none",
        }}
      >
        {APP_VERSION}
      </div>

      {/* ── Global comments layer ── */}
      <GlobalCommentLayer scope={commentScope} onJumpToScope={jumpToCommentScope} />
    </div>
  );
}
