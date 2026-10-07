import { Link, useLocation } from "wouter";
import { Users, GraduationCap, CreditCard, LogOut, LayoutDashboard, Receipt, Menu } from "lucide-react";
import { useLogout, useGetMe } from "@workspace/api-client-react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";

const navItems = [
  { href: "/dashboard", label: "Início", desktopLabel: "Dashboard", icon: LayoutDashboard },
  { href: "/alunos", label: "Alunas", desktopLabel: "Alunos", icon: Users },
  { href: "/turmas", label: "Turmas", desktopLabel: "Turmas", icon: GraduationCap },
  { href: "/mensalidades", label: "Pagamentos", desktopLabel: "Mensalidades", icon: CreditCard },
  { href: "/cobranças", label: "Cobranças", desktopLabel: "Cobranças", icon: Receipt },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useLocation();
  const { data: user } = useGetMe();
  const logout = useLogout();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => setLocation("/login"),
    });
  };

  const renderNavItem = (item: typeof navItems[number], mobile = false) => {
    const isActive = location === item.href || (item.href !== "/dashboard" && location.startsWith(item.href));
    const Icon = item.icon;

    return (
      <Link key={`${mobile ? "mobile-" : ""}${item.href}`} href={item.href}>
        <div
          className={`flex cursor-pointer items-center transition-colors ${
            mobile
              ? `min-w-0 flex-1 flex-col justify-center gap-1 rounded-xl px-1 py-2 text-[10px] font-medium ${
                  isActive ? "text-primary" : "text-gray-400"
                }`
              : `gap-3 rounded-xl px-3 py-3 ${
                  isActive
                    ? "bg-primary/10 font-semibold text-primary"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`
          }`}
        >
          <Icon className="h-5 w-5" />
          <span className={mobile ? "truncate" : ""}>{mobile ? item.label : item.desktopLabel}</span>
        </div>
      </Link>
    );
  };

  return (
    <div className="flex min-h-screen bg-[#faf9fb]">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-gray-200 bg-white lg:flex">
        <div className="flex flex-col items-center gap-1 border-b border-gray-200 px-4 pb-4 pt-6">
          <img src="/logo.png" alt="Studio Classe A" className="h-28 w-28 object-contain" />
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-gray-400">Studio Classe A</p>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">{navItems.map((item) => renderNavItem(item))}</nav>
        <div className="border-t border-gray-200 p-4">
          <div className="mb-4 px-3">
            <p className="truncate text-sm font-medium text-gray-900">{user?.nome}</p>
            <p className="truncate text-xs text-gray-500">{user?.email}</p>
          </div>
          <Button variant="ghost" className="w-full justify-start text-gray-600 hover:bg-red-50 hover:text-red-600" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>
      </aside>

      <main className="min-w-0 flex-1 overflow-x-hidden pb-20 lg:pb-0">
        <div className="sticky top-0 z-30 flex items-center justify-between border-b border-gray-200/80 bg-white/95 px-4 py-3 backdrop-blur lg:hidden">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="" className="h-9 w-9 object-contain" />
            <div>
              <p className="text-sm font-semibold leading-none text-gray-900">Studio Classe A</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.16em] text-gray-400">
                {navItems.find((item) => location.startsWith(item.href))?.label ?? "Sistema"}
              </p>
            </div>
          </div>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Abrir menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[min(85vw,20rem)]">
              <div className="mt-8 flex flex-col gap-1">
                {navItems.map((item) => renderNavItem(item))}
                <div className="mt-4 border-t pt-4">
                  <p className="px-3 text-sm font-medium text-gray-900">{user?.nome}</p>
                  <p className="px-3 text-xs text-gray-500">{user?.email}</p>
                  <Button variant="ghost" className="mt-3 w-full justify-start text-gray-600" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sair
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
        {children}
      </main>

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 flex border-t border-gray-200 bg-white/95 px-2 backdrop-blur lg:hidden">
        {navItems.map((item) => renderNavItem(item, true))}
      </nav>
    </div>
  );
}