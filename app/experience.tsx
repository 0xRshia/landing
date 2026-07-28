"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { primarySongUrl, songs, type Song } from "../data/songs";
import type { SceneTarget } from "./scene";

const SceneCanvas = dynamic(() => import("./scene"), {
  ssr: false,
  loading: () => null,
});

gsap.registerPlugin(ScrollTrigger, useGSAP);

const initialSceneTarget: SceneTarget = {
  x: 0,
  y: 0,
  scale: 1,
  rotationX: -0.04,
  rotationY: -0.12,
  rotationZ: -0.04,
  cameraZ: 6.4,
  rim: 11,
  velocity: 0,
};

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  return reduced;
}

function Ornament({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={`ornament ${compact ? "ornament--compact" : ""}`}
      aria-hidden="true"
    >
      <span />
      <i />
      <span />
    </span>
  );
}

function ServiceLink({
  href,
  service,
  song,
}: {
  href: string;
  service: "Spotify" | "YouTube";
  song: Song;
}) {
  return (
    <a
      className="service-link"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Listen to ${song.title} by ${song.artist} on ${service} (opens in a new tab)`}
    >
      {service}
      <span aria-hidden="true">↗</span>
    </a>
  );
}

function SongItem({
  song,
  index,
  onActivate,
  onDeactivate,
}: {
  song: Song;
  index: number;
  onActivate: () => void;
  onDeactivate: () => void;
}) {
  const displayNumber = String(index + 1).padStart(2, "0");

  return (
    <li
      className="song-row reveal"
      onMouseEnter={onActivate}
      onMouseLeave={onDeactivate}
      onFocus={onActivate}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) onDeactivate();
      }}
    >
      <span className="song-number" aria-hidden="true">
        {displayNumber}
      </span>
      <div className="song-copy">
        <p className="song-artist">{song.artist}</p>
        <a
          className="song-title"
          href={primarySongUrl(song)}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Listen to ${song.title} by ${song.artist} (opens in a new tab)`}
        >
          {song.title}
        </a>
        {song.note ? <p className="song-note">{song.note}</p> : null}
      </div>
      <div className="song-meta">
        <div className="service-links">
          {song.spotifyUrl ? (
            <ServiceLink href={song.spotifyUrl} service="Spotify" song={song} />
          ) : null}
          {song.youtubeUrl ? (
            <ServiceLink href={song.youtubeUrl} service="YouTube" song={song} />
          ) : null}
        </div>
        <div className="song-date">
          {song.favorite ? (
            <span className="favorite" aria-label="Favorite song">
              ◆
            </span>
          ) : null}
          {song.sharedOn ? (
            <time dateTime={song.sharedOn}>
              {new Intl.DateTimeFormat("en", {
                month: "short",
                year: "numeric",
              }).format(new Date(`${song.sharedOn}T00:00:00`))}
            </time>
          ) : null}
        </div>
      </div>
    </li>
  );
}

