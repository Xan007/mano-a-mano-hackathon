import { ChatGuide } from "./components/ChatGuide";
import { TravelExperience } from "./components/TravelExperience";
import { LazyMotion, domAnimation } from "motion/react";
import { StrictMode } from "react";
import { ClerkProvider } from "@clerk/react";
import { createRoot } from "react-dom/client";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { BrowserRouter } from "react-router";
import { Toaster } from "sonner";
import { Check, Info, TriangleAlert } from "lucide-react";
import App from "./App";
import { StaffIdentity } from "./components/StaffIdentity";
import { AmbientBackground } from "./components/AmbientBackground";
import { SessionProvider } from "./lib/session";
import "./index.css";

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL as string);

const app = (
  <ClerkProvider
    publishableKey={import.meta.env.VITE_CLERK_PUBLISHABLE_KEY}
    signInUrl="/cuenta/google?step=retry"
    signUpUrl="/cuenta/google?step=extra"
    prefetchUI={false}
  >
  <ConvexProvider client={convex}>
    <SessionProvider>
      <LazyMotion features={domAnimation}>
      <TravelExperience>
        <AmbientBackground />
        <BrowserRouter>
          <StaffIdentity />
          <App />
          <ChatGuide />
          <Toaster
            position="bottom-right"
            offset={{ bottom: 24, right: 16 }}
            mobileOffset={{ bottom: 86, right: 12 }}
            duration={3200}
            visibleToasts={2}
            gap={10}
            closeButton
            icons={{
              success: <Check className="h-4 w-4" aria-hidden="true" />,
              error: <TriangleAlert className="h-4 w-4" aria-hidden="true" />,
              info: <Info className="h-4 w-4" aria-hidden="true" />,
            }}
            toastOptions={{
              classNames: {
                toast:
                  "!max-w-[min(22rem,calc(100vw-1.5rem))] !rounded-2xl !border-2 !border-ink !bg-[#fffdf7] !font-sans !text-ink !shadow-[5px_5px_0_var(--color-ink)]",
                title: "!font-display !text-sm !font-bold !text-ink",
                description: "!text-xs !text-ink/70",
                content: "!gap-0.5",
                icon: "!text-ink",
                success: "!bg-mist",
                error: "!bg-blush",
                info: "!bg-sand",
                closeButton:
                  "!absolute !right-2 !top-2 !left-auto !border-2 !border-ink !bg-paper !text-ink",
                actionButton:
                  "!rounded-full !border-2 !border-ink !bg-ink !text-paper",
                cancelButton:
                  "!rounded-full !border-2 !border-ink !bg-sand !text-ink",
              },
            }}
          />
        </BrowserRouter>
      </TravelExperience>
      </LazyMotion>
    </SessionProvider>
  </ConvexProvider>
  </ClerkProvider>
);

createRoot(document.getElementById("root")!).render(
  <StrictMode>{app}</StrictMode>,
);
