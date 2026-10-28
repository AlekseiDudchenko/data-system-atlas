import { pushCopy as c } from "../content/push";
import PushLab, { type PushScene } from "./PushLab";
import StoryShell from "./StoryShell";

/** Push transfers: direct push, queue, poison message, redelivery, scale-out. */
export default function PushExplorer() {
  return (
    <StoryShell
      scenes={c.scenes}
      scenesLabel={c.scenesLabel}
      controlsLabel={c.controls}
      lab={(scene, hydrated) => (
        <PushLab key={scene} scene={scene as PushScene} hydrated={hydrated} />
      )}
    />
  );
}
