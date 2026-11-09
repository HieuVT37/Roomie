import { useRef } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useRevealOnScroll, useRouteSlide } from "../hooks/useMotion";
import useGlobalFx from "../hooks/useGlobalFx";
import Toaster from "../components/fx/Toaster";
import LiquidBackground from "../components/fx/LiquidBackground";

// Các trang /admin/* và /messages/* tự xử lý chuyển động bên trong, không trượt cả khung
const routeGroup = (path) =>
  path.startsWith("/admin") ? "/admin" : path.startsWith("/messages") ? "/messages" : path;

export default function MainLayout() {
  const mainRef = useRef(null);
  useRouteSlide(mainRef, routeGroup);
  useRevealOnScroll(mainRef);
  useGlobalFx(); // nghiêng 3D, vệt sáng, lớp lệch, gợn sóng nút, đường tự vẽ

  return (
    // Nền gradient nằm ở body::before (index.css), khung ngoài để trong suốt
    <div className="flex min-h-screen flex-col text-ink">
      {/* Nền chất lỏng chuyển động nhẹ phía sau toàn trang */}
      <LiquidBackground />
      <Navbar />
      {/* Cùng lề trái/phải với banner và chân trang */}
      <main ref={mainRef} className="container-page flex-1 py-6 sm:py-10">
        <Outlet />
      </main>
      <Footer />
      <Toaster />
    </div>
  );
}
