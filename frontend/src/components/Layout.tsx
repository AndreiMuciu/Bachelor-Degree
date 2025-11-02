import React from "react";
import Header from "./Header";
import Footer from "./Footer";
import "../styles/Layout.css";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="app-layout">
      <Header />
      <main className="app-main">{children}</main>
      <Footer />
    </div>
  );
};

export default Layout;
