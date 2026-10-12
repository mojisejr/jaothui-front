import Image from "next/image";
import { useEffect, useRef, type KeyboardEvent, type MouseEvent } from "react";
import { FiX } from "react-icons/fi";
import { canShowHomeInvitation, HOME_INVITATION_DELAY_MS, HOME_INVITATION_KEY, rememberHomeInvitation } from "../../utils/home-app-invitation";
import { AppDownloadActions } from "./AppDownloadActions";
import styles from "./HomeAppDownloadPrompt.module.css";

export function HomeAppDownloadPrompt() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const releasePageRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || typeof dialog.showModal !== "function" || /bot\b|crawler|spider|facebookexternalhit/i.test(navigator.userAgent)) return;
    let ready = false;
    let displayed = false;
    let restorePage: (() => void) | undefined;

    function releasePage() {
      restorePage?.();
      restorePage = undefined;
    }
    releasePageRef.current = releasePage;

    function tryOpen() {
      if (!dialog || !ready || displayed || document.visibilityState !== "visible" || document.querySelector("dialog[open]")) return;
      let storage: Storage;
      try { storage = window.localStorage; } catch { return; }
      if (!canShowHomeInvitation(storage, Date.now())) return;
      const previousFocus = document.activeElement;
      const rootOverflow = document.documentElement.style.overflow;
      const bodyOverflow = document.body.style.overflow;
      try { dialog.showModal(); } catch { return; }
      displayed = true;
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      restorePage = () => {
        document.documentElement.style.overflow = rootOverflow;
        document.body.style.overflow = bodyOverflow;
        if (previousFocus instanceof HTMLElement && previousFocus.isConnected) previousFocus.focus({ preventScroll: true });
      };
      if (!rememberHomeInvitation(storage, Date.now())) {
        dialog.close();
        releasePage();
      }
    }

    function onStorage(event: StorageEvent) {
      if (event.key === HOME_INVITATION_KEY && dialog?.open) {
        dialog.close();
        releasePage();
      }
    }
    const timer = window.setTimeout(() => { ready = true; tryOpen(); }, HOME_INVITATION_DELAY_MS);
    dialog.addEventListener("close", releasePage);
    document.addEventListener("visibilitychange", tryOpen);
    window.addEventListener("storage", onStorage);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", tryOpen);
      window.removeEventListener("storage", onStorage);
      dialog.removeEventListener("close", releasePage);
      if (dialog.open) dialog.close();
      releasePage();
      releasePageRef.current = null;
    };
  }, []);

  function close() {
    dialogRef.current?.close();
    releasePageRef.current?.();
  }
  function keepFocus(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;
    const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([disabled])'));
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }
  function handleBackdrop(event: MouseEvent<HTMLDialogElement>) {
    if (event.target !== event.currentTarget) return;
    const rect = event.currentTarget.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close();
  }

  return (
    <dialog ref={dialogRef} aria-labelledby="home-app-prompt-title" aria-describedby="home-app-prompt-description" onClick={handleBackdrop} onKeyDown={keepFocus} onCancel={(event) => { event.preventDefault(); close(); }} className={styles.dialog}>
      <div className="relative">
        <div aria-hidden className={`relative overflow-hidden ${styles.hero}`}>
          <Image src="/images/jaothui-v2-hero-image.png" alt="" fill sizes="440px" className="object-cover object-right" />
          <div className="absolute inset-0 bg-gradient-hero-fade" />
        </div>
        <button type="button" autoFocus onClick={close} aria-label="ปิดคำเชิญดาวน์โหลดแอป" className="absolute right-3 top-3 inline-flex h-11 w-11 items-center justify-center rounded-pill border border-border-soft bg-background text-foreground hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring">
          <FiX aria-hidden className="h-5 w-5" />
        </button>
        <div className="px-6 pb-4 pt-5">
          <p className="text-xs font-semibold tracking-[0.16em] text-accent">JAOTHUI MOBILE</p>
          <h2 id="home-app-prompt-title" className="mt-3 pr-4 text-2xl font-bold leading-snug text-foreground">เจ้าทุย ในมือคุณ</h2>
          <p id="home-app-prompt-description" className="mt-3 text-sm leading-6 text-muted">ค้นหากระบือ ดูพันธุ์ประวัติ และติดตามข่าวสารได้สะดวกขึ้น ดาวน์โหลดได้แล้วทั้ง iPhone และ Android</p>
        </div>
      </div>
      <div className={`px-6 pb-5 pt-2 ${styles.actions}`}>
        <AppDownloadActions mode="automatic" onNavigate={close} />
        <p className="mt-1 text-center text-xs leading-5 text-muted">หรือปิดหน้าต่างนี้ เพื่อใช้งานเว็บไซต์ต่อ</p>
      </div>
    </dialog>
  );
}
