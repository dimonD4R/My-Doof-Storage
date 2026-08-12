import { NavLink } from "react-router-dom";
import { useApp } from "../../state/AppStore";
import { NAV_ITEMS } from "./NavItems";
import { Button, IconButton } from "../ui";
import { IconChevronLeft, IconMoon, IconShuffle, IconSun } from "../ui/icons";
import { cn } from "../../utils/cn";

export function Sidebar({
  collapsed,
  onToggle,
  onSurprise,
}: {
  collapsed: boolean;
  onToggle: () => void;
  onSurprise: () => void;
}) {
  const { theme, setTheme } = useApp();
  const dark = theme === "dark";

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 hidden flex-col border-r border-line bg-card lg:flex",
        collapsed ? "w-[76px]" : "w-[248px]"
      )}
    >
      <div className={cn("flex h-16 shrink-0 items-center border-b border-line", collapsed ? "justify-center px-3" : "px-5")}>
        <span className="font-display text-[20px] leading-none text-ink">
          {collapsed ? "M" : "Your Memories"}
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Main navigation">
        <ul className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                end={item.end}
                title={collapsed ? item.label : undefined}
                className={({ isActive }) =>
                  cn(
                    "group relative flex items-center rounded-xl text-[13.5px] font-medium transition-colors",
                    collapsed ? "h-11 w-11 justify-center" : "h-10 gap-3 px-3",
                    isActive
                      ? "bg-accent-soft text-accent"
                      : "text-ink-2 hover:bg-card-2 hover:text-ink"
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {item.icon}
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {isActive && collapsed && (
                      <span className="absolute -left-1 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r bg-accent" />
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-2 border-t border-line p-3">
        {!collapsed && (
          <Button variant="ghost" size="sm" className="w-full justify-start" onClick={onSurprise}>
            <IconShuffle width={15} height={15} /> Surprise me
          </Button>
        )}
        {collapsed && (
          <IconButton label="Surprise me" onClick={onSurprise}>
            <IconShuffle width={18} height={18} />
          </IconButton>
        )}
        <div className={cn("flex items-center", collapsed ? "justify-center" : "justify-between")}>
          {!collapsed && <span className="pl-1 text-[11px] text-ink-3">Appearance</span>}
          <div className="flex items-center gap-1">
            <IconButton
              label="Light theme"
              onClick={() => setTheme("light")}
              active={!dark}
              size="sm"
            >
              <IconSun width={16} height={16} />
            </IconButton>
            <IconButton
              label="Dark theme"
              onClick={() => setTheme("dark")}
              active={dark}
              size="sm"
            >
              <IconMoon width={16} height={16} />
            </IconButton>
          </div>
        </div>
        <button
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden w-full items-center justify-center rounded-xl py-2 text-ink-3 transition-colors hover:bg-card-2 hover:text-ink lg:flex"
        >
          <IconChevronLeft
            width={16}
            height={16}
            className={cn("transition-transform duration-200", collapsed && "rotate-180")}
          />
        </button>
      </div>
    </aside>
  );
}