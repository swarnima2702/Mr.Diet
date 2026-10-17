import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Leaf, Menu, X, UserCircle } from "lucide-react";
import { useState, useEffect } from "react";

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<Record<string, unknown> | null>(null);

  const handleLogout = () => {
    localStorage.removeItem("mrdiet_auth_user");
    localStorage.removeItem("mrdiet_user");
    setUser(null);
    navigate("/");
  };

  useEffect(() => {
    const checkUser = () => {
      const storedUser = localStorage.getItem("mrdiet_auth_user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      } else {
        setUser(null);
      }
    };

    checkUser();
    checkUser();
  }, [location.pathname]);

  // Handle Hash Scroll
  useEffect(() => {
    if (location.hash) {
      const element = document.getElementById(location.hash.substring(1));
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: "smooth" });
        }, 100);
      }
    }
  }, [location]);

  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/#pricing", label: "Pricing" },
    { href: "/#how-it-works", label: "How It Works" },
    { href: "/#faqs", label: "FAQs" },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-effect">
      <div className="container mx-auto px-4 md:px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 md:gap-3 group py-1">
            <div className="relative">
              <Leaf className="h-7 w-7 md:h-9 md:h-9 text-gold transition-transform duration-300 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gold/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg md:text-xl font-black gold-text leading-tight tracking-tighter">MRDiet</span>
              <span className="hidden xs:block text-[8px] md:text-[10px] uppercase tracking-[0.2em] text-muted-foreground leading-tight font-bold">Premium Nutrition</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`text-sm font-medium transition-colors duration-300 hover:text-gold ${location.pathname === link.href ? "text-gold" : "text-white/90"
                  }`}
              >
                {link.label}
              </Link>
            ))}
            {user && (
              <Link
                to="/dashboard"
                className={`text-sm font-medium transition-colors duration-300 hover:text-gold ${location.pathname === "/dashboard" ? "text-gold" : "text-white/90"
                  }`}
              >
                Dashboard
              </Link>
            )}
            {!user && (
              <Link
                to="/auth"
                className={`text-sm font-medium transition-colors duration-300 hover:text-gold ${location.pathname === "/auth" ? "text-gold" : "text-white/90"
                  }`}
              >
                Login
              </Link>
            )}
          </div>

          {/* CTA Buttons (desktop) */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="text-red-500 hover:text-red-400 hover:bg-red-500/10 font-bold text-[11px] uppercase tracking-widest h-10 px-4"
                >
                  Logout
                </Button>
                <Link to="/dashboard">
                  <Button variant="luxury" size="lg">
                    My Dashboard
                  </Button>
                </Link>
              </>
            ) : (
              <Link to="/auth">
                <Button variant="luxury" size="lg">
                  Get Free Plan
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile right-side actions */}
          <div className="md:hidden flex items-center gap-1">
            {user && (
              <Link
                to="/dashboard"
                aria-label="My Dashboard"
                className="p-2 rounded-lg text-gold hover:bg-gold/10 transition-colors"
              >
                <UserCircle className="h-6 w-6" />
              </Link>
            )}
            <button
              className="text-foreground p-2"
              onClick={() => setIsOpen(!isOpen)}
              aria-label="Menu"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden mt-4 pb-4 border-t border-border/50 pt-4 animate-fade-in">
            <div className="flex flex-col gap-4">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className="text-sm font-medium text-white/90 hover:text-gold transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              {user ? (
                <>
                  <Link
                    to="/"
                    className="text-sm font-medium text-white/90 hover:text-gold transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Home
                  </Link>
                  <Link
                    to="/dashboard"
                    className="text-sm font-medium text-white/90 hover:text-gold transition-colors"
                    onClick={() => setIsOpen(false)}
                  >
                    Dashboard
                  </Link>
                </>
              ) : (
                <Link
                  to="/auth"
                  className="text-sm font-medium text-white/90 hover:text-gold transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </Link>
              )}

              {user && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="w-full justify-center text-red-500 hover:text-red-400 hover:bg-red-500/10 font-bold text-xs uppercase tracking-widest h-12"
                >
                  Logout
                </Button>
              )}

              {user ? (
                <Link to="/dashboard" onClick={() => setIsOpen(false)}>
                  <Button variant="luxury" size="lg" className="w-full">
                    My Dashboard
                  </Button>
                </Link>
              ) : (
                <Link to="/auth" onClick={() => setIsOpen(false)}>
                  <Button variant="luxury" size="lg" className="w-full">
                    Get Free Plan
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
