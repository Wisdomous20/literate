"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Mic,
  Volume2,
  Wifi,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  ShieldCheck,
  X,
  ChevronDown,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const MIC_STORAGE_KEY = "literate-selected-mic";

type Status = "checking" | "good" | "warning" | "error";

interface CheckResult {
  status: Status;
  label: string;
  detail: string;
}

interface MicDevice {
  deviceId: string;
  label: string;
}

/** Get the saved mic device ID from localStorage */
export function getSavedMicDeviceId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(MIC_STORAGE_KEY);
  } catch {
    return null;
  }
}

function ReadinessModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [micCheck, setMicCheck] = useState<CheckResult>({
    status: "checking",
    label: "Microphone",
    detail: "Detecting...",
  });
  const [noiseCheck, setNoiseCheck] = useState<CheckResult>({
    status: "checking",
    label: "Noise Level",
    detail: "Analyzing...",
  });
  const [internetCheck, setInternetCheck] = useState<CheckResult>({
    status: "checking",
    label: "Internet",
    detail: "Testing...",
  });
  const [noiseLevel, setNoiseLevel] = useState(0);
  const [availableMics, setAvailableMics] = useState<MicDevice[]>([]);
  const [selectedMicId, setSelectedMicId] = useState<string>("");
  const [micDropdownOpen, setMicDropdownOpen] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const micDropdownRef = useRef<HTMLDivElement>(null);

  const noiseWidthClass =
    noiseLevel <= 0
      ? "w-0"
      : noiseLevel <= 5
        ? "w-[5%]"
        : noiseLevel <= 10
          ? "w-[10%]"
          : noiseLevel <= 15
            ? "w-[15%]"
            : noiseLevel <= 20
              ? "w-[20%]"
              : noiseLevel <= 25
                ? "w-[25%]"
                : noiseLevel <= 30
                  ? "w-[30%]"
                  : noiseLevel <= 35
                    ? "w-[35%]"
                    : noiseLevel <= 40
                      ? "w-[40%]"
                      : noiseLevel <= 45
                        ? "w-[45%]"
                        : noiseLevel <= 50
                          ? "w-1/2"
                          : noiseLevel <= 55
                            ? "w-[55%]"
                            : noiseLevel <= 60
                              ? "w-[60%]"
                              : noiseLevel <= 65
                                ? "w-[65%]"
                                : noiseLevel <= 70
                                  ? "w-[70%]"
                                  : noiseLevel <= 75
                                    ? "w-3/4"
                                    : noiseLevel <= 80
                                      ? "w-[80%]"
                                      : noiseLevel <= 85
                                        ? "w-[85%]"
                                        : noiseLevel <= 90
                                          ? "w-[90%]"
                                          : noiseLevel <= 95
                                            ? "w-[95%]"
                                            : "w-full";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        micDropdownRef.current &&
        !micDropdownRef.current.contains(e.target as Node)
      ) {
        setMicDropdownOpen(false);
      }
    }
    if (micDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [micDropdownOpen]);

  const cleanup = useCallback(() => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close();
      audioCtxRef.current = null;
    }
  }, []);

  const startNoiseMonitoring = useCallback((stream: MediaStream) => {
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close();
    }

    try {
      const audioCtx = new AudioContext();
      audioCtxRef.current = audioCtx;
      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      source.connect(analyser);

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const measureNoise = () => {
        analyser.getByteFrequencyData(dataArray);
        const avg = dataArray.reduce((sum, v) => sum + v, 0) / dataArray.length;
        const level = Math.min(100, Math.round((avg / 128) * 100));
        setNoiseLevel(level);

        if (level < 15) {
          setNoiseCheck({
            status: "good",
            label: "Noise Level",
            detail: "Environment is quiet",
          });
        } else if (level < 40) {
          setNoiseCheck({
            status: "warning",
            label: "Noise Level",
            detail: "Some background noise detected",
          });
        } else {
          setNoiseCheck({
            status: "error",
            label: "Noise Level",
            detail: "Environment is too noisy",
          });
        }

        animFrameRef.current = requestAnimationFrame(measureNoise);
      };
      measureNoise();
    } catch {
      setNoiseCheck({
        status: "warning",
        label: "Noise Level",
        detail: "Unable to analyze noise level",
      });
    }
  }, []);

  const switchMic = useCallback(
    async (deviceId: string) => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }

      setMicCheck({
        status: "checking",
        label: "Microphone",
        detail: "Switching...",
      });
      setNoiseCheck({
        status: "checking",
        label: "Noise Level",
        detail: "Analyzing...",
      });
      setNoiseLevel(0);

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: { exact: deviceId } },
        });
        streamRef.current = stream;
        const deviceLabel = stream.getAudioTracks()[0]?.label || "Microphone";
        setSelectedMicId(deviceId);
        setMicCheck({
          status: "good",
          label: "Microphone",
          detail: deviceLabel,
        });

        try {
          localStorage.setItem(MIC_STORAGE_KEY, deviceId);
        } catch {}

        startNoiseMonitoring(stream);
      } catch {
        setMicCheck({
          status: "error",
          label: "Microphone",
          detail: "Failed to switch microphone",
        });
        setNoiseCheck({
          status: "error",
          label: "Noise Level",
          detail: "Cannot analyze without microphone",
        });
      }
    },
    [startNoiseMonitoring],
  );

  const runChecks = useCallback(async () => {
    setMicCheck({
      status: "checking",
      label: "Microphone",
      detail: "Detecting...",
    });
    setNoiseCheck({
      status: "checking",
      label: "Noise Level",
      detail: "Analyzing...",
    });
    setInternetCheck({
      status: "checking",
      label: "Internet",
      detail: "Testing...",
    });
    setNoiseLevel(0);
    setAvailableMics([]);
    cleanup();

    let stream: MediaStream | null = null;
    const savedDeviceId = getSavedMicDeviceId();

    try {
      const audioConstraints: MediaStreamConstraints["audio"] = savedDeviceId
        ? { deviceId: { ideal: savedDeviceId } }
        : true;

      stream = await navigator.mediaDevices.getUserMedia({
        audio: audioConstraints,
      });
      streamRef.current = stream;

      const activeTrack = stream.getAudioTracks()[0];
      const deviceLabel = activeTrack?.label || "Default microphone";
      const activeDeviceId = activeTrack?.getSettings()?.deviceId || "";
      setSelectedMicId(activeDeviceId);
      setMicCheck({ status: "good", label: "Microphone", detail: deviceLabel });

      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const mics = devices
          .filter((d) => d.kind === "audioinput")
          .map((d, i) => ({
            deviceId: d.deviceId,
            label: d.label || `Microphone ${i + 1}`,
          }));
        setAvailableMics(mics);
      } catch {}
    } catch {
      setMicCheck({
        status: "error",
        label: "Microphone",
        detail: "No microphone detected or access denied",
      });
      setNoiseCheck({
        status: "error",
        label: "Noise Level",
        detail: "Cannot analyze without microphone",
      });
    }

    if (stream) {
      startNoiseMonitoring(stream);
    }

    try {
      const start = performance.now();
      await fetch("/api/auth/session", { method: "HEAD", cache: "no-store" });
      const latency = Math.round(performance.now() - start);

      if (latency < 300) {
        setInternetCheck({
          status: "good",
          label: "Internet",
          detail: `Stable (${latency}ms)`,
        });
      } else if (latency < 800) {
        setInternetCheck({
          status: "warning",
          label: "Internet",
          detail: `Slow connection (${latency}ms)`,
        });
      } else {
        setInternetCheck({
          status: "error",
          label: "Internet",
          detail: `Unstable connection (${latency}ms)`,
        });
      }
    } catch {
      setInternetCheck({
        status: "error",
        label: "Internet",
        detail: "No internet connection",
      });
    }
  }, [cleanup, startNoiseMonitoring]);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        runChecks();
      }, 0);
    } else {
      cleanup();
    }
    return cleanup;
  }, [open, runChecks, cleanup]);

  const allChecks = [micCheck, noiseCheck, internetCheck];
  const isChecking = allChecks.some((c) => c.status === "checking");
  const overallGood = allChecks.every((c) => c.status === "good");
  const hasError = allChecks.some((c) => c.status === "error");

  const statusIcon = (status: Status) => {
    if (status === "checking") {
      return (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#54A4FF] border-t-transparent" />
      );
    }
    if (status === "good")
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (status === "warning")
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const statusIconColorClass = (status: Status) =>
    status === "good"
      ? "text-[#22C55E]"
      : status === "warning"
        ? "text-[#EAB308]"
        : status === "error"
          ? "text-[#EF4444]"
          : "text-[#54A4FF]";

  const checkIcon = (label: string, status: Status) => {
    const colorClass = statusIconColorClass(status);
    if (label === "Microphone")
      return <Mic className={`h-5 w-5 ${colorClass}`} />;
    if (label === "Noise Level")
      return <Volume2 className={`h-5 w-5 ${colorClass}`} />;
    return <Wifi className={`h-5 w-5 ${colorClass}`} />;
  };

  const borderColorClass = (status: Status) =>
    status === "good"
      ? "border-[rgba(34,197,94,0.3)]"
      : status === "warning"
        ? "border-[rgba(234,179,8,0.3)]"
        : status === "error"
          ? "border-[rgba(239,68,68,0.3)]"
          : "border-[rgba(84,164,255,0.3)]";

  const bgColorClass = (status: Status) =>
    status === "good"
      ? "bg-[rgba(34,197,94,0.08)]"
      : status === "warning"
        ? "bg-[rgba(234,179,8,0.08)]"
        : status === "error"
          ? "bg-[rgba(239,68,68,0.08)]"
          : "bg-[rgba(84,164,255,0.08)]";

  const detailColorClass = (status: Status) =>
    status === "good"
      ? "text-[#16A34A]"
      : status === "warning"
        ? "text-[#A16207]"
        : status === "error"
          ? "text-[#DC2626]"
          : "text-[#6B7DB3]";

  const noiseFillColorClass =
    noiseLevel < 15
      ? "bg-[#22C55E]"
      : noiseLevel < 40
        ? "bg-[#EAB308]"
        : "bg-[#EF4444]";

  const overallWrapClass = overallGood
    ? "border border-[rgba(34,197,94,0.2)] bg-[rgba(34,197,94,0.08)]"
    : hasError
      ? "border border-[rgba(239,68,68,0.2)] bg-[rgba(239,68,68,0.08)]"
      : "border border-[rgba(234,179,8,0.2)] bg-[rgba(234,179,8,0.08)]";

  const overallTextClass = overallGood
    ? "text-[#16A34A]"
    : hasError
      ? "text-[#DC2626]"
      : "text-[#A16207]";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold text-[#0C1A6D]">
            <ShieldCheck className="h-5 w-5 text-[#6666FF]" />
            {isChecking ? "Checking Readiness..." : "Readiness Check"}
          </DialogTitle>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 transition-opacity hover:opacity-100"
          >
            <X className="h-4 w-4 text-[#0C1A6D]" />
            <span className="sr-only">Close</span>
          </button>
        </DialogHeader>

        <div className="flex flex-col gap-3 py-2">
          {allChecks.map((check) => (
            <div key={check.label}>
              <div
                className={`flex items-center gap-3 border px-4 py-3 ${
                  check.label === "Microphone" && availableMics.length > 1
                    ? "rounded-t-xl rounded-b-none"
                    : "rounded-xl"
                } ${bgColorClass(check.status)} ${borderColorClass(check.status)}`}
              >
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${bgColorClass(check.status)}`}
                >
                  {checkIcon(check.label, check.status)}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-[#0C1A6D]">
                      {check.label}
                    </span>
                    {statusIcon(check.status)}
                  </div>
                  <p
                    className={`mt-0.5 text-xs ${detailColorClass(check.status)}`}
                  >
                    {check.detail}
                  </p>
                </div>

                {check.label === "Noise Level" &&
                  check.status !== "checking" &&
                  check.status !== "error" && (
                    <div className="w-16 shrink-0">
                      <div className="h-2 w-full overflow-hidden rounded-full bg-[rgba(84,164,255,0.15)]">
                        <div
                          className={`h-full rounded-full transition-all duration-200 ${noiseFillColorClass} ${noiseWidthClass}`}
                        />
                      </div>
                      <span className="mt-0.5 block text-center text-[9px] font-medium text-[#6B7DB3]">
                        {noiseLevel}%
                      </span>
                    </div>
                  )}
              </div>

              {check.label === "Microphone" && availableMics.length > 1 && (
                <div
                  className={`relative rounded-b-xl border-x border-b px-4 pb-3 ${bgColorClass(micCheck.status)} ${borderColorClass(micCheck.status)}`}
                  ref={micDropdownRef}
                >
                  <button
                    type="button"
                    onClick={() => setMicDropdownOpen(!micDropdownOpen)}
                    className="flex w-full items-center justify-between rounded-lg border border-[rgba(84,164,255,0.25)] bg-[rgba(84,164,255,0.1)] px-3 py-2 text-xs font-medium text-[#0C1A6D] transition-colors hover:opacity-80"
                  >
                    <span className="truncate">
                      {availableMics.find((m) => m.deviceId === selectedMicId)
                        ?.label || "Select microphone"}
                    </span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 shrink-0 text-[#54A4FF] transition-transform ${
                        micDropdownOpen ? "rotate-180" : "rotate-0"
                      }`}
                    />
                  </button>

                  {micDropdownOpen && (
                    <div className="absolute left-4 right-4 z-10 mt-1 overflow-hidden rounded-lg border border-[rgba(84,164,255,0.25)] bg-white shadow-lg">
                      {availableMics.map((mic) => (
                        <button
                          key={mic.deviceId}
                          type="button"
                          onClick={() => {
                            setMicDropdownOpen(false);
                            if (mic.deviceId !== selectedMicId) {
                              switchMic(mic.deviceId);
                            }
                          }}
                          className={`flex w-full items-center gap-2 border-b border-[rgba(84,164,255,0.1)] px-3 py-2.5 text-left text-xs transition-colors hover:bg-[rgba(84,164,255,0.08)] ${
                            mic.deviceId === selectedMicId
                              ? "font-semibold text-[#6666FF]"
                              : "font-normal text-[#0C1A6D]"
                          }`}
                        >
                          <Mic
                            className={`h-3.5 w-3.5 shrink-0 ${
                              mic.deviceId === selectedMicId
                                ? "text-[#6666FF]"
                                : "text-[#9CA3AF]"
                            }`}
                          />
                          <span className="truncate">{mic.label}</span>
                          {mic.deviceId === selectedMicId && (
                            <CheckCircle className="ml-auto h-3.5 w-3.5 shrink-0 text-[#6666FF]" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {!isChecking && (
          <div
            className={`rounded-lg px-4 py-2.5 text-center ${overallWrapClass}`}
          >
            <span className={`text-xs font-semibold ${overallTextClass}`}>
              {overallGood
                ? "✓ All systems ready — you're good to start!"
                : hasError
                  ? "✗ Some issues detected — please resolve before starting"
                  : "⚠ Minor issues — recording quality may be affected"}
            </span>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-1.5 rounded-lg border border-[rgba(102,102,255,0.25)] bg-[rgba(102,102,255,0.1)] px-4 py-2 text-xs font-semibold text-[#6666FF] transition-colors hover:opacity-90"
          >
            Close
          </button>
          <button
            type="button"
            onClick={runChecks}
            className="flex items-center gap-1.5 rounded-lg bg-[#6666FF] px-4 py-2 text-xs font-semibold text-white transition-colors hover:opacity-90"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Recheck
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ReadinessCheckButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-[rgba(102,102,255,0.25)] bg-[rgba(102,102,255,0.12)] px-3 py-1.5 text-xs font-semibold text-[#6666FF] transition-colors hover:opacity-80"
      >
        <ShieldCheck className="h-3.5 w-3.5" />
        Readiness Check
      </button>

      <ReadinessModal open={isOpen} onOpenChange={setIsOpen} />
    </>
  );
}
