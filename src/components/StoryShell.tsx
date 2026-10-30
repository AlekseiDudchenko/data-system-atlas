import { useEffect, useRef, useState, type ReactNode } from "react";
import { getNavigationCopy } from "../content/localized";
import { useLocale } from "../i18n/react";
import { useHydrated } from "./useHydrated";

type Scene = {
  id: string;
  navTitle: string;
  title: string;
  body: string;
  insight: string;
};
const number = (i: number) => String(i + 1).padStart(2, "0");

/** One scene selection drives the outline, URL, narrative and active lab. */
export default function StoryShell({
  scenes,
  scenesLabel,
  controlsLabel,
  lab,
}: {
  scenes: readonly Scene[];
  scenesLabel: string;
  controlsLabel: string;
  lab: (scene: number, hydrated: boolean) => ReactNode;
}) {
  const n = getNavigationCopy(useLocale());
  const hydrated = useHydrated();
  const [selection, setSelection] = useState({
    scene: 0,
    move: false,
    focus: false,
  });
  const { scene } = selection;
  const active = useRef(0);
  const navigating = useRef(false);
  const shell = useRef<HTMLDivElement>(null);
  const count = String(scenes.length).padStart(2, "0");

  const navigate = (next: number, focus = false) => {
    const item = scenes[next];
    if (!item) return;
    navigating.current = true;
    active.current = next;
    if (window.location.hash !== `#${item.id}`) {
      window.history.pushState(null, "", `#${item.id}`);
      window.dispatchEvent(new Event("atlas:scenechange"));
    }
    setSelection({ scene: next, move: true, focus });
  };

  useEffect(() => {
    const fromLocation = () => {
      const hash = window.location.hash.slice(1);
      const legacy = /^scene-(\d+)$/.exec(hash);
      const next = legacy
        ? Number(legacy[1]) - 1
        : scenes.findIndex((item) => item.id === hash);
      // Empty fragments (including Back to the initial URL) select the first scene.
      if (hash && !scenes[next]) return;
      const index = hash ? next : 0;
      const item = scenes[index];
      if (!item) return;
      if (legacy) {
        window.history.replaceState(null, "", `#${item.id}`);
        window.dispatchEvent(new Event("atlas:scenechange"));
      }
      navigating.current = true;
      active.current = index;
      setSelection({ scene: index, move: Boolean(hash), focus: false });
    };
    fromLocation();
    window.addEventListener("hashchange", fromLocation);
    window.addEventListener("popstate", fromLocation);
    return () => {
      window.removeEventListener("hashchange", fromLocation);
      window.removeEventListener("popstate", fromLocation);
    };
  }, [scenes]);

  useEffect(() => {
    if (!hydrated) return;
    if (selection.move) {
      const section = shell.current?.querySelector<HTMLElement>(
        `[data-scene="${scene}"]`,
      );
      const target = window.matchMedia("(min-width: 900px)").matches
        ? section
        : shell.current;
      target?.scrollIntoView({ block: "start", behavior: "instant" });
      if (selection.focus)
        section
          ?.querySelector<HTMLElement>("h2")
          ?.focus({ preventScroll: true });
    }
    const frame = requestAnimationFrame(() => {
      navigating.current = false;
    });
    return () => cancelAnimationFrame(frame);
  }, [selection, scene, hydrated]);

  useEffect(() => {
    let frame = 0;
    const followScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        if (
          navigating.current ||
          !window.matchMedia("(min-width: 900px)").matches
        )
          return;
        const anchor = Math.max(220, window.innerHeight * 0.3);
        const visible = Array.from(
          shell.current?.querySelectorAll<HTMLElement>("[data-scene]") ?? [],
        ).find((element) => {
          const bounds = element.getBoundingClientRect();
          return bounds.top <= anchor && bounds.bottom > anchor;
        });
        if (!visible) return;
        const next = Number(visible.dataset.scene);
        const item = scenes[next];
        if (!item || next === active.current) return;
        active.current = next;
        setSelection({ scene: next, move: false, focus: false });
        // Scrolling updates the current address without filling browser history.
        window.history.replaceState(null, "", `#${item.id}`);
        window.dispatchEvent(new Event("atlas:scenechange"));
      });
    };
    window.addEventListener("scroll", followScroll, { passive: true });
    window.addEventListener("resize", followScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", followScroll);
      window.removeEventListener("resize", followScroll);
    };
  }, [scenes]);

  return (
    <div
      ref={shell}
      className={`story-explorer ${hydrated ? "is-interactive" : ""}`}
    >
      <aside className="scene-outline">
        <p className="scene-outline-label">{n.outline}</p>
        <nav className="scene-toc" aria-label={scenesLabel}>
          {scenes.map((item, i) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              aria-current={scene === i ? "step" : undefined}
              onClick={(event) => {
                if (
                  !hydrated ||
                  event.metaKey ||
                  event.ctrlKey ||
                  event.shiftKey ||
                  event.altKey
                )
                  return;
                event.preventDefault();
                navigate(i);
              }}
            >
              <span className="scene-number" aria-hidden="true">
                {number(i)}
              </span>
              <span>{item.navTitle}</span>
            </a>
          ))}
        </nav>
      </aside>
      <div className="scene-picker">
        <label htmlFor="scene-select">{n.situation}</label>
        <select
          id="scene-select"
          value={scene}
          disabled={!hydrated}
          onChange={(event) => navigate(Number(event.target.value))}
        >
          {scenes.map((item, i) => (
            <option key={item.id} value={i}>
              {number(i)} / {count} · {item.navTitle}
            </option>
          ))}
        </select>
      </div>
      <div className="story-narrative">
        {scenes.map((item, i) => (
          <section
            key={item.id}
            id={item.id}
            data-scene={i}
            className={`story-scene ${scene === i ? "active" : ""}`}
            aria-labelledby={`scene-title-${i}`}
          >
            <span className="story-index">
              {number(i)} / {count}
            </span>
            <h2 id={`scene-title-${i}`} tabIndex={-1}>
              {item.title}
            </h2>
            <p>{item.body}</p>
            <p className="scene-insight">{item.insight}</p>
            <a
              href="#story-workspace"
              className="scene-open"
              onClick={(event) => {
                if (!hydrated) return;
                event.preventDefault();
                navigate(i);
                document
                  .getElementById("story-workspace")
                  ?.focus({ preventScroll: true });
              }}
            >
              {controlsLabel} <span aria-hidden="true">↗</span>
            </a>
            <nav
              className="scene-pager"
              aria-label={`${n.transitions}: ${item.navTitle}`}
            >
              {i > 0 ? (
                <a
                  href={`#${scenes[i - 1]?.id}`}
                  onClick={(event) => {
                    if (
                      !hydrated ||
                      event.metaKey ||
                      event.ctrlKey ||
                      event.shiftKey ||
                      event.altKey
                    )
                      return;
                    event.preventDefault();
                    navigate(i - 1, true);
                  }}
                >
                  {n.previous}
                </a>
              ) : (
                <span />
              )}
              {i < scenes.length - 1 ? (
                <a
                  href={`#${scenes[i + 1]?.id}`}
                  onClick={(event) => {
                    if (
                      !hydrated ||
                      event.metaKey ||
                      event.ctrlKey ||
                      event.shiftKey ||
                      event.altKey
                    )
                      return;
                    event.preventDefault();
                    navigate(i + 1, true);
                  }}
                >
                  {n.next}
                </a>
              ) : (
                <span />
              )}
            </nav>
            <a
              className="scene-permalink"
              href={`#${item.id}`}
              onClick={(event) => {
                if (
                  !hydrated ||
                  event.metaKey ||
                  event.ctrlKey ||
                  event.shiftKey ||
                  event.altKey
                )
                  return;
                event.preventDefault();
                navigate(i);
              }}
              aria-label={`${n.permalink}: ${item.navTitle}`}
            >
              ↗ #{item.id}
            </a>
          </section>
        ))}
      </div>
      <div className="story-workspace" id="story-workspace" tabIndex={-1}>
        {lab(scene, hydrated)}
      </div>
    </div>
  );
}
