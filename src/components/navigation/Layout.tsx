import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { MobileNav } from "./MobileNav";
import { useApp } from "../../state/AppStore";
import { useGlobalSurprise } from "../../state/surprise";
import { ErrorState } from "../ui";
import { cn } from "../../utils/cn";

export function Layout() {
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem("memories:sidebar-collapsed") === "1"
  );
  const { archive, loadFailed, refresh } = useApp();
  const surprise = useGlobalSurprise();

  const toggle = () => {
    setCollapsed((c) => {
      const next = !c;
      try {
        localStorage.setItem("memories:sidebar-collapsed", next ? "1" : "0");
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  return (
    <div className="min-h-dvh">
      <Sidebar collapsed={collapsed} onToggle={toggle} onSurprise={surprise} />
      <div
        className={cn(
          "flex min-h-dvh flex-col transition-[padding] duration-200",
          collapsed ? "lg:pl-[76px]" : "lg:pl-[248px]"
        )}
      >
        <Header />
        <main className="mx-auto w-full max-w-[1200px] flex-1 px-3 pb-28 pt-6 sm:px-6 lg:pb-12">
          {archive ? (
            <Outlet />
          ) : loadFailed ? (
            <ErrorState
              title="Unable to load memories"
              message="Check your connection and try again."
              onRetry={() => void refresh()}
            />
          ) : (
            <Loading />
          )}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}

function Loading() {
  return (
    <div className="space-y-6 pb-10">
      <div className="skeleton h-8 w-56 rounded-lg" />
      <div className="skeleton h-4 w-72 rounded-md" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i} className="aspect-square overflow-hidden rounded-xl skeleton" />
        ))}
      </div>
    </div>
  );
}