import { useEffect, useRef, useState } from "react";
import { transferCopy as c } from "../content/transfers";
import FailureLab, { type FailureScene } from "./FailureLab";
import ParallelLab from "./ParallelLab";
import VolumeLab, { type VolumeScene } from "./VolumeLab";
import { useHydrated } from "./useHydrated";

const count = String(c.scenes.length).padStart(2, "0");
const number = (i: number) => String(i + 1).padStart(2, "0");

/** Scroll-driven scenes beside one workspace; each scene owns its lab. */
export default function TransferExplorer() {
  const hydrated = useHydrated();
  const [scene, setScene] = useState(0);
  const active = useRef(0);
  const switchScene = (next: number) => {
    if (active.current === next) return;
    active.current = next;
    setScene(next);
  };

  useEffect(() => {
    if (!window.matchMedia("(min-width: 900px)").matches) return;
    const scenes = Array.from(
      document.querySelectorAll<HTMLElement>("[data-scene]"),
    );
    const observer = new IntersectionObserver(
      () => {
        // Read current positions, since queued entries can precede a manual jump.
        const anchor = window.innerHeight * 0.3;
        const visible = scenes.find((element) => {
          const bounds = element.getBoundingClientRect();
          return bounds.top <= anchor && bounds.bottom > anchor;
        });
        if (visible) switchScene(Number(visible.dataset.scene));
      },
      { rootMargin: "-15% 0px -55% 0px", threshold: 0 },
    );
    scenes.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`story-explorer ${hydrated ? "is-interactive" : ""}`}>
      <div className="story-narrative">
        {c.scenes.map((item, i) => (
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
              {c.controls} <span aria-hidden="true">↗</span>
            </a>
          </section>
        ))}
      </div>
      <div className="story-workspace" id="story-workspace" tabIndex={-1}>
        <nav className="scene-nav" aria-label={c.scenesLabel}>
          {c.scenes.map((item, i) => (
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
        {scene < 4 ? (
          <VolumeLab
            key={scene}
            scene={scene as VolumeScene}
            hydrated={hydrated}
          />
        ) : scene < 7 ? (
          <FailureLab
            key={scene}
            scene={scene as FailureScene}
            hydrated={hydrated}
          />
        ) : (
          <ParallelLab hydrated={hydrated} />
        )}
      </div>
    </div>
  );
}
