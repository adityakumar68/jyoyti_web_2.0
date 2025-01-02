import React, { useState } from "react";
import { Menu, X, ArrowLeft, LogOut, Settings } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen } from "lucide-react";
import { useRecoilState } from "recoil";
import { logoutState } from "../store/atom";
import { User } from "lucide-react";
const Navbar = ({ onToggleSidebar }) => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="shadow-md z-50">
      <div className="container mx-auto px-4 max-w-full px-14">
        <div className="flex items-center justify-between h-16">
          <Logo />
          <MobileMenuButton isOpen={isOpen} setIsOpen={setIsOpen} />
          <div className="hidden md:block">
            <MenuItems
              pathname={pathname}
              router={router}
              onToggleSidebar={onToggleSidebar}
            />
          </div>
        </div>

        {/* Mobile menu */}
        <div
          className={`md:hidden transition-all duration-300 ease-in-out ${
            isOpen
              ? "max-h-56 opacity-100 pb-4"
              : "max-h-0 opacity-0 overflow-hidden"
          }`}
        >
          <MenuItems
            pathname={pathname}
            router={router}
            onToggleSidebar={onToggleSidebar}
          />
        </div>
      </div>
    </nav>
  );
};

const Logo = () => (
  <div className="flex items-center">
    <img
      className="lg:px-10"
      src="/images/logo.svg"
      alt="Jyoti AI Logo"
      aria-label="Jyoti AI"
    />
  </div>
);

