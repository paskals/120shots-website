import { NavLink } from "react-router-dom";
import type { ReactNode } from "react";

function NavItem({ to, children }: { to: string; children: ReactNode }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
          isActive
            ? "bg-white/10 text-white"
            : "text-zinc-400 hover:text-white hover:bg-white/5"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100">
      <nav className="w-56 flex-shrink-0 border-r border-zinc-800 flex flex-col">
        <div className="p-4 border-b border-zinc-800">
          <h1 className="text-lg font-bold tracking-tight">120 Shots CMS</h1>
        </div>
        <div className="p-3 flex flex-col gap-1">
          <NavItem to="/photos">Photos</NavItem>
          <NavItem to="/essays">Essays</NavItem>
        </div>
      </nav>
      <main className="flex-1 flex flex-col min-h-0">{children}</main>
    </div>
  );
}
