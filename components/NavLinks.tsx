'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { useTheme } from '@/providers/ThemeProvider';

const NAV_ITEMS = [
  { href: '/workflows', label: '工作坊' },
  { href: '/library',   label: '內容庫' },
  { href: '/brand',     label: '品牌'   },
  { href: '/pricing',   label: '定價'   },
  { href: '/settings',  label: '設定'   },
];

interface NavLinksProps {
  email: string;
  displayName: string;
}

export default function NavLinks({ email, displayName }: NavLinksProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const { theme, toggle } = useTheme();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const initial = (displayName?.[0] ?? email?.[0] ?? '?').toUpperCase();

  return (
    <>
      {/* Primary nav links */}
      <nav className="hidden md:flex items-center gap-1">
        {NAV_ITEMS.map(({ href, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'text-primary bg-primary/8'
                  : 'text-secondary hover:text-primary hover:bg-primary/8'
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Right: theme toggle + user + sign-out */}
      <div className="flex items-center gap-3">

        {/* Theme toggle */}
        <button
          onClick={toggle}
          title={theme === 'dark' ? '切換淺色模式' : '切換深色模式'}
          className="w-7 h-7 flex items-center justify-center rounded-lg text-secondary hover:text-primary hover:bg-primary/8 transition-colors"
        >
          {theme === 'dark' ? (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path d="M10 2a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V3a1 1 0 0 1 1-1ZM10 15a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0v-1a1 1 0 0 1 1-1ZM3 10a1 1 0 0 1 1-1h1a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1ZM15 10a1 1 0 0 1 1-1h1a1 1 0 1 1 0 2h-1a1 1 0 0 1-1-1ZM5.636 5.636a1 1 0 0 1 1.414 0l.707.707a1 1 0 0 1-1.414 1.414l-.707-.707a1 1 0 0 1 0-1.414ZM13.95 12.364a1 1 0 0 1 1.414 0l.707.707a1 1 0 0 1-1.414 1.414l-.707-.707a1 1 0 0 1 0-1.414ZM5.636 14.364a1 1 0 0 1 0-1.414l.707-.707a1 1 0 1 1 1.414 1.414l-.707.707a1 1 0 0 1-1.414 0ZM12.95 7.05a1 1 0 0 1 0-1.414l.707-.707a1 1 0 1 1 1.414 1.414l-.707.707a1 1 0 0 1-1.414 0ZM10 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M7.455 2.004a.75.75 0 0 1 .26.77 7 7 0 0 0 9.958 7.967.75.75 0 0 1 1.067.853A8.5 8.5 0 1 1 6.647 1.921a.75.75 0 0 1 .808.083Z" clipRule="evenodd" />
            </svg>
          )}
        </button>

        <div className="hidden sm:flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-accent/20 border border-accent/30 flex items-center justify-center">
            <span className="text-xs font-bold text-accent">{initial}</span>
          </div>
          <span className="text-xs text-secondary truncate max-w-[140px]">{email}</span>
        </div>

        <button
          onClick={handleSignOut}
          className="text-xs border border-primary/10 hover:bg-primary/8 text-secondary hover:text-primary px-3 py-1.5 rounded-full transition-colors"
        >
          登出
        </button>
      </div>

      {/* Mobile nav — bottom strip (optional, expandable later) */}
    </>
  );
}
