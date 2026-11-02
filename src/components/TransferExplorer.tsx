import { getTransferCopy } from "../content/localized";
import { LocaleProvider, useLocale } from "../i18n/react";
import type { Locale } from "../i18n";
import FailureLab, { type FailureScene } from "./FailureLab";
import ParallelLab from "./ParallelLab";
import StoryShell from "./StoryShell";
import VolumeLab, { type VolumeScene } from "./VolumeLab";

/** Pull transfers: volume (1–4), failures (5–7), parallel readers (8). */
export default function TransferExplorer({ locale }: { locale: Locale }) {
  return (
    <LocaleProvider locale={locale}>
      <Explorer />
    </LocaleProvider>
  );
}

function Explorer() {
  const c = getTransferCopy(useLocale());
  return (
    <StoryShell
      scenes={c.scenes}
      scenesLabel={c.scenesLabel}
      controlsLabel={c.controls}
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
