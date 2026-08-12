import { NavLink, useLocation } from "react-router-dom";
import { MOBILE_ITEMS } from "./NavItems";
import { cn } from "../../utils/cn";

export function MobileNav() {
  const location = useLocation();
  const inSharedPage = location.pathname.startsWith("/share");
  if (inSharedPage) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-sm lg:hidden"
      aria-label="Mobile navigation"
    >
      <ul className="grid grid-cols-5">
        {MOBILE_ITEMS.map((item) => (
          <li key={item.to}>
            <NavLink
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 py-2 text-[10px] font-medium transition-colors",
                  isActive ? "text-accent" : "text-ink-3 hover:text-ink-2"
                )
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}