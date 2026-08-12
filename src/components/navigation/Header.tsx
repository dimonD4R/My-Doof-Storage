import { useState } from "react";
import { NavLink } from "react-router-dom";
import { SearchBar } from "../search/SearchBar";
import { IconButton } from "../ui";
import { IconMenu, IconX } from "../ui/icons";
import { NAV_ITEMS } from "./NavItems";
import { cn } from "../../utils/cn";

export function Header() {
  const [drawer, setDrawer] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b border-line bg-canvas/90 px-3 backdrop-blur-sm sm:px-5">
        <button
          className="inline-flex h-9 w-9 items-center justify-center rounded-full text-ink-2 hover:bg-card-2 lg:hidden"
          aria-label="Open navigation"
          onClick={() => setDrawer(true)}
        >
          <IconMenu width={20} height={20} />
        </button>

        <span className="font-display text-[18px] leading-none text-ink lg:hidden">Your Memories</span>

        <div className="mx-2 flex-1 lg:mx-6">
          <SearchBar />
        </div>
      </header>

      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-scrim/50" onClick={() => setDrawer(false)} aria-hidden="true" />
          <div className="absolute inset-y-0 left-0 w-[280px] bg-card p-4 anim-fade-in">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-display text-[20px] text-ink">Your Memories</span>
              <IconButton label="Close" onClick={() => setDrawer(false)}>
                <IconX width={18} height={18} />
              </IconButton>
            </div>
            <nav aria-label="Main navigation">
              <ul className="space-y-1">
                {NAV_ITEMS.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={() => setDrawer(false)}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] font-medium transition-colors",
                          isActive ? "bg-accent-soft text-accent" : "text-ink-2 hover:bg-card-2 hover:text-ink"
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
          </div>
        </div>
      )}
    </>
  );
}