const MobileMenuButton = ({ isOpen, setIsOpen }) => (
  <button
    onClick={() => setIsOpen(!isOpen)}
    className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500 transition-all duration-200"
    aria-label="Toggle menu"
  >
    {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
  </button>
);

const MenuItems = ({ pathname, router, onToggleSidebar }) => {
  const [isLoggedOut, setIsLoggedOut] = useRecoilState(logoutState);

  // In Navbar component - modify handleLogout
  const handleLogout = async () => {
    try {
      const response = await fetch("https://jyoti-ai.com/api/logout", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        setIsLoggedOut(true); // Set logout state to true
        router.push("/SchoolPage");
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  const handleLogout2 = async () => {
    try {
      const response = await fetch("https://jyoti-ai.com/api/logout", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        setIsLoggedOut(true); // Set logout state to true
        router.push("/");
      }
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };
  // Render different menu items based on pathname
  switch (pathname) {
    case "/Summary":
      return (
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
          <NavLink onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Document
          </NavLink>
          <NavLink onClick={handleLogout}>
            <LogOut className="h-5 w-5 mr-2" />
            Logout
          </NavLink>
        </div>
      );

    case "/ImportDocs":
      return (
        <div className="flex flex-col md:flex-row md:items-center md:space-x-1">
          <NavLink href="/Read">
            <BookOpen className="h-5 w-5 mr-2" />
            Read
          </NavLink>
          <NavLink
            onClick={() => router.push("Profile")}
            className="flex items-center gap-2"
          >
            <User className="w-5 h-5" />
            Profile
          </NavLink>
          <NavLink onClick={handleLogout}>
            <LogOut className="h-5 w-5 mr-2" />
            Logout
          </NavLink>
        </div>
      );

    case "/OrgDashboard":
      return (
        <div className="flex flex-col md:flex-row md:items-center md:space-x-1">
          <NavLink onClick={handleLogout}>
            <LogOut className="h-5 w-5 mr-2" />
            Logout
          </NavLink>
        </div>
      );
    case "/AITeacher":
      return (
        <div className="flex flex-col md:flex-row md:items-center md:space-x-1">
           <NavLink
            onClick={() => router.push("Profile")}
            className="flex items-center gap-2"
          >
            <User className="w-5 h-5" />
            Profile
          </NavLink>
          <NavLink onClick={handleLogout}>
            <LogOut className="h-5 w-5 mr-2" />
            Logout
          </NavLink>
        </div>
      );

    case "/ReadDocs":
      return (
        <div className="flex flex-col md:flex-row md:items-center md:space-x-1">
          <NavLink href="/ImportDocs">
            <BookOpen className="h-5 w-5 mr-2" />
            Document Reader
          </NavLink>
          <NavLink href="/Read">
            <BookOpen className="h-5 w-5 mr-2" />
            Read
          </NavLink>
          <NavLink
            onClick={() => router.push("Profile")}
            className="flex items-center gap-2"
          >
            <User className="w-5 h-5" />
            Profile
          </NavLink>
          <NavLink onClick={handleLogout}>
            <LogOut className="h-5 w-5 mr-2" />
            Logout
          </NavLink>
        </div>
      );
      case "/Read":
      return (
        <div className="flex flex-col md:flex-row md:items-center md:space-x-1">
          <NavLink href="/ImportDocs">
            <BookOpen className="h-5 w-5 mr-2" />
            Document Reader
          </NavLink>
          <NavLink
            onClick={() => router.push("Profile")}
            className="flex items-center gap-2"
          >
            <User className="w-5 h-5" />
            Profile
          </NavLink>
          <NavLink onClick={handleLogout}>
            <LogOut className="h-5 w-5 mr-2" />
            Logout
          </NavLink>
        </div>
      );

    case "/Profile":
      return (
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
          <NavLink onClick={() => router.push("ImportDocs")}>
            <BookOpen className="h-5 w-5 mr-2" />
            Document Reader
          </NavLink>
          <NavLink href="/Read">
            <BookOpen className="h-5 w-5 mr-2" />
            Read
          </NavLink>
          <NavLink onClick={handleLogout2}>
            <LogOut className="h-5 w-5 mr-2" />
            Logout
          </NavLink>
        </div>
      );

    case "/McqTest":
      return (
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
          <NavLink onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5 mr-2" />
            Exit Quiz
          </NavLink>
          <NavLink onClick={handleLogout}>
            <LogOut className="h-5 w-5 mr-2" />
            Logout
          </NavLink>
        </div>
      );

    case "/Flashcard":
      return (
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
          <NavLink onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5 mr-2" />
            Back to Document
          </NavLink>
          <NavLink onClick={handleLogout}>
            <LogOut className="h-5 w-5 mr-2" />
            Logout
          </NavLink>
        </div>
      );
    case "/Login":
      return (
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
          <NavLink href="/">Home</NavLink>
          <NavLink href="/SchoolLogin">School Login</NavLink>
          <NavLink href="/OrgLogin">Org Login</NavLink>
          <NavLink href="/Signup">Signup</NavLink>
          <NavLink
            href="https://enablemart.in/?s=Jyoti+AI&post_type=product"
            isPrimary
          >
            Buy Now
          </NavLink>
        </div>
      );

    case "/Signup":
      return (
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
          <NavLink href="/">Home</NavLink>
          <NavLink href="/Login">User Login</NavLink>
          <NavLink href="/SchoolLogin">School Login</NavLink>
          <NavLink href="/OrgLogin">Org Login</NavLink>
          <NavLink
            href="https://enablemart.in/?s=Jyoti+AI&post_type=product"
            isPrimary
          >
            Buy Now
          </NavLink>
        </div>
      );
    case "/SchoolLogin":
      return (
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
          <NavLink href="/">Home</NavLink>
          <NavLink href="/Login">User Login</NavLink>
          <NavLink href="/OrgLogin">Org Login</NavLink>
        </div>
      );
    case "/OrgLogin":
      return (
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4">
          <NavLink href="/">Home</NavLink>
          <NavLink href="/Login">User Login</NavLink>
          <NavLink href="/SchoolLogin">School Login</NavLink>
        </div>
      );
    case "/SchoolPage":
      return (
        <div className="flex flex-col md:flex-row md:items-center md:space-x-4"></div>
      );

    // Default menu items for landing page / login / signup
    default:
      return (
        <div className="flex flex-col md:flex-row md:items-center md:space-x-1">
          <NavLink href="/Login">User Login</NavLink>
          <NavLink href="/OrgLogin">Org Login</NavLink>
          <NavLink href="/SchoolLogin">School Login</NavLink>

          <NavLink
            href="https://enablemart.in/?s=Jyoti+AI&post_type=product"
            isPrimary
          >
            Buy Now
          </NavLink>
          <NavLink href="#about">About Us</NavLink>
        </div>
      );
  }
};

const NavLink = ({ href, children, isPrimary, onClick }) => {
  const baseStyles =
    "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center justify-center";
  const variants = {
    primary:
      "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-lg hover:opacity-90",
    default: "text-gray-700 hover:bg-gray-100 hover:text-gray-900",
  };

  if (onClick) {
    return (
      <button
        onClick={onClick}
        className={`${baseStyles} ${variants.default} my-1 md:my-0`}
      >
        {children}
      </button>
    );
  }

  return (
    <a
      href={href}
      className={`${baseStyles} ${
        isPrimary ? variants.primary : variants.default
      }
        my-1 md:my-0
      `}
    >
      {children}
    </a>
  );
};

export default Navbar;
