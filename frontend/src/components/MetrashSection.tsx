import { useEffect, useState } from "react";
import { Carousel } from "@mantine/carousel";
import { Container } from "@mantine/core";
import { ChevronLeft, ChevronRight } from "lucide-react";
import appStore from "../assets/images/Qrcode/appstore.png";
import playStore from "../assets/images/Qrcode/playstore.png";
import appGallery from "../assets/images/Qrcode/appgallery.png";
import slide1 from "../assets/images/Qrcode/mobile/slide1.png";
import slide2 from "../assets/images/Qrcode/mobile/slide2.png";
import slide3 from "../assets/images/Qrcode/mobile/slide3.png";
import { useLang } from "../context/LanguageContext";
import styles from "./MetrashSection.module.scss";
import type { EmblaCarouselType } from "embla-carousel";

const STORES = [
  {
    label: "App Store",
    img: appStore,
    href: "https://apps.apple.com/qa/app/metrash2/id845232976",
  },
  {
    label: "Google Play",
    img: playStore,
    href: "https://play.google.com/store/apps/details?id=qa.gov.moi.metrash2",
  },
  {
    label: "AppGallery",
    img: appGallery,
    href: "https://appgallery.huawei.com/app/C101498831",
  },
];

const SLIDES = [slide3, slide2, slide1];

export function MetrashSection() {
  const { t } = useLang();
  const [embla, setEmbla] = useState<EmblaCarouselType | null>(null);

  const go = (dir: number) => {
    if (!embla) return;
    if (dir > 0) embla.scrollNext();
    else embla.scrollPrev();
  };

  useEffect(() => {
    if (!embla) return;
    const id = globalThis.setInterval(() => embla.scrollNext(), 4000);
    return () => globalThis.clearInterval(id);
  }, [embla]);

  return (
    <section className={styles.section}>
      <Container size="xl" className={styles.inner}>
        {/* Text + store QR codes */}
        <div className={styles.content}>
          <h2 className={styles.title}>{t.metrash.title}</h2>
          <p className={styles.desc}>{t.metrash.desc}</p>
          <p className={styles.hint}>{t.metrash.hint}</p>

          <div className={styles.stores}>
            {STORES.map((s) => (
              <a
                key={s.label}
                href={s.href}
                target="_blank"
                rel="noreferrer"
                className={styles.store}
              >
                <img src={s.img} alt={s.label} className={styles.storeImg} />
              </a>
            ))}
          </div>
        </div>

        {/* Phone mockup */}
        <div className={styles.phoneWrap}>
          <button
            type="button"
            className={styles.navArrow}
            aria-label="previous"
            onClick={() => go(-1)}
          >
            <ChevronRight size={26} />
          </button>

          <div className={styles.phone}>
            <span className={styles.notch} />

            {/*
              KEY FIX: use classNames to target Mantine's internal DOM slots.
              Without this, Mantine renders its own divs that default to
              flex-direction: column, stacking slides vertically.
            */}
            <Carousel
              classNames={{
                root: styles.carouselRoot,
                viewport: styles.carouselViewport,
                container: styles.carouselContainer,
                slide: styles.slide,
              }}
              slideSize="100%"
              slideGap={0}
              emblaOptions={{
                loop: true,
                dragFree: false,
                align: "center",
              }}
              withControls={false}
              withIndicators={false}
              getEmblaApi={setEmbla}
            >
              {SLIDES.map((src, i) => (
                <Carousel.Slide key={src}>
                  <img src={src} alt={`Metrash screen ${i + 1}`} />
                </Carousel.Slide>
              ))}
            </Carousel>
          </div>

          <button
            type="button"
            className={styles.navArrow}
            aria-label="next"
            onClick={() => go(1)}
          >
            <ChevronLeft size={26} />
          </button>
        </div>
      </Container>
    </section>
  );
}
