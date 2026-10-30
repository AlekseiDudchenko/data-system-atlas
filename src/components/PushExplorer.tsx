import { getPushCopy } from "../content/localized";
import { LocaleProvider, useLocale } from "../i18n/react";
import type { Locale } from "../i18n";
import PushLab, { type PushScene } from "./PushLab";
import StoryShell from "./StoryShell";

/** Push transfers: direct push, queue, poison message, redelivery, scale-out. */
export default function PushExplorer({ locale }: { locale: Locale }) {
  return (
    <LocaleProvider locale={locale}>
      <Explorer />
    </LocaleProvider>
  );
}

function Explorer() {
  const c = getPushCopy(useLocale());
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
