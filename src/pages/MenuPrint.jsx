import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getMenuCategories } from '../data/menu';
import { QRCodeSVG as QRCode } from 'qrcode.react';

export default function MenuPrint() {
  const { category } = useParams();
  const [categories, setCategories] = useState([]);
  const [printReady, setPrintReady] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('nb2_menu_categories');
    if (stored) {
      try {
        setCategories(JSON.parse(stored));
      } catch {
        setCategories(getMenuCategories());
      }
    } else {
      setCategories(getMenuCategories());
    }
    setPrintReady(true);
  }, []);

  // Auto-print on load (optional - comment out if not wanted)
  useEffect(() => {
    if (printReady) {
      // Small delay to ensure DOM is ready
      const timer = setTimeout(() => window.print(), 500);
      return () => clearTimeout(timer);
    }
  }, [printReady]);

  const categoriesToShow = category 
    ? categories.filter(c => c.id === category)
    : categories;

  const menuUrl = typeof window !== 'undefined' 
    ? `${window.location.origin}/menu${category ? `#${category}` : ''}`
    : '';

  return (
    <div className="min-h-screen bg-white text-gray-900 p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 border-b-2 border-gray-300 pb-6">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-16 h-16 rounded-xl bg-amber-600 flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="text-left">
              <h1 className="font-display font-bold text-3xl text-gray-900">New Bawarchi 2</h1>
              <p className="text-gray-600">Belonia, South Tripura</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-6 text-sm text-gray-600 flex-wrap">
            <span>📍 College Square, Belonia, Tripura 799155</span>
            <span>📞 +91 93669 86853</span>
          </div>
          <div className="mt-4 flex items-center justify-center gap-4">
            <QRCode 
              value={menuUrl} 
              size={100} 
              level="M"
              includeMargin={true}
            />
            <div className="text-xs text-gray-500 text-left">
              <p>Scan for digital menu</p>
              <p className="font-mono text-xs truncate max-w-xs">{menuUrl}</p>
            </div>
          </div>
        </div>

        {/* Menu Categories */}
        <div className="space-y-8">
          {categoriesToShow.map((cat) => (
            <div key={cat.id} className="page-break-inside-avoid">
              <h2 className="font-display font-bold text-2xl text-gray-900 border-b-2 border-amber-600 pb-2 mb-4 flex items-center gap-2 flex-wrap">
                {cat.name}
                {cat.description && <span className="text-sm font-normal text-gray-500">— {cat.description}</span>}
              </h2>
              <div className="space-y-3">
                {cat.items.map((item) => (
                  <div key={item.id} className="flex items-start justify-between gap-4 py-2 border-b border-gray-100">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="font-semibold text-gray-900">{item.name}</span>
                        {item.vegetarian && (
                          <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Veg</span>
                        )}
                        {!item.vegetarian && (
                          <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">Non-Veg</span>
                        )}
                        {item.popular && (
                          <span className="text-xs px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full">★ Popular</span>
                        )}
                      </div>
                      {item.description && (
                        <p className="text-sm text-gray-500 mt-0.5">{item.description}</p>
                      )}
                    </div>
                    <span className="font-bold text-lg text-amber-700 whitespace-nowrap flex-shrink-0">{item.price}</span>
                  </div>
                ))}
              </div>
              {cat.items.length === 0 && (
                <p className="text-gray-400 text-center py-4">No items in this category</p>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t-2 border-gray-300 text-center text-sm text-gray-500">
          <p>Open Daily: 8:00 AM - 10:00 PM</p>
          <p>Takeaway & Dine-in Available</p>
          <p className="mt-2">Scan QR code above for digital menu & online ordering</p>
        </div>

        {/* Print instructions - only shows on screen, not in print */}
        <div className="fixed bottom-4 right-4 bg-amber-600 text-white px-4 py-2 rounded-lg text-sm shadow-lg no-print">
          Press Ctrl+P (Cmd+P on Mac) to print • Use "Save as PDF" for digital copy
        </div>
      </div>
    </div>
  );
}