export default function GothicMixtapeExperience() {
  const root = useRef<HTMLElement>(null);
  const sceneTarget = useRef<SceneTarget>({ ...initialSceneTarget });
  const reducedMotion = useReducedMotion();
  const [activeSong, setActiveSong] = useState(-1);
  const [sceneStatus, setSceneStatus] = useState<
    "loading" | "ready" | "fallback"
  >("loading");

  const markLoading = useCallback(() => setSceneStatus("loading"), []);
  const markReady = useCallback(() => setSceneStatus("ready"), []);
  const markFallback = useCallback(() => setSceneStatus("fallback"), []);

  useEffect(() => {
    if (sceneStatus !== "loading") return;

    const timeout = window.setTimeout(() => {
      setSceneStatus((current) =>
        current === "loading" ? "fallback" : current,
      );
    }, 12_000);

    return () => window.clearTimeout(timeout);
  }, [sceneStatus]);

  useGSAP(
    () => {
      if (reducedMotion) {
        gsap.set(".reveal", { opacity: 1, y: 0 });
        gsap.set(".hero-kicker, .hero-title, .hero-subtitle, .scroll-cue", {
          opacity: 1,
          y: 0,
        });
        return;
      }

      gsap
        .timeline({ defaults: { ease: "power3.out" } })
        .from(".hero-kicker", { opacity: 0, y: 14, duration: 0.8 })
        .from(
          ".hero-title",
          { opacity: 0, y: 34, duration: 1.3 },
          "-=0.45",
        )
        .from(
          ".hero-subtitle",
          { opacity: 0, y: 18, duration: 0.9 },
          "-=0.6",
        )
        .from(".scroll-cue", { opacity: 0, duration: 0.8 }, "-=0.2");

      gsap.utils.toArray<HTMLElement>(".reveal").forEach((element) => {
        gsap.fromTo(
          element,
          { opacity: 0, y: 34 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: element,
              start: "top 86%",
              once: true,
            },
          },
        );
      });

      const timeline = gsap.timeline({
        scrollTrigger: {
          trigger: root.current,
          start: "top top",
          end: "bottom bottom",
          scrub: 1.15,
          onUpdate: (self) => {
            sceneTarget.current.velocity = self.getVelocity() / 2600;
          },
        },
      });
      const compactLayout = window.matchMedia("(max-width: 767px)").matches;
      const sidePosition = compactLayout ? 0.72 : 2.25;
      const songPosition = compactLayout ? 0.58 : 2.45;

      timeline
        .to(
          sceneTarget.current,
          {
            rotationY: 0.34,
            rotationX: 0.08,
            rotationZ: 0.05,
            scale: 0.88,
            x: 0.2,
            y: -0.18,
            rim: 14,
            duration: 0.17,
            ease: "none",
          },
          0,
        )
        .to(
          sceneTarget.current,
          {
            x: sidePosition,
            y: -0.1,
            scale: 0.72,
            rotationY: 0.62,
            rotationZ: 0.12,
            cameraZ: 6.8,
            rim: 9,
            duration: 0.19,
            ease: "none",
          },
          0.17,
        )
        .to(
          sceneTarget.current,
          {
            x: songPosition,
            y: 0.05,
            scale: 0.7,
            rotationY: 1.02,
            rotationX: -0.08,
            rim: 6,
            duration: 0.32,
            ease: "none",
          },
          0.36,
        )
        .to(
          sceneTarget.current,
          {
            x: 0,
            y: 0,
            scale: 1.34,
            rotationY: 1.56,
            rotationX: 0.18,
            rotationZ: -0.1,
            cameraZ: 5.45,
            rim: 16,
            duration: 0.18,
            ease: "none",
          },
          0.68,
        )
        .to(
          sceneTarget.current,
          {
            x: 0,
            y: 0.25,
            scale: 0.58,
            rotationY: 2.15,
            rotationZ: 0.08,
            cameraZ: 7.4,
            rim: 4.5,
            duration: 0.14,
            ease: "none",
          },
          0.86,
        );

      gsap.to(".hero-copy", {
        opacity: 0.12,
        yPercent: -14,
        scrollTrigger: {
          trigger: ".hero",
          start: "top top",
          end: "bottom 35%",
          scrub: true,
        },
      });

      gsap.to(".spider", {
        opacity: 0,
        scrollTrigger: {
          trigger: ".message-section",
          start: "top 85%",
          end: "top 35%",
          scrub: true,
        },
      });
    },
    { scope: root, dependencies: [reducedMotion], revertOnUpdate: true },
  );

  return (
    <main
      ref={root}
      className={`experience ${reducedMotion ? "is-reduced" : ""}`}
    >
      <a className="skip-link" href="#songs">
        Skip to the song collection
      </a>

      <div
        className={`guitar-poster ${sceneStatus === "ready" ? "is-hidden" : ""}`}
        role="img"
        aria-label="A black electric guitar lit by a silver and dark red rim light"
      />

      <SceneCanvas
        targetRef={sceneTarget}
        activeSong={activeSong}
        reducedMotion={reducedMotion}
        onLoading={markLoading}
        onReady={markReady}
        onError={markFallback}
      />

      <div className="atmosphere" aria-hidden="true">
        <div className="fog fog--one" />
        <div className="fog fog--two" />
        <div className="grain" />
      </div>

      <div className="spider spider--left" aria-hidden="true">
        <Image
          src={
            reducedMotion
              ? "/images/spider-idle.png"
              : "/images/spider-walk.png"
          }
          alt=""
          width={256}
          height={96}
          unoptimized
        />
      </div>
      <div className="spider spider--right" aria-hidden="true">
        <Image
          src={
            reducedMotion
              ? "/images/spider-idle.png"
              : "/images/spider-walk.png"
          }
          alt=""
          width={256}
          height={96}
          unoptimized
        />
      </div>

      <section className="hero" aria-labelledby="hero-title">
        <div className="cathedral-frame" aria-hidden="true">
          <span className="frame-spire" />
          <span className="frame-line frame-line--left" />
          <span className="frame-line frame-line--right" />
        </div>
        <div className="hero-copy">
          <p className="hero-kicker">A private archive · Volume I</p>
          <h1 className="hero-title" id="hero-title">
            The Songs
            <span>Between Us</span>
          </h1>
          <p className="hero-subtitle">
            A small archive of the songs you sent into my life.
          </p>
        </div>
        <div className="scroll-cue" aria-hidden="true">
          <span>Descend</span>
          <i />
        </div>
      </section>

      <section className="message-section content-section">
        <div className="section-copy section-copy--left reveal">
          <p className="section-label">I · What remained</p>
          <Ornament />
          <h2>Every song became a room I could return to.</h2>
          <p>
            Some arrived quietly. Some split the night open. I kept them all
            here—not as a playlist, but as a map of the moments you handed me.
          </p>
          <p className="replaceable-note">
            This message is placeholder copy and can be replaced with something
            only the two of you know.
          </p>
        </div>
      </section>

      <section className="songs-section" id="songs" aria-labelledby="songs-title">
        <header className="songs-header reveal">
          <div>
            <p className="section-label">II · The archive</p>
            <h2 id="songs-title">Songs kept in the dark</h2>
          </div>
          <p>
            Hover, focus, or tap a title. Every link opens outside this room.
          </p>
        </header>

        <ol className="song-list">
          {songs.map((song, index) => (
            <SongItem
              key={song.id}
              song={song}
              index={index}
              onActivate={() => setActiveSong(index)}
              onDeactivate={() => setActiveSong(-1)}
            />
          ))}
        </ol>
      </section>

      <section className="interlude" aria-label="Guitar interlude">
        <div className="interlude-copy reveal">
          <p className="section-label">III · Resonance</p>
          <p>Metal remembers every hand that made it sing.</p>
        </div>
        <div className="interlude-index" aria-hidden="true">
          03 / 05
        </div>
      </section>

      <section className="dedication content-section">
        <div className="dedication-card reveal">
          <p className="section-label">IV · For you</p>
          <Ornament />
          <h2>For every song you trusted me with.</h2>
          <p>
            And for all the ones we have not found yet. May there always be
            another track to send after midnight.
          </p>
          <p className="signature">Yours, in distortion and devotion.</p>
        </div>
      </section>

      <footer className="gothic-footer">
        <Ornament compact />
        <p>The Songs Between Us · An intimate digital mixtape</p>
        <details>
          <summary>Credits</summary>
          <p>
            Guitar model by PixelMotion4096 / ModelVault3D. Spider animation by
            br-n518, CC0. Both assets were modified and optimized for this
            experience.
          </p>
        </details>
      </footer>

      <p className="scene-status" role="status" aria-live="polite">
        {sceneStatus === "loading" ? "Lighting the instrument…" : null}
        {sceneStatus === "fallback"
          ? "The 3D scene is unavailable; the still artwork remains."
          : null}
      </p>
    </main>
  );
}
