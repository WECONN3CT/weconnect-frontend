import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '../ui';

export const LandingHeader = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="absolute top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4 md:py-6">
          {/* Logo */}
          <div className="flex items-center">
            <span className="text-2xl font-bold text-white">
              Mark3tier
            </span>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-white/80 hover:text-white transition-colors text-sm font-medium">
              Features
            </a>
            <a href="#pricing" className="text-white/80 hover:text-white transition-colors text-sm font-medium">
              Pricing
            </a>
            <a href="#testimonials" className="text-white/80 hover:text-white transition-colors text-sm font-medium">
              Testimonials
            </a>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/login')}
            >
              Login
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/signup')}
            >
              Registrieren
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white/10 backdrop-blur-lg rounded-xl p-4 mb-4 animate-fade-in">
            <nav className="flex flex-col gap-2 mb-4">
              <a
                href="#features"
                className="text-white/80 hover:text-white transition-colors py-2 px-3 rounded-lg hover:bg-white/10"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </a>
              <a
                href="#pricing"
                className="text-white/80 hover:text-white transition-colors py-2 px-3 rounded-lg hover:bg-white/10"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </a>
              <a
                href="#testimonials"
                className="text-white/80 hover:text-white transition-colors py-2 px-3 rounded-lg hover:bg-white/10"
                onClick={() => setMobileMenuOpen(false)}
              >
                Testimonials
              </a>
            </nav>
            <div className="flex flex-col gap-2 pt-4 border-t border-white/20">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigate('/login');
                  setMobileMenuOpen(false);
                }}
                className="w-full justify-center"
              >
                Login
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  navigate('/signup');
                  setMobileMenuOpen(false);
                }}
                className="w-full justify-center"
              >
                Registrieren
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
