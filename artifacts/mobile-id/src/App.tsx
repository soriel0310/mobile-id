import { useState, useEffect, useRef } from "react";
import { Menu, Bell, ScanLine, ScanQrCode, X, HelpCircle, ChevronRight, Clock } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import portraitImg from "./assets/portrait.png";
import bgImg from "@assets/4340b262-fc7f-436e-9d27-35753c067fee_1777482164606.jpg";
import sealImg from "@assets/다운로드_1777483467452.png";
import licenseImg from "@assets/lasr_1777494470899.png";

export default function App() {
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [qrCountdown, setQrCountdown] = useState(30);
  const [qrToken, setQrToken] = useState(() => Date.now());
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [showBackPanel, setShowBackPanel] = useState(false);
  const [now, setNow] = useState(() => new Date());

  const readSavedScale = (key: string, fallback: number) => {
    if (typeof window === "undefined") return fallback;
    const saved =
      window.localStorage.getItem(key) ??
      window.localStorage.getItem("mobileId.licenseScale");
    const parsed = saved ? parseFloat(saved) : NaN;
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const [licenseScaleW, setLicenseScaleW] = useState<number>(() =>
    readSavedScale("mobileId.licenseScaleW", 1)
  );
  const [licenseScaleH, setLicenseScaleH] = useState<number>(() =>
    readSavedScale("mobileId.licenseScaleH", 1)
  );
  const [isEditMode, setIsEditMode] = useState(false);
  const [showAddIdToast, setShowAddIdToast] = useState(false);
  const addIdToastTimerRef = useRef<number | null>(null);
  const tapTimesRef = useRef<number[]>([]);
  const licenseDragRef = useRef<{
    startX: number;
    startY: number;
    startW: number;
    startH: number;
  } | null>(null);

  const clampScale = (value: number) => Math.min(2, Math.max(0.5, value));

  const saveLicenseScale = (w: number, h: number) => {
    try {
      window.localStorage.setItem("mobileId.licenseScaleW", String(w));
      window.localStorage.setItem("mobileId.licenseScaleH", String(h));
    } catch {}
  };

  const handleLicensePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isEditMode) return;
    e.preventDefault();
    e.stopPropagation();

    licenseDragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startW: licenseScaleW,
      startH: licenseScaleH,
    };

    e.currentTarget.setPointerCapture?.(e.pointerId);
  };

  const handleLicensePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isEditMode || !licenseDragRef.current) return;
    e.preventDefault();
    e.stopPropagation();

    const dx = e.clientX - licenseDragRef.current.startX;
    const dy = e.clientY - licenseDragRef.current.startY;

    const nextW = clampScale(licenseDragRef.current.startW + dx / 180);
    const nextH = clampScale(licenseDragRef.current.startH + dy / 180);

    setLicenseScaleW(nextW);
    setLicenseScaleH(nextH);
  };

  const handleLicensePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isEditMode) return;
    e.preventDefault();
    e.stopPropagation();

    licenseDragRef.current = null;
    saveLicenseScale(licenseScaleW, licenseScaleH);
  };

  const handleLegalTap = () => {
    const nowMs = Date.now();
    tapTimesRef.current = [...tapTimesRef.current, nowMs].filter(
      (t) => nowMs - t < 1200
    );
    if (tapTimesRef.current.length >= 3) {
      tapTimesRef.current = [];
      setIsEditMode((prev) => {
        const next = !prev;
        if (!next) {
          try {
            window.localStorage.setItem(
              "mobileId.licenseScaleW",
              String(licenseScaleW)
            );
            window.localStorage.setItem(
              "mobileId.licenseScaleH",
              String(licenseScaleH)
            );
          } catch {}
        }
        return next;
      });
    }
  };

  useEffect(() => {
    if (isCardFlipped) {
      const t = setTimeout(() => setShowBackPanel(true), 700);
      return () => clearTimeout(t);
    }
    setShowBackPanel(false);
  }, [isCardFlipped]);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const formatNow = (d: Date) => {
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  useEffect(() => {
    const tick = setInterval(() => {
      setQrCountdown((prev) => (prev <= 1 ? 30 : prev - 1));
    }, 1000);

    const refresh = setInterval(() => {
      setQrToken(Date.now());
    }, 30000);

    return () => {
      clearInterval(tick);
      clearInterval(refresh);
    };
  }, []);

  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState(false);

  useEffect(() => {
    if (isCameraModalOpen) {
      setCameraError(false);
      navigator.mediaDevices
        .getUserMedia({ video: { facingMode: "environment" } })
        .then((stream) => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(() => {
          setCameraError(true);
        });
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach((track) => track.stop());
      }
    }
  }, [isCameraModalOpen]);

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center bg-zinc-200"
      style={{
        backgroundImage: `url(${bgImg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div
        className="w-full max-w-[430px] h-[100dvh] sm:h-[850px] sm:rounded-[40px] sm:shadow-2xl relative overflow-hidden font-sans"
        style={{
          backgroundImage: `url(${bgImg})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* Top Header */}
        <div className="absolute top-0 w-full h-16 flex items-center justify-between px-6 z-20 text-[#1e293b]">
          <button className="p-2 -ml-2 active:scale-95 transition-transform">
            <Menu className="w-6 h-6" strokeWidth={2} />
          </button>
          <h1 className="text-[17px] font-bold tracking-tight text-[#1e293b]">모바일 신분증</h1>
          <button className="p-2 -mr-2 active:scale-95 transition-transform">
            <Bell className="w-6 h-6" strokeWidth={2} />
          </button>
        </div>

        {/* Info row above card — only visible when card is flipped to back */}
        <div
          className={`absolute left-7 right-7 z-20 flex items-center justify-between text-[12px] text-gray-700 transition-opacity duration-300 ${
            isCardFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          style={{
            top: 'clamp(78px, calc((100dvh - 568px) / 2 - 32px), 115px)',
          }}
        >
          <button
            onClick={handleLegalTap}
            className="flex items-center gap-1.5 active:scale-95 transition-transform"
          >
            <HelpCircle className="w-3.5 h-3.5 text-gray-700" strokeWidth={2.5} />
            <span className="font-medium">법적 효력</span>
            <ChevronRight className="w-3 h-3 text-gray-400 -ml-0.5" strokeWidth={2.5} />
            {isEditMode && (
              <span className="ml-1 px-1.5 py-0.5 text-[9px] font-bold text-white bg-blue-500 rounded-full">
                편집중
              </span>
            )}
          </button>
          <button className="flex items-center gap-1.5 active:scale-95 transition-transform">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            <span className="font-medium">흔들기 설정</span>
          </button>
        </div>

        {/* Black backing card — slides out from the left after the card finishes flipping */}
        <div
          className={`absolute left-10 right-10 z-10 pointer-events-none transition-transform duration-500 ${
            showBackPanel ? 'translate-x-3.5' : 'translate-x-0'
          }`}
          style={{
            top: 'clamp(116px, calc((100dvh - 568px) / 2 + 32px), 147px)',
            height: 'min(480px, calc(100dvh - 232px))',
          }}
        >
          <div
            className={`absolute top-0 bottom-0 -left-7 right-0 rounded-[28px] bg-zinc-900 shadow-2xl transition-all duration-500 overflow-hidden ${
              showBackPanel ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-7'
            }`}
          >
            <div
              className="absolute top-1/2 left-3.5"
              style={{ transform: 'translate(-50%, -50%) rotate(90deg)', transformOrigin: 'center' }}
            >
              <div className="flex items-center gap-2 whitespace-nowrap text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                <span className="text-white font-semibold tracking-tight">온라인 상태</span>
                <span className="text-gray-400 tabular-nums tracking-tight">{formatNow(now)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ID Card (flippable) */}
        <div
          className={`absolute left-10 right-10 z-20 card-flip-container animate-in fade-in slide-in-from-bottom-8 duration-700 cursor-pointer transition-transform ease-out ${
            showBackPanel ? 'translate-x-3.5' : 'translate-x-0'
          }`}
          style={{
            transitionDuration: '500ms',
            top: 'clamp(116px, calc((100dvh - 568px) / 2 + 32px), 147px)',
            height: 'min(480px, calc(100dvh - 232px))',
          }}
          onClick={() => {
            if (isEditMode) return;
            setIsCardFlipped((v) => !v);
          }}
        >
          <div className={`card-flip-inner ${isCardFlipped ? 'is-flipped' : ''}`}>
            {/* FRONT FACE */}
            <div className="card-face card-face-front shadow-2xl glass-card p-7 flex flex-col justify-between" style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.15) 100%)',
              border: '1px solid rgba(255,255,255,0.5)',
            }}>
              <div className="absolute inset-0 bg-gradient-to-br from-blue-100/30 to-purple-100/10 pointer-events-none mix-blend-overlay"></div>

              <div className="relative z-10 flex flex-col h-full items-center text-center">
                <div className="pt-1">
                  <h2 className="text-[20px] font-bold text-gray-900 tracking-tight">자동차운전면허증</h2>
                  <p className="text-gray-500 text-[12px] font-medium mt-0.5 tracking-wide">Driver's License</p>
                </div>

                <div className="mt-5 w-[120px] h-[150px] rounded-[6px] overflow-hidden shadow-md border border-white/80 relative bg-white">
                  <img src={portraitImg} alt="유은찬" className="w-full h-full object-cover" />
                </div>

                <h3 className="mt-5 text-[30px] font-extrabold text-gray-900" style={{ letterSpacing: '0.25em', paddingLeft: '0.25em' }}>
                  유은찬
                </h3>

                <div className="mt-6 flex items-center justify-center gap-1.5 text-[14px]">
                  <span className="text-gray-700 font-bold">생년월일</span>
                  <span className="text-gray-300">|</span>
                  <span className="text-gray-900 font-bold">2006.03.10</span>
                </div>

                <div className="mt-auto pt-4 flex items-center justify-center">
                  <div className="relative inline-block">
                    <span className="relative z-10 text-[13px] font-semibold text-gray-700 tracking-tight">인천광역시경찰청장</span>
                    <img
                      src={sealImg}
                      alt="직인"
                      className="absolute -right-1 -top-1 w-6 h-6 z-20 opacity-90 pointer-events-none mix-blend-multiply"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* BACK FACE - rotated license image */}
            <div className="card-face card-face-back shadow-2xl bg-white overflow-hidden relative">
              <div
                className="license-frame"
                onPointerDown={handleLicensePointerDown}
                onPointerMove={handleLicensePointerMove}
                onPointerUp={handleLicensePointerUp}
                onPointerCancel={handleLicensePointerUp}
                onClick={(e) => e.stopPropagation()}
                style={{
                  ['--license-scale-w' as string]: licenseScaleW,
                  ['--license-scale-h' as string]: licenseScaleH,
                  touchAction: isEditMode ? "none" : "auto",
                  cursor: isEditMode ? "grab" : "pointer",
                }}
              >
                <img
                  src={licenseImg}
                  alt="운전면허증"
                  className="license-fit max-w-none"
                />
              </div>
              <div className="holo-shine" />

              {isEditMode && (
                <div
                  className="absolute top-3 left-3 right-3 z-30 bg-black/80 text-white rounded-2xl px-4 py-3 backdrop-blur-md shadow-xl space-y-2.5"
                  onClick={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  onPointerMove={(e) => e.stopPropagation()}
                  style={{ touchAction: "auto" }}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold tracking-wide uppercase text-blue-300">
                      편집 모드
                    </span>
                    <button
                      onClick={() => {
                        setLicenseScaleW(1);
                        setLicenseScaleH(1);
                      }}
                      className="text-[10px] text-gray-300 underline underline-offset-2"
                    >
                      초기화
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-300 w-6">가로</span>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.01"
                      value={licenseScaleW}
                      onChange={(e) =>
                        setLicenseScaleW(parseFloat(e.target.value))
                      }
                      onClick={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                      onPointerMove={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      style={{ touchAction: "auto" }}
                      className="flex-1 accent-blue-400"
                    />
                    <span className="text-[10px] font-bold tabular-nums w-9 text-right">
                      {licenseScaleW.toFixed(2)}x
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-300 w-6">세로</span>
                    <input
                      type="range"
                      min="0.5"
                      max="2"
                      step="0.01"
                      value={licenseScaleH}
                      onChange={(e) =>
                        setLicenseScaleH(parseFloat(e.target.value))
                      }
                      onClick={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                      onPointerMove={(e) => e.stopPropagation()}
                      onTouchStart={(e) => e.stopPropagation()}
                      style={{ touchAction: "auto" }}
                      className="flex-1 accent-blue-400"
                    />
                    <span className="text-[10px] font-bold tabular-nums w-9 text-right">
                      {licenseScaleH.toFixed(2)}x
                    </span>
                  </div>

                  <p className="text-[10px] text-gray-300 text-center pt-0.5">
                    "법적 효력"을 빠르게 3번 누르면 저장됩니다
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <div className={`relative flex items-stretch bg-white/95 backdrop-blur-xl shadow-[0_-4px_20px_rgb(0,0,0,0.06)] border-t border-white/60 py-4 transition-[border-radius] duration-200 ${
            isQrModalOpen ? 'rounded-t-none' : 'rounded-t-[28px]'
          }`}>
            <button
              onClick={() => setIsQrModalOpen((v) => !v)}
              className="flex-1 h-14 flex items-center justify-center gap-3 active:bg-gray-50 transition-all"
            >
              <ScanQrCode className="w-6 h-6 text-[#3b82f6]" strokeWidth={2} />
              <span className="font-bold text-[17px] text-gray-800">나의 QR</span>
            </button>

            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-8 bg-gray-200" />

            <button
              type="button"
              disabled
              className="flex-1 h-14 flex items-center justify-center gap-3 opacity-100"
            >
              <ScanLine className="w-6 h-6 text-[#3b82f6]" strokeWidth={2} />
              <span className="font-bold text-[17px] text-gray-800">QR 촬영</span>
            </button>
          </div>
        </div>

        {/* QR Bottom Sheet — slides up from above the action bar */}
        {/* Backdrop (above card, below action bar) */}
        <div
          onClick={() => setIsQrModalOpen(false)}
          className={`absolute top-0 left-0 right-0 z-30 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${
            isQrModalOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          style={{ bottom: '88px' }}
        />

        {/* Decorative "신분증 추가" pill — appears when card is flipped to back face */}
        <div
          className={`absolute left-0 right-0 z-30 flex justify-center transition-opacity duration-300 ${
            isCardFlipped ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          style={{ bottom: 'calc(88px + 72px)' }}
        >
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (addIdToastTimerRef.current) {
                window.clearTimeout(addIdToastTimerRef.current);
              }
              setShowAddIdToast(true);
              addIdToastTimerRef.current = window.setTimeout(() => {
                setShowAddIdToast(false);
                addIdToastTimerRef.current = null;
              }, 3000);
            }}
            className="inline-flex items-center gap-2 bg-white rounded-full pl-1.5 pr-4 py-1.5 shadow-lg border border-black/5 active:scale-95 transition-transform"
          >
            <span className="w-6 h-6 rounded-full bg-yellow-400 flex items-center justify-center">
              <span className="text-black font-black text-[15px] leading-none -mt-0.5">!</span>
            </span>
            <span className="text-[13px] font-semibold text-gray-800">신분증 추가</span>
          </button>
        </div>

        {/* Input-blocking overlay while toast is visible */}
        {showAddIdToast && (
          <div
            className="absolute inset-0 z-[55]"
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          />
        )}

        {/* Toast popup — "신분증 추가" 안내 */}
        <div
          className={`absolute left-1/2 -translate-x-1/2 z-[60] pointer-events-none transition-all duration-200 ${
            showAddIdToast
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-2'
          }`}
          style={{ bottom: 'calc(50% - 24px)' }}
        >
          <div className="bg-black/85 text-white text-[13px] font-medium rounded-xl px-4 py-3 shadow-2xl backdrop-blur-md whitespace-nowrap">
            모바일 신분증 콜센터(1688-0990)로 문의
          </div>
        </div>

        {/* Sheet */}
        <div
          className="absolute left-0 right-0 z-40 bg-white rounded-t-[28px] shadow-[0_-12px_40px_rgba(0,0,0,0.18)] transition-transform duration-300 ease-out"
          style={{
            bottom: '88px',
            transform: isQrModalOpen ? 'translateY(0)' : 'translateY(calc(100% + 88px))',
          }}
        >
          <div className="flex items-center px-6 py-5 gap-4">
            {/* Left: timer */}
            <div className="flex-shrink min-w-0 pr-1">
              <div className="flex items-center gap-1 mb-1 text-gray-500">
                <Clock className="w-3.5 h-3.5" strokeWidth={2.2} />
                <p className="text-[12px] font-medium">남은 시간</p>
              </div>
              <p className="text-[22px] font-extrabold text-blue-600 tabular-nums leading-none">
                {qrCountdown}초
              </p>
              <p className="text-[11px] text-gray-400 leading-snug mt-2">
                운전자격외 정보는 검증자에게 제공되지 않습니다.<br />
                운전면허 상세정보는 가급적 본인만 확인하세요.
              </p>
            </div>

            {/* Right: QR */}
            <div className="ml-auto p-2 bg-white rounded-xl border border-gray-100">
              <QRCodeSVG value={`M-ID:YUEUNCHAN:${qrToken}`} size={140} level="H" fgColor="#111" />
            </div>
          </div>
        </div>
        {/* Camera Modal */}
        {isCameraModalOpen && (
          <div className="absolute inset-0 z-50 bg-black animate-in fade-in flex flex-col">
            <div className="absolute top-0 w-full h-24 bg-gradient-to-b from-black/80 to-transparent z-10 flex items-start justify-end p-6">
              <button
                onClick={() => setIsCameraModalOpen(false)}
                className="p-3 bg-white/20 backdrop-blur-md rounded-full text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 relative overflow-hidden flex items-center justify-center">
              {cameraError ? (
                <div className="text-white text-center p-8 z-10">
                  <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
                    <ScanLine className="w-8 h-8 text-white/50" />
                  </div>
                  <p className="text-lg font-medium mb-2">카메라에 접근할 수 없습니다.</p>
                  <p className="text-sm text-white/60">브라우저 설정에서 카메라 권한을 허용해주세요.</p>
                </div>
              ) : (
                <video ref={videoRef} autoPlay playsInline className="absolute inset-0 w-full h-full object-cover opacity-80" />
              )}

              {!cameraError && (
                <div className="absolute inset-0 pointer-events-none z-10 flex flex-col items-center justify-center">
                  <p className="text-white text-base font-medium mb-8 bg-black/40 px-6 py-3 rounded-full backdrop-blur-md">
                    QR코드를 사각형 안에 비춰주세요
                  </p>
                  <div className="w-[280px] h-[280px] border-[3px] border-white/60 rounded-3xl relative">
                    <div className="absolute -top-[3px] -left-[3px] w-10 h-10 border-t-[5px] border-l-[5px] border-[#3b82f6] rounded-tl-3xl"></div>
                    <div className="absolute -top-[3px] -right-[3px] w-10 h-10 border-t-[5px] border-r-[5px] border-[#3b82f6] rounded-tr-3xl"></div>
                    <div className="absolute -bottom-[3px] -left-[3px] w-10 h-10 border-b-[5px] border-l-[5px] border-[#3b82f6] rounded-bl-3xl"></div>
                    <div className="absolute -bottom-[3px] -right-[3px] w-10 h-10 border-b-[5px] border-r-[5px] border-[#3b82f6] rounded-br-3xl"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
