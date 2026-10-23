import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function NotFound() {
  useEffect(() => {
    document.title = 'Page not found · New Bawarchi 2';
  }, []);

  return (
    <div className="flex min-h-[70vh] items-center justify-center bg-surface-50 px-4 pt-20">
      <div className="max-w-md text-center">
        <p className="font-display text-7xl font-bold text-brand-500">404</p>
        <h1 className="mt-3 font-display text-3xl font-semibold text-gray-900">
          This table isn’t on our floor plan
        </h1>
        <p className="mt-3 text-gray-600">
          The page you’re looking for has moved or never existed. Let’s get you back to the good stuff.
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/" className="btn-primary">Back home</Link>
          <Link to="/menu" className="btn-secondary">Browse the menu</Link>
        </div>
      </div>
    </div>
  );
}
