import { useCallback } from "react";
import { useApp } from "./AppStore";

/**
 * Global "Surprise me" action — opens a random memory in the lightbox.
 */
export function useGlobalSurprise(): () => void {
  const archive = useApp().archive;
  const openLightbox = useApp().openLightbox;
  const toast = useApp().toast;

  return useCallback(() => {
    if (!archive || archive.media.length === 0) {
      toast("No memories available yet.");
      return;
    }
    const i = Math.floor(Math.random() * archive.media.length);
    openLightbox(archive.media, i);
  }, [archive, openLightbox, toast]);
}