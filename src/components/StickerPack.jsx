import { useEffect, useRef, useState } from 'react';
import { Maximize2, Play } from 'lucide-react';

// The sticker pack lab (public/labs/sticker-pack) embedded in an iframe.
// Nothing loads until the section comes near the viewport; a poster stands
// in until the frame has loaded. The file name is explicit because the Vite
// dev server answers a bare folder URL with the portfolio's own index.html.
const SRC = '/labs/sticker-pack/index.html';

export function StickerPack({ copy }) {
  const stageRef = useRef(null);
  const [near, setNear] = useState(false);
  const [loaded, setLoaded] = useState(false);
  // The lab takes touch input for dragging and peeling, which would trap page
  // scrolling on phones, so touch screens load it only after a tap.
  const [touch, setTouch] = useState(false);
  const [tapped, setTapped] = useState(false);

  useEffect(() => {
    setTouch(window.matchMedia?.('(pointer: coarse)').matches ?? false);
    const stage = stageRef.current;
    if (typeof IntersectionObserver !== 'function') {
      setNear(true);
      return undefined;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: '400px 0px' },
    );
    io.observe(stage);
    return () => io.disconnect();
  }, []);

  const live = near && (!touch || tapped);

  return (
    <>
      <div className="stickers-stage" ref={stageRef}>
        <img
          className={`stickers-poster${loaded ? ' is-hidden' : ''}`}
          src="/media/images/sticker-pack-poster.webp"
          alt={copy.posterAlt}
          width="1280"
          height="800"
          loading="lazy"
          decoding="async"
        />
        {live && (
          <iframe
            className="stickers-frame"
            src={SRC}
            title={copy.frameTitle}
            loading="lazy"
            onLoad={() => setLoaded(true)}
          />
        )}
        {touch && !tapped && (
          <button type="button" className="stickers-play" onClick={() => setTapped(true)}>
            <Play size={14} aria-hidden="true" />
            {copy.play}
          </button>
        )}
      </div>
      <div className="stickers-bar">
        <a className="stickers-open" href={SRC} target="_blank" rel="noopener noreferrer">
          {copy.open}
          <Maximize2 size={13} aria-hidden="true" />
        </a>
      </div>
    </>
  );
}
