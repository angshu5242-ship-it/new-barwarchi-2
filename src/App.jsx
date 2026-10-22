import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './components/Header';
import { CartProvider, CartSidebar } from './components/Header';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Gallery from './pages/Gallery';
import About from './pages/About';
import Contact from './pages/Contact';
import Admin from './pages/Admin';
import MenuPrint from './pages/MenuPrint';

function App() {
  return (
    <Router>
      <ThemeProvider>
        <CartProvider>
          <div className="min-h-screen flex flex-col bg-surface-50 text-gray-900">
            <Header />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/menu" element={<Menu />} />
                <Route path="/gallery" element={<Gallery />} />
                <Route path="/about" element={<About />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/admin123" element={<Admin />} />
                <Route path="/menu-print" element={<MenuPrint />} />
                <Route path="/menu-print/:category" element={<MenuPrint />} />
              </Routes>
            </main>
            <Footer />
            <CartSidebar />
          </div>
        </CartProvider>
      </ThemeProvider>
    </Router>
  );
}

export default App;