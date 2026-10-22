import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { useMutation, useQuery } from "convex/react";
import { driver, type Driver, type PopoverDOM } from "driver.js";
import { api } from "../../convex/_generated/api";
import { companionById } from "../../config/catalog";
import { useToken } from "../lib/session";
import { useCalmMotion } from "../lib/motion";
import { preloadTourRoutes } from "../lib/tourRoutes";
import "driver.js/dist/driver.css";
import "./QuickTour.css";

export default function QuickTour({ playerId, completedAt, companionId }: {
  playerId: string;
  completedAt: number | null;
  companionId: string;
}) {
  const token = useToken();
  const finish = useMutation(api.players.finishQuickTour);
  const navigate = useNavigate();
  const location = useLocation();
  const reducedMotion = useCalmMotion();
  const navigateRef = useRef(navigate);
  const replayRef = useRef<(() => void) | null>(null);
  const companionImage = companionById(companionId)?.imagePath;
  const [warming, setWarming] = useState(() => {
    try { return !completedAt && localStorage.getItem(`manoamano.quick-tour.${playerId}`) !== "done"; }
    catch { return !completedAt; }
  });
  // Keep this shared subscription alive when Casa unmounts, so Mapa can use
  // the result immediately rather than waiting for another server round trip.
  useQuery(api.places.list, warming ? { token } : "skip");

  useEffect(() => {
    if (warming) void preloadTourRoutes().catch(() => undefined);
  }, [warming]);

  useEffect(() => { navigateRef.current = navigate; }, [navigate]);

  useEffect(() => {
    const key = `manoamano.quick-tour.${playerId}`;
    let disposed = false;
    let tour: Driver | undefined;
    let starting = false;
    let timer: number | undefined;
    let refreshTimer: number | undefined;
    let moveTimer: number | undefined;
    let moveFrame: number | undefined;
    let moveObserver: MutationObserver | undefined;
    let transitioning = false;
    let remembered = Boolean(completedAt);
    let savedThisRun = false;
    try { remembered ||= localStorage.getItem(key) === "done"; } catch { /* Account state still works without storage. */ }

    function save() {
      if (savedThisRun) return;
      savedThisRun = true;
      remembered = true;
      try { localStorage.setItem(key, "done"); } catch { /* Persist on the account instead. */ }
      void finish({ token }).catch(() => undefined);
    }

    function cancelMove() {
      window.clearTimeout(moveTimer);
      if (moveFrame !== undefined) window.cancelAnimationFrame(moveFrame);
      moveObserver?.disconnect();
      moveObserver = undefined;
      moveFrame = undefined;
      transitioning = false;
    }

    function move(path: string, direction: "next" | "previous") {
      if (transitioning || !tour?.isActive()) return;
      transitioning = true;
      const leavingPage = tour?.getActiveElement()?.closest("[data-tour-page]");
      const name = path === "/mapa" ? "rescue" : direction === "next" ? "send" : "map";
      const popover = tour.getState("popover") as PopoverDOM | undefined;
      if (popover) {
        popover.wrapper.setAttribute("aria-busy", "true");
        popover.nextButton.textContent = path === "/mapa" ? "Abriendo mapa…" : "Volviendo a Casa…";
        popover.nextButton.disabled = true;
        popover.previousButton.disabled = true;
      }
      function destination() {
        const target = visibleTarget(name);
        const page = target?.closest("[data-tour-page]");
        return page !== leavingPage && page?.getAttribute("data-tour-page") === path ? target : undefined;
      }
      function checkDestination() {
        moveFrame = undefined;
        if (disposed || !tour?.isActive()) return;
        const target = destination();
        if (!target) return;
        // Confirm the committed route on the next frame, without polling.
        moveFrame = window.requestAnimationFrame(() => {
          moveFrame = undefined;
          if (disposed || !tour?.isActive() || destination() !== target) { scheduleCheck(); return; }
          cancelMove();
          if (popover) {
            popover.wrapper.removeAttribute("aria-busy");
            popover.nextButton.disabled = false;
            popover.previousButton.disabled = false;
          }
          if (direction === "next") tour.moveNext();
          else tour.movePrevious();
        });
      }
      function scheduleCheck() {
        if (!disposed && transitioning && moveFrame === undefined) moveFrame = window.requestAnimationFrame(checkDestination);
      }
      moveObserver = new MutationObserver(scheduleCheck);
      moveObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-tour", "data-tour-page"] });
      moveTimer = window.setTimeout(() => { cancelMove(); tour?.destroy(); }, 8_000);
      navigateRef.current(path);
      scheduleCheck();
    }

    const visibleTarget = (name: string) => Array.from(document.querySelectorAll<HTMLElement>(`[data-tour="${name}"]`))
      .find(element => element.getClientRects().length > 0);

    function start() {
      if (disposed) return;
      const first = document.querySelector('[data-tour="map"]');
      if (!first || !first.getClientRects().length || document.querySelector('[aria-modal="true"]')) {
        starting = false;
        return;
      }
      observer.disconnect();
      setWarming(true);
      tour = driver({
        animate: !reducedMotion,
        duration: 240,
        smoothScroll: false,
        overlayColor: "#17233b",
        overlayOpacity: 0.72,
        stagePadding: 8,
        stageRadius: 18,
        popoverOffset: 16,
        popoverClass: "quick-tour",
        showProgress: true,
        progressText: "{{current}} de {{total}}",
        showButtons: ["previous", "next", "close"],
        prevBtnText: "Atrás",
        doneBtnText: "¡Listo!",
        closeBtnLabel: "Saltar guía",
        allowKeyboardControl: false,
        waitForElement: 8_000,
        onHighlighted: (element) => {
          // Route entrance animations finish before the final positioning pass.
          refreshTimer = window.setTimeout(() => tour?.refresh(), 300);
          if (!element) {
            // A slow or unavailable route must never leave an empty spotlight.
            tour?.destroy();
          }
        },
        onDeselected: () => {
          window.clearTimeout(refreshTimer);
        },
        onPopoverRender: (popover, { index }) => {
          if (companionImage) {
            const image = document.createElement("img");
            image.src = companionImage;
            image.alt = "";
            image.className = "quick-tour-companion";
            popover.wrapper.prepend(image);
          }
          if (index === 1 && document.querySelector('[data-tour="rescue"]')?.getAttribute("data-all-rescued") === "true") {
            popover.description.textContent = "Ya exploraste todo. Aquí puedes volver a tus historias favoritas.";
          }
          if (index === 2 && document.querySelector('[data-tour="send"]')?.getAttribute("data-ready-count") === "0") {
            popover.description.textContent = "Para enviar otro, rescátalo en el mapa. Luego vuelve aquí.";
          }
        },
        onPrevClick: (_element, _step, { index }) => move(index === 1 ? "/casa" : "/mapa", "previous"),
        onDestroyStarted: () => {
          // Driver's onDestroyed does not run if closed during its entrance.
          if (!disposed) save();
          tour?.destroy();
        },
        onDestroyed: () => {
          cancelMove();
          if (!disposed) { setWarming(false); save(); }
        },
        steps: [
          {
            element: () => visibleTarget("map")!,
            popover: {
              title: "Tu aventura sigue aquí",
              description: "En el mapa descubres historias y rescatas más peluches.",
              nextBtnText: "Ver mapa",
              onNextClick: () => move("/mapa", "next"),
              side: "bottom",
              align: "start",
            },
          },
          {
            element: () => visibleTarget("rescue")!,
            popover: {
              title: "Un botón, una historia",
              description: "Pulsa aquí para conocer la siguiente historia y rescatar un peluche.",
              nextBtnText: "¿Y cómo lo envío?",
              onNextClick: () => move("/casa", "next"),
              side: "bottom",
              align: "end",
            },
          },
          {
            element: () => visibleTarget("send")!,
            popover: {
              title: "Ponlo a viajar",
              description: "Elige un peluche, escribe una nota y déjalo viajar.",
              side: "bottom",
              align: "start",
            },
          },
          {
            element: () => visibleTarget("support")!,
            popover: {
              title: "Todos los canales de apoyo",
              description: "En Apoyo encuentras los canales disponibles y puedes consultarlos cuando quieras.",
              side: "bottom",
              align: "center",
            },
          },
          {
            element: () => visibleTarget("guide")!,
            popover: {
              title: "¿Necesitas una mano?",
              description: "Si necesitas ayuda con cualquier cosa dentro de la página, toca este botón y pregúntame.",
              side: "top",
              align: "end",
            },
          },
        ],
      });
      tour.drive();
    }

    function checkHome() {
      if (disposed || remembered || starting || tour?.isActive()) return;
      if (!document.querySelector('[data-tour="map"]')) return;
      starting = true;
      timer = window.setTimeout(start, 350);
    }
    const observer = new MutationObserver(checkHome);
    function watchHome() {
      observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ["data-tour"] });
      checkHome();
    }
    replayRef.current = () => {
      if (tour?.isActive()) return;
      remembered = false;
      savedThisRun = false;
      setWarming(true);
      starting = false;
      watchHome();
    };
    // Capture real actions before React unmounts their page. Driver's own
    // click advancement can miss taps made during a step's entrance animation.
    const onTargetClick = (event: MouseEvent) => {
      if (!tour?.isActive() || !(event.target instanceof Element)) return;
      const name = event.target.closest("[data-tour]")?.getAttribute("data-tour");
      const index = tour.getActiveIndex();
      if (index === 0 && name === "map") move("/mapa", "next");
      else if ((index === 1 && name === "rescue") || (index === 2 && name === "send")) {
        save();
        tour.destroy();
      }
    };
    document.addEventListener("click", onTargetClick, true);
    const onTourKey = (event: KeyboardEvent) => {
      if (!tour?.isActive() || event.altKey || event.ctrlKey || event.metaKey) return;
      if (!["ArrowLeft", "ArrowRight", "Escape"].includes(event.key)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      if (event.repeat) return;
      const index = tour.getActiveIndex();
      if (event.key === "Escape" || (event.key === "ArrowRight" && index === 2)) {
        save();
        tour.destroy();
      } else if (event.key === "ArrowRight") move(index === 0 ? "/mapa" : "/casa", "next");
      else if (index !== 0) move(index === 1 ? "/casa" : "/mapa", "previous");
    };
    // Driver ignores arrows during its animation; handle them on keydown so
    // a quick second press is not lost after the new step becomes visible.
    window.addEventListener("keydown", onTourKey, true);
    const stopOnBack = () => tour?.destroy();
    window.addEventListener("popstate", stopOnBack);
    if (!remembered) watchHome();

    return () => {
      disposed = true;
      replayRef.current = null;
      observer.disconnect();
      window.clearTimeout(timer);
      window.clearTimeout(refreshTimer);
      cancelMove();
      document.removeEventListener("click", onTargetClick, true);
      window.removeEventListener("keydown", onTourKey, true);
      window.removeEventListener("popstate", stopOnBack);
      tour?.destroy();
    };
  }, [playerId, completedAt, companionImage, token, finish, reducedMotion]);

  useEffect(() => {
    if (location.pathname !== "/casa" || new URLSearchParams(location.search).get("guia") !== "1") return;
    replayRef.current?.();
    navigate("/casa", { replace: true });
  }, [location.pathname, location.search, navigate]);

  return null;
}
