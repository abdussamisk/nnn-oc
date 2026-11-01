"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import type { Clip } from "@/lib/types";

export type ClipPopupHandle = {
  open: (clip: Clip | null, day: number, mode: "mark" | "archive") => void;
  close: () => void;
};

type PopupState = {
  visible: boolean;
  day: number;
  clip: Clip | null;
  mode: "mark" | "archive";
};

const CLOSED: PopupState = {
  visible: false,
  day: 0,
  clip: null,
  mode: "mark",
};

export const ClipPopup = forwardRef<
  ClipPopupHandle,
  {
    preloadClip: Clip | null;
    todayDay: number | null;
    onRefreshToday: () => Promise<Clip | null>;
  }
>(function ClipPopup({ preloadClip, todayDay, onRefreshToday }, ref) {
  const [state, setState] = useState<PopupState>(CLOSED);
  const [muted, setMuted] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const [refreshAttempted, setRefreshAttempted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const setVideoSource = useCallback((clip: Clip) => {
    const video = videoRef.current;
    if (!video) return;
    if (video.dataset.clipUrl !== clip.url) {
      video.src = clip.url;
      video.dataset.clipUrl = clip.url;
      video.load();
    }
  }, []);

  useEffect(() => {
    if (!state.visible && preloadClip?.kind === "video") {
      setVideoSource(preloadClip);
    }
  }, [preloadClip, setVideoSource, state.visible]);

  const close = useCallback(() => {
    videoRef.current?.pause();
    setState((current) => ({ ...current, visible: false }));
    setBlocked(false);
    setMuted(false);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      open(clip, day, mode) {
        setRefreshAttempted(false);
        setBlocked(false);
        setMuted(false);
        setState({ visible: true, day, clip, mode });

        const video = videoRef.current;
        if (!video) return;

        if (clip?.kind === "video") {
          setVideoSource(clip);
          video.currentTime = 0;
          video.muted = false;
          video.volume = 1;

          const attempt = video.play();
          if (attempt) {
            attempt.catch(() => {
              // Autoplay with sound was rejected. Retry muted and offer sound.
              video.muted = true;
              setMuted(true);
              const retry = video.play();
              if (retry) retry.catch(() => setBlocked(true));
            });
          }
        } else {
          video.pause();
        }
      },
      close,
    }),
    [close, setVideoSource],
  );

  useEffect(() => {
    if (!state.visible) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [state.visible, close]);

  async function handleVideoError() {
    if (!state.clip || state.clip.kind !== "video" || refreshAttempted) return;
    if (state.day !== todayDay) return;

    setRefreshAttempted(true);
    const fresh = await onRefreshToday();
    if (!fresh || fresh.kind !== "video") return;

    setVideoSource(fresh);
    setState((current) => ({ ...current, clip: fresh }));
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    video.muted = false;
    const attempt = video.play();
    if (attempt) {
      attempt.catch(() => {
        video.muted = true;
        setMuted(true);
        void video.play().catch(() => setBlocked(true));
      });
    }
  }

  function unmute() {
    const video = videoRef.current;
    if (!video) return;
    video.muted = false;
    setMuted(false);
    setBlocked(false);
    void video.play();
  }

  const isVideo = state.clip?.kind === "video";

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-3 backdrop-blur-md transition-opacity duration-200 sm:p-6 ${
        state.visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!state.visible}
      inert={!state.visible}
      onClick={close}
    >
      <div
        className={`animate-pop relative w-full max-w-3xl overflow-hidden rounded-2xl border border-line-strong bg-ink-2 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.95)] ${
          state.visible ? "" : "invisible"
        }`}
        role="dialog"
        aria-modal="true"
        aria-label={`Day ${state.day} clip`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4 border-b border-line px-4 py-3 sm:px-5">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-ember px-2.5 py-1 font-mono text-[10px] font-medium text-[#1a0803]">
              DAY {String(state.day).padStart(2, "0")}
            </span>
            <span className="font-mono text-[9px] tracking-[0.14em] text-muted uppercase">
              {state.mode === "mark" ? "Marked · reward clip" : "Archive"}
            </span>
          </div>
          <button
            type="button"
            onClick={close}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-bone-dim transition-colors hover:border-bone/40 hover:text-bone"
            aria-label="Close clip"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <div className="relative bg-black">
          {/* Always mounted so play() can run inside the mark click gesture. */}
          <video
            ref={videoRef}
            className={
              isVideo
                ? "aspect-video w-full bg-black"
                : "pointer-events-none absolute inset-0 h-full w-full opacity-0"
            }
            playsInline
            controls={isVideo}
            preload="auto"
            onError={handleVideoError}
          />

          {state.clip?.kind === "image" ? (
            <img
              src={state.clip.url}
              alt={`Day ${state.day} clip`}
              className="max-h-[70vh] w-full object-contain"
            />
          ) : null}

          {!state.clip ? (
            <div className="flex aspect-video flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_30%,rgba(255,77,31,0.18),transparent_65%)] px-8 text-center">
              <div className="eyebrow">Day {String(state.day).padStart(2, "0")}</div>
              <div className="display mt-3 text-6xl text-bone sm:text-7xl">Still cooking.</div>
              <p className="mt-4 max-w-sm text-[13px] leading-6 text-bone-dim">
                The clip hasn&apos;t landed yet. It will appear here when it does — and your mark
                still counts.
              </p>
            </div>
          ) : null}

          {isVideo && muted ? (
            <button
              type="button"
              onClick={unmute}
              className="absolute right-4 bottom-16 rounded-full bg-bone px-4 py-2 text-[12px] font-bold text-ink shadow-lg"
            >
              Tap for sound
            </button>
          ) : null}

          {isVideo && blocked ? (
            <button
              type="button"
              onClick={unmute}
              className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/55"
            >
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-ember text-2xl text-ink">
                ▶
              </span>
              <span className="font-mono text-[10px] tracking-[0.14em] text-bone uppercase">
                Tap to play with sound
              </span>
            </button>
          ) : null}
        </div>

        <div className="flex flex-col gap-2 border-t border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <p className="text-[11px] leading-5 text-muted">
            {state.mode === "mark"
              ? "One mark made. This is the only time the popup opens on its own."
              : "Archive clips are available for days you marked."}
          </p>
          <span className="font-mono text-[9px] tracking-[0.12em] text-muted uppercase">
            Esc to close
          </span>
        </div>
      </div>
    </div>
  );
});
