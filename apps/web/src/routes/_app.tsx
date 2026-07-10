import { Outlet, createFileRoute } from "@tanstack/react-router";
import { AppHeader } from "@/shared/components/app/AppHeader";

export const Route = createFileRoute("/_app")({
  component: AppLayout,
});

function AppLayout() {
  return (
    <div className='grid grid-rows-[auto_1fr] h-svh'>
      <AppHeader />
      <div className='min-h-0 overflow-y-auto'>
        <Outlet />
      </div>
    </div>
  );
}
