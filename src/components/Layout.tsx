import Header from "./Header";
import Footer from "./Footer";
import MobileBottomNav from "./MobileBottomNav";

interface LayoutProps {
  children: React.ReactNode;
  hideFooter?: boolean;
}

const Layout = ({ children, hideFooter }: LayoutProps) => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 pb-[calc(72px+env(safe-area-inset-bottom))] md:pb-0">
        {children}
      </main>
      {!hideFooter && (
        <div className="hidden md:block">
          <Footer />
        </div>
      )}
      <MobileBottomNav />
    </div>
  );
};

export default Layout;
