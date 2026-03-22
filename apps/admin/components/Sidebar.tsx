'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Mic2,
  UserCheck,
  Shield,
  Bell,
  ImageIcon,
  BarChart3,
} from 'lucide-react';

const menuItems = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Communities', href: '/communities', icon: Users },
  { label: 'Creators', href: '/creators', icon: Mic2 },
  { label: 'Members', href: '/members', icon: UserCheck },
  { label: 'Moderation', href: '/moderation', icon: Shield },
  { label: 'Notices', href: '/notices', icon: Bell },
  { label: 'Banners', href: '/banners', icon: ImageIcon },
  { label: 'Analytics', href: '/analytics', icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  function isActive(href: string): boolean {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href + '/');
  }

  return (
    <aside className="fixed left-0 top-0 z-40 h-full w-64 bg-[#1A1A1A]">
      <div className="px-6 pt-12 pb-12">
        <h2 className="text-lg font-semibold text-foreground">Wecord Admin</h2>
      </div>

      <nav className="flex flex-col gap-2 px-3">
        {menuItems.map((item) => {
          const active = isActive(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-md px-3 py-3 text-sm transition-colors ${
                active
                  ? 'border-l-[3px] border-[#00E5C3] bg-[rgba(0,229,195,0.1)] text-foreground'
                  : 'border-l-[3px] border-transparent text-muted-foreground hover:bg-[#2B2B2B]'
              }`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
