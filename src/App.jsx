import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ThemeProvider } from './components/Header';
import { CartProvider, CartSidebar } from './components/Header';
import Header from './components/Header';
import Footer from './components/Footer';
import { SiteDataProvider } from './context/SiteDataContext';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Gallery from './pages/Gallery';
import About from './pages/About';
import Contact from './pages/Contact';
import Admin from './pages/Admin';
import Staff from './pages/Staff';
import MenuPrint from './pages/MenuPrint';
import Order from './pages/Order';
import NotFound from './pages/NotFound';

function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const timer = window.setTimeout(() => {
        document.querySelector(hash)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return () => window.clearTimeout(timer);
    }
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname, hash]);

  return null;
}

function AppShell() {
  const location = useLocation();
  const isPrintView = location.pathname.startsWith('/menu-print');
  const isAdminView = location.pathname.startsWith('/admin123');
  const isStaffView = location.pathname.startsWith('/staff');

  if (isPrintView) {
    return (
      <Routes>
        <Route path="/menu-print" element={<MenuPrint />} />
        <Route path="/menu-print/:category" element={<MenuPrint />} />
      </Routes>
    );
  }

  if (isAdminView) {
    return (
      <Routes>
        <Route path="/admin123" element={<Admin />} />
      </Routes>
    );
  }

  if (isStaffView) {
    return (
      <Routes>
        <Route path="/staff" element={<Staff />} />
      </Routes>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface-50 text-gray-900">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/order" element={<Order />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
      <CartSidebar />
    </div>
  );
}

function App() {
  return (
    <Router>
      <SiteDataProvider>
        <ThemeProvider>
          <CartProvider>
            <ScrollToTop />
            <AppShell />
          </CartProvider>
        </ThemeProvider>
      </SiteDataProvider>
    </Router>
  );
}

export default App;
