import { useState } from "react";
import { NavLink } from "react-router-dom";
import { ShieldCheck, LayoutDashboard, BookOpen, User, ChevronUp, Settings, Key, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const NAV_ITEMS = [
  { to: "/", label: "Scan", icon: ShieldCheck, end: true },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard, end: false },
  { to: "/docs", label: "Docs", icon: BookOpen, end: false },
];

export function Sidebar() {
  const { user, loading, login, logout } = useAuth();
  const [avatarFailed, setAvatarFailed] = useState(false);

  return (
    <aside className="w-56 shrink-0 bg-[color:var(--sidebar-bg)] border-r border-[color:var(--sidebar-border)] flex flex-col h-screen sticky top-0">
      <div className="px-4 py-5 border-b border-[color:var(--sidebar-border)] flex items-center gap-2.5">
        <div className="h-8 w-8 rounded-md bg-[color:var(--sidebar-active-bg)] flex items-center justify-center shrink-0">
          <ShieldCheck size={18} className="text-[color:var(--sidebar-active-fg)]" />
        </div>
        <div className="min-w-0">
          <h1 className="text-sm font-semibold text-[color:var(--sidebar-active-fg)] leading-tight truncate">
            Vibe Coder Reviewer
          </h1>
          <p className="text-[11px] text-[color:var(--sidebar-fg-muted)] mt-0.5">AI code security audit</p>
        </div>
      </div>

      <nav className="flex-1 px-2 py-3 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-all duration-150 ${
                isActive
                  ? "bg-[color:var(--sidebar-active-bg)] text-[color:var(--sidebar-active-fg)] font-medium"
                  : "text-[color:var(--sidebar-fg)] hover:bg-[color:var(--sidebar-active-bg)]/60 hover:text-[color:var(--sidebar-active-fg)]"
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-2 py-3 border-t border-[color:var(--sidebar-border)]">
        {loading ? (
          <div className="h-10 rounded-md bg-[color:var(--sidebar-active-bg)] animate-pulse" />
        ) : user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-[color:var(--sidebar-active-bg)] transition-colors">
                {user.avatar_url && !avatarFailed ? (
                  <img
                    src={user.avatar_url}
                    className="h-7 w-7 rounded-full shrink-0"
                    onError={() => setAvatarFailed(true)}
                  />
                ) : (
                  <div className="h-7 w-7 rounded-full bg-[color:var(--sidebar-active-bg)] flex items-center justify-center text-[color:var(--sidebar-fg-muted)] shrink-0">
                    <User size={14} />
                  </div>
                )}
                <span className="text-sm text-[color:var(--sidebar-fg)] truncate flex-1 text-left">
                  {user.username}
                </span>
                <ChevronUp size={14} className="text-[color:var(--sidebar-fg-muted)] shrink-0" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="w-48">
              <DropdownMenuItem disabled className="text-xs text-muted-foreground">
                Signed in as {user.username}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                <Settings size={14} className="mr-2" /> Settings
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <Key size={14} className="mr-2" /> API keys
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                <LogOut size={14} className="mr-2" /> Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <button
            onClick={login}
            className="w-full text-sm bg-[color:var(--sidebar-active-bg)] text-[color:var(--sidebar-active-fg)] px-3 py-2 rounded-md transition-transform active:scale-95 hover:bg-[color:var(--sidebar-active-bg)]/80"
          >
            Sign in with GitHub
          </button>
        )}
      </div>
    </aside>
  );
}