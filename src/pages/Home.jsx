import React, { useEffect, useRef, useState, useCallback } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";

export default function Home() {
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const decodeActiveRef = useRef(false);

  const lastHandledRef = useRef(null); // last handled ID
  const ignoreUntilRef = useRef(0); // timestamp until which we ignore repeated scans
  const fetchAbortRef = useRef(null); // for QR fetch
  const isProcessingRef = useRef(false);

  // phone modal abort controller
  const phoneFetchAbortRef = useRef(null);

  const [scannedId, setScannedId] = useState(null);
  const [showScanModal, setShowScanModal] = useState(false);

  const [loading, setLoading] = useState(false);
  const [details, setDetails] = useState(null);
  const [error, setError] = useState(null);

  // Phone modal state
  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneDetails, setPhoneDetails] = useState(null);
  const [phoneError, setPhoneError] = useState(null);

  // cooldown (ms) after handling a code or closing the modal to ignore same scans
  const COOLDOWN_MS = 3500;

  // ---------- QR fetch ----------
  const fetchDetails = useCallback(async (id) => {
    if (fetchAbortRef.current) {
      fetchAbortRef.current.abort();
      fetchAbortRef.current = null;
    }
    const controller = new AbortController();
    fetchAbortRef.current = controller;
    setLoading(true);
    setError(null);
    setDetails(null);
    isProcessingRef.current = true;

    try {
      const res = await fetch(`/api/qr/${encodeURIComponent(id)}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => null);
        throw new Error(txt || `Server returned ${res.status}`);
      }
      const json = await res.json();
      setDetails(json);
    } catch (err) {
      if (err?.name === "AbortError") {
        console.log("QR fetch aborted for id:", id);
      } else {
        console.error("QR fetch error:", err);
        setError(err?.message || "Failed to fetch details");
      }
    } finally {
      setLoading(false);
      isProcessingRef.current = false;
      fetchAbortRef.current = null;
    }
  }, []);

  // ---------- Phone fetch ----------
  const fetchDetailsByPhone = useCallback(async (phone) => {
    // abort previous phone request
    if (phoneFetchAbortRef.current) {
      phoneFetchAbortRef.current.abort();
      phoneFetchAbortRef.current = null;
    }
    const controller = new AbortController();
    phoneFetchAbortRef.current = controller;

    setPhoneLoading(true);
    setPhoneError(null);
    setPhoneDetails(null);

    try {
      // adjust endpoint to your backend contract if needed
      const res = await fetch(`/api/phone/${encodeURIComponent(phone)}`, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => null);
        throw new Error(txt || `Server returned ${res.status}`);
      }
      const json = await res.json();
      setPhoneDetails(json);
    } catch (err) {
      if (err?.name === "AbortError") {
        console.log("Phone fetch aborted for:", phone);
      } else {
        console.error("Phone fetch error:", err);
        setPhoneError(err?.message || "Failed to fetch details by phone");
      }
    } finally {
      setPhoneLoading(false);
      phoneFetchAbortRef.current = null;
    }
  }, []);

  // stop scanner and camera
  const stopScanner = useCallback(() => {
    decodeActiveRef.current = false;
    const codeReader = codeReaderRef.current;
    if (codeReader) {
      try {
        codeReader.reset();
      } catch (e) {
        // ignore
      }
    }
    const video = videoRef.current;
    if (video && video.srcObject) {
      const tracks = video.srcObject.getTracks();
      tracks.forEach((t) => {
        try {
          t.stop();
        } catch (e) {}
      });
      try {
        video.srcObject = null;
      } catch (e) {}
    }
  }, []);

  // handle scanned payload
  const handleScanned = useCallback(
    (data) => {
      if (!data) return;
      const id = String(data).trim();
      if (!id) return;

      const now = Date.now();

      // If global cooldown active, ignore
      if (now < ignoreUntilRef.current) {
        return;
      }

      // If currently processing another code, ignore
      if (isProcessingRef.current) return;

      // If same id was just handled and not past cooldown, ignore
      if (lastHandledRef.current === id && now < (ignoreUntilRef.current || 0)) {
        return;
      }

      // We accept this id
      lastHandledRef.current = id;
      // set a short cooldown to prevent immediate re-handles
      ignoreUntilRef.current = now + COOLDOWN_MS;

      setScannedId(id);
      setShowScanModal(true);
      setDetails(null);
      setError(null);

      // stop scanner immediately to avoid multiple captures
      stopScanner();

      // call backend
      fetchDetails(id);
    },
    [fetchDetails, stopScanner]
  );

  const startScanner = useCallback(async () => {
    if (decodeActiveRef.current) return;
    decodeActiveRef.current = true;
    if (!codeReaderRef.current) codeReaderRef.current = new BrowserMultiFormatReader();
    const codeReader = codeReaderRef.current;

    const tryStart = async () => {
      const constraints = { video: { facingMode: { exact: "environment" } } };
      try {
        await codeReader.decodeFromConstraints(constraints, videoRef.current, (result) => {
          if (result) handleScanned(result.getText());
        });
      } catch (e) {
        try {
          await codeReader.decodeFromVideoDevice(undefined, videoRef.current, (result) => {
            if (result) handleScanned(result.getText());
          });
        } catch (err) {
          console.error("Camera start failed:", err);
          setError("Unable to access camera. Please allow camera permission or use a different device.");
          decodeActiveRef.current = false;
        }
      }
    };

    await tryStart();
  }, [handleScanned]);

  // mount: start scanner
  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
      if (fetchAbortRef.current) {
        fetchAbortRef.current.abort();
        fetchAbortRef.current = null;
      }
      if (phoneFetchAbortRef.current) {
        phoneFetchAbortRef.current.abort();
        phoneFetchAbortRef.current = null;
      }
    };
  }, [startScanner, stopScanner]);

  // close scan modal: abort fetch, stop camera and reload page (resets scanner & state)
  const closeScanModal = useCallback(() => {
    if (fetchAbortRef.current) {
      try {
        fetchAbortRef.current.abort();
      } catch (e) {
        /* ignore */
      }
      fetchAbortRef.current = null;
    }

    try {
      stopScanner();
    } catch (e) {
      /* ignore */
    }

    // reload to reset everything (scanner, state)
    window.location.reload();
  }, [stopScanner]);

  // phone modal open/close
  const openPhoneModal = () => {
    setPhoneModalOpen(true);
    // stop scanner so camera doesn't keep running in background
    stopScanner();
  };
  const closePhoneModal = () => {
    // abort any in-flight phone fetch
    if (phoneFetchAbortRef.current) {
      try {
        phoneFetchAbortRef.current.abort();
      } catch (e) {
        /* ignore */
      }
      phoneFetchAbortRef.current = null;
    }
    setPhoneModalOpen(false);
    setPhoneInput("");
    setPhoneDetails(null);
    setPhoneError(null);
    setPhoneLoading(false);

    // restart scanner after closing phone modal
    // small timeout to avoid immediate re-scan of same QR
    setTimeout(() => startScanner(), 300);
  };

  // phone submit handler
  const handlePhoneSubmit = async (e) => {
    e?.preventDefault();
    setPhoneDetails(null);
    setPhoneError(null);

    const trimmed = (phoneInput || "").replace(/\s+/g, "");
    // basic validation: digits and + allowed, length 6-15
    const ok = /^[+\d][\d]{5,14}$/.test(trimmed);
    if (!ok) {
      setPhoneError("Enter a valid phone number (6–15 digits, optional leading +).");
      return;
    }

    // call API
    await fetchDetailsByPhone(trimmed);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gray-50 p-6">
      <h1 className="text-2xl font-semibold mb-4">Scan QR to check in</h1>

      {!showScanModal && !phoneModalOpen && (
        <div className="w-full max-w-md bg-white rounded-xl shadow p-4">
          <div className="rounded overflow-hidden">
            <video ref={videoRef} style={{ width: "100%", height: "auto" }} muted playsInline autoPlay />
          </div>

          <div className="mt-4 flex justify-center gap-2">
            <button
              onClick={openPhoneModal}
              style={{ color: "white", backgroundColor: "#4F46E5" }}
              className="px-6 py-3 rounded-lg shadow hover:opacity-90 focus:outline-none"
            >
              Use Phone
            </button>

          </div>

          <div className="mt-3 text-sm text-gray-600 text-center">
            {error && <span className="text-red-600">Error: {error}</span>}
            {!error && !scannedId && <span>Point camera at QR code to scan.</span>}
            {!error && scannedId && !loading && !details && <span>Scanned ID: {scannedId}</span>}
          </div>
        </div>
      )}

      {/* Scan Modal (opened after a scan) */}
      {showScanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" role="dialog" aria-modal="true">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-semibold">Check-in details</h2>
              <button onClick={closeScanModal} className="text-gray-500 hover:text-gray-800" aria-label="Close">
                ✕
              </button>
            </div>

            <div className="mt-4">
              <div className="text-sm text-gray-600">
                <strong>Scanned ID:</strong> {scannedId || "—"}
              </div>

              {loading && <div className="mt-4">Loading details…</div>}
              {error && <div className="mt-4 text-red-600">Failed to load details: {error}</div>}

              {details && (
                <div className="mt-4 space-y-2 text-sm">
                  <div><strong>Name:</strong> {details.name || "—"}</div>
                  <div><strong>Type:</strong> {details.type || "—"}</div>
                  <div><strong>Checked in at:</strong> {details.checkedAt || "—"}</div>
                  <div><strong>Raw response:</strong></div>
                  <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">{JSON.stringify(details, null, 2)}</pre>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button onClick={closeScanModal} className="px-4 py-2 rounded border">Close</button>
              <button
                onClick={() => {
                  // Example confirm action: implement POST to /api/qr/:id/checkin
                  alert("Confirm action (implement as needed).");
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Phone Modal */}
      {phoneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" role="dialog" aria-modal="true">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-semibold">Lookup by Phone</h2>
              <button onClick={closePhoneModal} className="text-gray-500 hover:text-gray-800" aria-label="Close">
                ✕
              </button>
            </div>

            <form onSubmit={handlePhoneSubmit} className="mt-4">
              <label className="block text-sm text-gray-700 mb-2">Phone number</label>
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="+911234567890 or 9876543210"
                className="w-full border rounded px-3 py-2"
                autoFocus
              />

              <div className="mt-4 flex justify-end gap-2">
                <button type="button" onClick={closePhoneModal} className="px-4 py-2 rounded border">Close</button>
                <button type="submit" disabled={phoneLoading} className="px-4 py-2 bg-indigo-600 text-white rounded">
                  {phoneLoading ? "Searching..." : "Search"}
                </button>
              </div>
            </form>

            <div className="mt-4">
              {phoneError && <div className="text-red-600">{phoneError}</div>}

              {phoneDetails && (
                <div className="mt-3 text-sm space-y-2">
                  <div><strong>Name:</strong> {phoneDetails.name || "—"}</div>
                  <div><strong>Type:</strong> {phoneDetails.type || "—"}</div>
                  <div><strong>Last seen:</strong> {phoneDetails.lastSeen || "—"}</div>
                  <div className="mt-2"><strong>Raw:</strong></div>
                  <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">{JSON.stringify(phoneDetails, null, 2)}</pre>

                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      onClick={() => {
                        // Example: confirm check-in by phone; implement POST if needed
                        alert("Confirm by phone (implement as needed).");
                      }}
                      className="px-4 py-2 bg-indigo-600 text-white rounded"
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
