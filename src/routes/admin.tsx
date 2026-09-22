import { createFileRoute, Outlet, useRouterState } from "@tanstack/react-router";
import { deskSearch } from "@/lib/command";
import { DeskPage } from "@/routes/desk";

export const Route = createFileRoute("/admin")({
  validateSearch: deskSearch,
  component: AdminLayout,
});

function AdminLayout() {
  const login = useRouterState({
    select: (s) => s.location.pathname.startsWith("/admin/login"),
  });
  if (login) return <Outlet />;
  return <DeskPage />;
}
