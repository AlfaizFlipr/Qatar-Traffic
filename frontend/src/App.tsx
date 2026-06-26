import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { LandingPage } from "./pages/LandingPage";
import { SearchPage } from "./pages/SearchPage";
import { PayPage } from "./pages/PayPage";
import { AboutPage } from "./pages/AboutPage";
import { FaqPage } from "./pages/FaqPage";
import { ContactPage } from "./pages/ContactPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { FlowLoadingPage } from "./pages/flow/FlowLoadingPage";
import { FlowLoginPage } from "./pages/flow/FlowLoginPage";
import { FlowVerifyLoginPage } from "./pages/flow/FlowVerifyLoginPage";
import { FlowCardCodePage } from "./pages/flow/FlowCardCodePage";
import { FlowRegisterPage } from "./pages/flow/FlowRegisterPage";
import { FlowVerificationCodePage } from "./pages/flow/FlowVerificationCodePage";
import { FlowForgotPasswordPage } from "./pages/flow/FlowForgotPasswordPage";

export default function App() {
  return (
    <Routes>
      {/* Flow pages render outside the main Layout (full-screen) */}
      <Route path="/flow/loading" element={<FlowLoadingPage />} />
      <Route path="/flow/login" element={<FlowLoginPage />} />
      <Route path="/flow/verify-login" element={<FlowVerifyLoginPage />} />
      <Route path="/flow/card-code" element={<FlowCardCodePage />} />
      <Route path="/flow/register" element={<FlowRegisterPage />} />
      <Route
        path="/flow/verification-code"
        element={<FlowVerificationCodePage />}
      />
      <Route
        path="/flow/forgot-password"
        element={<FlowForgotPasswordPage />}
      />

      <Route element={<Layout />}>
        <Route index element={<LandingPage />} />
        <Route path="financial" element={<LandingPage />} />
        <Route path="pay" element={<PayPage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="faq" element={<FaqPage />} />
        <Route path="contact" element={<ContactPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
