import { Link } from "@tanstack/react-router";
import {
  Disc3,
  History,
  LayoutDashboard,
  Library,
  Radio,
  Upload,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [{ to: "/", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Content",
    items: [
      { to: "/subjects", label: "Subjects", icon: Library },
      { to: "/artists", label: "Artists", icon: Disc3 },
      { to: "/import/questions", label: "Import", icon: Upload },
    ],
  },
  {
    label: "People",
    items: [{ to: "/users", label: "Users", icon: Users }],
  },
  {
    label: "Activity",
    items: [
      { to: "/rooms", label: "Live rooms", icon: Radio },
      { to: "/history", label: "History", icon: History },
    ],
  },
];

export function AdminNav() {
  return (
    <nav className='flex flex-col gap-6 p-4'>
      {GROUPS.map(group => (
        <div key={group.label} className='space-y-1'>
          <p className='px-3 pb-1 text-[10px] font-black tracking-[0.3em] text-muted-foreground uppercase'>
            {group.label}
          </p>
          {group.items.map(item => (
            <Link
              key={item.to}
              to={item.to}
              activeOptions={{ exact: item.to === "/" }}
              className='flex items-center gap-2.5 border border-transparent px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-[status=active]:border-border data-[status=active]:bg-muted data-[status=active]:text-foreground'
            >
              <item.icon className='size-4 shrink-0' />
              {item.label}
            </Link>
          ))}
        </div>
      ))}
    </nav>
  );
}
