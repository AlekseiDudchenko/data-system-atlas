import { useEffect, useRef, useState, type ReactNode } from "react";
import { useHydrated } from "./useHydrated";

type Scene = { title: string; body: string; insight: string };

const number = (i: number) => String(i + 1).padStart(2, "0");

/** Scroll-driven scenes beside one workspace; each scene renders its lab. */
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
  const hydrated = useHydrated();
  const [scene, setScene] = useState(0);
  const active = useRef(0);
  const count = String(scenes.length).padStart(2, "0");
  const switchScene = (next: number) => {
    if (active.current === next) return;
    active.current = next;
    setScene(next);
  };

  useEffect(() => {
    if (!window.matchMedia("(min-width: 900px)").matches) return;
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>("[data-scene]"),
    );
    const observer = new IntersectionObserver(
      () => {
        // Read current positions, since queued entries can precede a manual jump.
        const anchor = window.innerHeight * 0.3;
        const visible = elements.find((element) => {
          const bounds = element.getBoundingClientRect();
          return bounds.top <= anchor && bounds.bottom > anchor;
        });
        if (visible) switchScene(Number(visible.dataset.scene));
      },
      { rootMargin: "-15% 0px -55% 0px", threshold: 0 },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`story-explorer ${hydrated ? "is-interactive" : ""}`}>
      <div className="story-narrative">
        {scenes.map((item, i) => (
          <section
            key={i}
            id={`scene-${i + 1}`}
            data-scene={i}
            className={`story-scene ${scene === i ? "active" : ""}`}
            aria-labelledby={`scene-title-${i}`}
          >
            <span className="story-index">
              {number(i)} / {count}
            </span>
            <h2 id={`scene-title-${i}`}>{item.title}</h2>
            <p>{item.body}</p>
            <p className="scene-insight">{item.insight}</p>
            <a
              href="#story-workspace"
              className="scene-open"
              onClick={(event) => {
                event.preventDefault();
                switchScene(i);
                document
                  .getElementById("story-workspace")
                  ?.focus({ preventScroll: true });
              }}
            >
              {controlsLabel} <span aria-hidden="true">↗</span>
            </a>
          </section>
        ))}
      </div>
      <div className="story-workspace" id="story-workspace" tabIndex={-1}>
        <nav className="scene-nav" aria-label={scenesLabel}>
          {scenes.map((item, i) => (
            <button
              key={i}
              type="button"
              disabled={!hydrated}
              aria-label={item.title}
              aria-pressed={scene === i}
              onClick={() => {
                switchScene(i);
                if (window.matchMedia("(min-width: 900px)").matches) {
                  document
                    .getElementById(`scene-${i + 1}`)
                    ?.scrollIntoView({ block: "start", behavior: "instant" });
                }
              }}
            >
              {number(i)}
            </button>
          ))}
        </nav>
        {lab(scene, hydrated)}
      </div>
    </div>
  );
}
