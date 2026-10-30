import { transferCopy as c } from "../content/transfers";
import FailureLab, { type FailureScene } from "./FailureLab";
import ParallelLab from "./ParallelLab";
import StoryShell from "./StoryShell";
import JavaExample from "./JavaExample";
import { transferJava } from "../content/transferJava";
import VolumeLab, { type VolumeScene } from "./VolumeLab";

/** Pull transfers: volume (1–4), failures (5–7), parallel readers (8). */
export default function TransferExplorer() {
  return (
    <StoryShell
      scenes={c.scenes}
      scenesLabel={c.scenesLabel}
      controlsLabel={c.controls}
      sceneExtra={(scene) => {
        const example = transferJava[scene];
        return example ? <JavaExample example={example} /> : null;
      }}
      lab={(scene, hydrated) =>
        scene < 4 ? (
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
        )
      }
    />
  );
}
