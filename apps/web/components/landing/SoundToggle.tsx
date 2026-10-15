"use client";

import { useEffect, useRef, useState } from "react";
import { SpeakerWaveIcon, SpeakerXMarkIcon } from "@/components/marketing/icons";

// Botão de música de fundo da landing (cabeçalho). Desligado por padrão; só toca depois de um
// clique da pessoa (os navegadores bloqueiam som automático). A escolha fica no localStorage:
// se estava ligada, volta a tocar no primeiro clique em qualquer lugar da página.
// Pausa quando a aba fica escondida. O layout só mostra o botão se o arquivo existir.

const SRC = "/landing/audio/theme.mp3";
const STORAGE_KEY = "ns-landing-sound";
const VOLUME = 0.3;
const FADE_MS = 1200;

function remember(on: boolean) {
  try {
    localStorage.setItem(STORAGE_KEY, on ? "on" : "off");
  } catch {
    // Modo privado ou armazenamento bloqueado: só não lembra a escolha.
  }
}

function remembered(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "on";
  } catch {
    return false;
  }
}

export function SoundToggle() {
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeRef = useRef(0);
  // A pessoa quer o som ligado (mesmo que a aba esteja escondida agora).
  const wantedRef = useRef(false);

  const fadeIn = (audio: HTMLAudioElement) => {
    cancelAnimationFrame(fadeRef.current);
    const start = performance.now();
    const from = audio.volume;
    const step = (now: number) => {
      const t = Math.min(1, (now - start) / FADE_MS);
      audio.volume = from + (VOLUME - from) * t;
      if (t < 1) fadeRef.current = requestAnimationFrame(step);
    };
    fadeRef.current = requestAnimationFrame(step);
  };

  const play = () => {
    let audio = audioRef.current;
    if (!audio) {
      audio = new Audio(SRC);
      audio.loop = true;
      audio.preload = "none";
      audio.volume = 0;
      audioRef.current = audio;
    }
    wantedRef.current = true;
    const current = audio;
    current
      .play()
      .then(() => {
        fadeIn(current);
        setPlaying(true);
      })
      .catch(() => {
        // Arquivo indisponível ou bloqueado pelo navegador: o botão continua desligado.
        wantedRef.current = false;
        setPlaying(false);
      });
  };

  const pause = () => {
    wantedRef.current = false;
    cancelAnimationFrame(fadeRef.current);
    audioRef.current?.pause();
    setPlaying(false);
  };

  const toggle = () => {
    if (wantedRef.current) {
      pause();
      remember(false);
    } else {
      play();
      remember(true);
    }
  };

  // A função `play` muda a cada render; o efeito usa a versão mais recente por esta ref.
  const playRef = useRef(play);
  useEffect(() => {
    playRef.current = play;
  });

  useEffect(() => {
    // Escolha lembrada: espera o primeiro clique da pessoa na página para tocar.
    let resume: ((event: PointerEvent) => void) | null = null;
    if (remembered()) {
      resume = (event: PointerEvent) => {
        // O clique no próprio botão já é tratado por ele.
        if ((event.target as Element | null)?.closest("[data-sound-toggle]")) return;
        if (!wantedRef.current) playRef.current();
      };
      document.addEventListener("pointerdown", resume, { once: true });
    }

    const onVisibility = () => {
      const audio = audioRef.current;
      if (!audio) return;
      if (document.hidden) {
        audio.pause();
      } else if (wantedRef.current) {
        audio.play().catch(() => undefined);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      if (resume) document.removeEventListener("pointerdown", resume);
      document.removeEventListener("visibilitychange", onVisibility);
      cancelAnimationFrame(fadeRef.current);
      audioRef.current?.pause();
    };
  }, []);

  return (
    <button
      type="button"
      data-sound-toggle
      onClick={toggle}
      aria-pressed={playing}
      aria-label={playing ? "Pause background music" : "Play background music"}
      className={`inline-flex size-11 items-center justify-center rounded-lg transition-colors duration-150 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${
        playing ? "text-white" : "text-slate-300"
      }`}
    >
      {playing ? <SpeakerWaveIcon className="size-5" /> : <SpeakerXMarkIcon className="size-5" />}
    </button>
  );
}
