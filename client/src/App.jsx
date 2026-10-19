import AppRoutes from "./routes/AppRoutes";
import ScrollToTop from "./components/ScrollToTop";
import TitleManager from "./components/TitleManager";

export default function App() {
  return (
    <>
      <TitleManager />
      <ScrollToTop />
      <AppRoutes />
    </>
  );
}