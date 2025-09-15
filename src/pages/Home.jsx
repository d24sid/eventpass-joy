import React, { useEffect, useRef, useState, useCallback } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { getById, getByPhone, updateById } from "../service";

export default function Home() {
  // refs & state
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const decodeActiveRef = useRef(false);

  const lastHandledRef = useRef(null);
  const ignoreUntilRef = useRef(0);
  const fetchAbortRef = useRef(null);
  const isProcessingRef = useRef(false);

  const phoneFetchAbortRef = useRef(null);

  const [scannedId, setScannedId] = useState(null);
  const [showScanModal, setShowScanModal] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [phoneModalOpen, setPhoneModalOpen] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneLoading, setPhoneLoading] = useState(false);
  const [phoneDetails, setPhoneDetails] = useState(null);
  const [phoneError, setPhoneError] = useState(null);

  const COOLDOWN_MS = 35000;

  // ----- styles (inline) -----
  const s = {
    page: {
      minHeight: "100vh",
      display: "flex",
      alignItems: "flex-start",
      justifyContent: "center",
      background: "#f3f4f6",
      padding: 16,
    },
    container: { width: "100%", maxWidth: 920, margin: "0 auto" },
    card: {
      background: "#fff",
      borderRadius: 12,
      boxShadow: "0 6px 18px rgba(0,0,0,0.08)",
      padding: 20,
    },
    videoWrap: { borderRadius: 8, overflow: "hidden", background: "#000" },
    video: {
      width: "100%",
      height: "auto",
      display: "block",
      background: "#000",
    },
    controls: { marginTop: 16, display: "flex", gap: 12, flexDirection: "row" },
    primaryBtn: {
      flex: 1,
      padding: "12px 16px",
      background: "#4f46e5",
      color: "#fff",
      border: "none",
      borderRadius: 8,
      fontSize: 16,
      cursor: "pointer",
    },
    secondaryBtn: {
      padding: "10px 12px",
      background: "#fff",
      color: "#111827",
      border: "1px solid #d1d5db",
      borderRadius: 8,
      cursor: "pointer",
    },
    mutedText: { color: "#6b7280", fontSize: 14 },
    overlay: {
      position: "fixed",
      inset: 0,
      background: "rgba(0,0,0,0.45)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      zIndex: 60,
      padding: 16,
    },
    modal: {
      width: "100%",
      maxWidth: 760,
      background: "#fff",
      borderRadius: 12,
      padding: 20,
      boxShadow: "0 12px 30px rgba(0,0,0,0.25)",
    },
    modalHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    },
    modalTitle: { fontSize: 20, fontWeight: 600, color: "#111827" },
    closeBtn: {
      background: "transparent",
      border: "none",
      fontSize: 20,
      cursor: "pointer",
      color: "#6b7280",
    },
    fieldLabel: {
      display: "block",
      fontSize: 13,
      color: "#374151",
      marginBottom: 6,
      marginTop: 12,
    },
    input: {
      width: "100%",
      padding: "10px 12px",
      borderRadius: 8,
      border: "1px solid #d1d5db",
      fontSize: 15,
    },
    numberInput: {
      width: "100%",
      padding: "10px 12px",
      borderRadius: 8,
      border: "1px solid #d1d5db",
      fontSize: 15,
    },
    smallText: { fontSize: 13, color: "#374151" },
    pre: {
      background: "#f3f4f6",
      padding: 12,
      borderRadius: 8,
      fontSize: 12,
      overflowX: "auto",
    },
    footerBtns: {
      marginTop: 18,
      display: "flex",
      justifyContent: "flex-end",
      gap: 8,
    },
  };

  // ----- fetch by id (scan) -----
  const fetchDetails = useCallback(async (id) => {
    // abort previous
    if (fetchAbortRef.current) {
      try {
        fetchAbortRef.current.abort();
      } catch (e) {}
      fetchAbortRef.current = null;
    }
    const ctrl = new AbortController();
    fetchAbortRef.current = ctrl;

    setLoading(true);
    setError(null);
    setPhoneDetails(null);
    // mark processing (extra guard)
    isProcessingRef.current = true;

    try {
      const res = await getById(id, { signal: ctrl.signal });
      const normalized = {
        ...res,
        no_of_actual_adults: res.no_of_reg_adults ?? 0,
        no_of_actual_children: res.no_of_reg_children ?? 0,
        preparing: !!res.preparing,
      };
      console.log("Fetched details:", normalized);
      if (normalized.present) {
        // gentle notice
        alert("This attendee has already checked in.");
        refreshPage();
      }
      setPhoneDetails(normalized);
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

  // ----- fetch by phone -----
  const fetchDetailsByPhone = useCallback(async (phone) => {
    if (phoneFetchAbortRef.current) {
      try {
        phoneFetchAbortRef.current.abort();
      } catch (e) {}
      phoneFetchAbortRef.current = null;
    }
    const ctrl = new AbortController();
    phoneFetchAbortRef.current = ctrl;

    setPhoneLoading(true);
    setPhoneError(null);
    setPhoneDetails(null);

    try {
      const res = await getByPhone(phone, { signal: ctrl.signal });
      if (!res || (Array.isArray(res) && res.length === 0)) {
        throw new Error("No records found for this phone number.");
      }
      const r = Array.isArray(res) ? res[0] : res;
      const result = {
        ...r,
        no_of_actual_adults: r.no_of_reg_adults ?? 0,
        no_of_actual_children: r.no_of_reg_children ?? 0,
        preparing: !!r.preparing,
      };
      console.log("Fetched phone details:", result);
      if (result.present) {
        alert("This attendee has already checked in.");
        refreshPage();
      }
      setPhoneDetails(result);
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

  // ----- scanner controls -----
  const stopScanner = useCallback(() => {
    decodeActiveRef.current = false;
    const codeReader = codeReaderRef.current;
    if (codeReader && codeReader.reset) {
      try {
        codeReader.reset();
      } catch (e) {}
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

  const handleScanned = useCallback(
    (data) => {
      if (!data) return;
      const id = String(data).trim();
      if (!id) return;

      const now = Date.now();
      if (now < ignoreUntilRef.current) return;
      if (isProcessingRef.current) return;
      if (lastHandledRef.current === id && now < ignoreUntilRef.current) return;

      // accept it — set guards immediately
      lastHandledRef.current = id;
      isProcessingRef.current = true;
      ignoreUntilRef.current = now + COOLDOWN_MS;

      setScannedId(id);
      setShowScanModal(true);
      setPhoneDetails(null);
      setError(null);

      // stop camera ASAP
      try {
        if (codeReaderRef.current?.reset) codeReaderRef.current.reset();
      } catch (e) {}
      stopScanner();

      // call backend
      fetchDetails(id);
    },
    [fetchDetails, stopScanner],
  );

  const startScanner = useCallback(async () => {
    if (decodeActiveRef.current) return;
    decodeActiveRef.current = true;
    if (!codeReaderRef.current)
      codeReaderRef.current = new BrowserMultiFormatReader();
    const codeReader = codeReaderRef.current;
    const tryStart = async () => {
      const constraints = { video: { facingMode: { exact: "environment" } } };
      try {
        await codeReader.decodeFromConstraints(
          constraints,
          videoRef.current,
          (result) => {
            if (result) handleScanned(result.getText());
          },
        );
      } catch (e) {
        try {
          await codeReader.decodeFromVideoDevice(
            undefined,
            videoRef.current,
            (result) => {
              if (result) handleScanned(result.getText());
            },
          );
        } catch (err) {
          console.error("Camera start failed:", err);
          setError(
            "Unable to access camera. Please allow camera permission or use a different device.",
          );
          decodeActiveRef.current = false;
        }
      }
    };
    await tryStart();
  }, [handleScanned]);

  useEffect(() => {
    startScanner();
    return () => {
      stopScanner();
      if (fetchAbortRef.current) {
        try {
          fetchAbortRef.current.abort();
        } catch (e) {}
        fetchAbortRef.current = null;
      }
      if (phoneFetchAbortRef.current) {
        try {
          phoneFetchAbortRef.current.abort();
        } catch (e) {}
        phoneFetchAbortRef.current = null;
      }
    };
  }, [startScanner, stopScanner]);

  const closeScanModal = useCallback(() => {
    if (fetchAbortRef.current) {
      try {
        fetchAbortRef.current.abort();
      } catch (e) {}
      fetchAbortRef.current = null;
    }
    try {
      stopScanner();
    } catch (e) {}
    setShowScanModal(false);
    setScannedId(null);
    setPhoneDetails(null);
    setError(null);
    // restart scanner after brief delay to avoid immediate re-scan
    setTimeout(() => startScanner(), 300);
    refreshPage();
  }, [stopScanner, startScanner]);

  const openPhoneModal = () => {
    setPhoneModalOpen(true);
    stopScanner();
  };
  const closePhoneModal = () => {
    if (phoneFetchAbortRef.current) {
      try {
        phoneFetchAbortRef.current.abort();
      } catch (e) {}
      phoneFetchAbortRef.current = null;
    }
    setPhoneModalOpen(false);
    setPhoneInput("");
    setPhoneDetails(null);
    setPhoneError(null);
    setPhoneLoading(false);
    setTimeout(() => startScanner(), 300);
    refreshPage();
  };

  // phone submit handler
  const handlePhoneSubmit = async (e) => {
    e?.preventDefault();
    setPhoneDetails(null);
    setPhoneError(null);
    const trimmed = (phoneInput || "").replace(/\s+/g, "");
    const ok = /^[+\d][\d]{5,14}$/.test(trimmed);
    if (!ok) {
      setPhoneError("Enter a valid phone number (10 digits).");
      return;
    }
    await fetchDetailsByPhone(trimmed);
    // refreshPage();
  };

  // mark presence (update)
  const markPresence = async () => {
    if (!phoneDetails?.id) {
      alert("No record selected.");
      return;
    }
    try {
      setPhoneLoading(true);
      const payload = {
        // update only fields you want; keep payload minimal (patch semantics)
        present: true,
        no_of_actual_adults:
          phoneDetails.no_of_actual_adults ??
          phoneDetails.no_of_reg_adults ??
          0,
        no_of_actual_children:
          phoneDetails.no_of_actual_children ??
          phoneDetails.no_of_reg_children ??
          0,
        preparing: !!phoneDetails.preparing,
      };
      const updated = await updateById(phoneDetails.id, payload);
      if (updated) {
        // update UI with returned row if available
        setPhoneDetails((prev) => ({ ...(prev || {}), ...(updated || {}) }));
        alert("Checked in successfully.");
      } else {
        alert("Updated (no response body).");
      }
    } catch (err) {
      console.error("Update failed:", err);
      alert("Update failed: " + (err?.message || "unknown"));
    } finally {
      setPhoneLoading(false);
      // lightweight UX: close modal and restart scanner shortly after success
      setTimeout(() => {
        setPhoneModalOpen(false);
        setPhoneDetails(null);
        setScannedId(null);
        setTimeout(() => startScanner(), 300);
      }, 700);
      //refresh page
      refreshPage();
    }
  };
  const refreshPage = () => {
    window.location.reload();
  };

  // helpers to change numeric / boolean fields in the details object
  const setNumberField = (field, value) => {
    setPhoneDetails((prev) => ({
      ...(prev || {}),
      [field]: value === "" ? "" : Number(value),
    }));
  };
  const setBooleanField = (field, value) => {
    setPhoneDetails((prev) => ({
      ...(prev || {}),
      [field]: value === "Yes" || value === true,
    }));
  };

  // --- render ---
  return (
    <div style={s.page}>
      <div style={s.container}>
        {/* Scanner Card */}
        {!showScanModal && !phoneModalOpen && (
          <div style={s.card}>
            <div style={s.videoWrap}>
              <video
                ref={videoRef}
                style={s.video}
                muted
                playsInline
                autoPlay
              />
            </div>

            <div style={s.controls}>
              <button
                type="button"
                onClick={openPhoneModal}
                style={s.primaryBtn}
              >
                Use Phone
              </button>
            </div>

            <div style={{ marginTop: 12, textAlign: "center" }}>
              {error && <div style={{ color: "#dc2626" }}>Error: {error}</div>}
              {!error && scannedId && !loading && !phoneDetails && (
                <div style={s.mutedText}>Scanned ID: {scannedId}</div>
              )}
              {!error && loading && <div style={s.mutedText}>Loading…</div>}
            </div>
          </div>
        )}

        {/* Scanned Modal */}
        {showScanModal && (
          <div style={s.overlay}>
            <div style={s.modal} role="dialog" aria-modal="true">
              <div style={s.modalHeader}>
                <div style={s.modalTitle}>Check-in details</div>
                <button
                  aria-label="Close"
                  onClick={closeScanModal}
                  style={s.closeBtn}
                >
                  ✕
                </button>
              </div>

              <div style={{ marginTop: 14 }}>
                <div style={s.smallText}>
                  <strong>Scanned ID:</strong>{" "}
                  <span style={{ color: "#374151" }}>{scannedId || "—"}</span>
                </div>

                {loading && (
                  <div style={{ marginTop: 12 }}>Loading details…</div>
                )}
                {error && (
                  <div style={{ marginTop: 12, color: "#dc2626" }}>
                    Failed to load details: {error}
                  </div>
                )}

                {phoneDetails && (
                  <div style={{ marginTop: 12 }}>
                    <div style={s.smallText}>
                      <strong>Name:</strong> {phoneDetails.name || "—"}
                    </div>
                    <div style={s.smallText}>
                      <strong>Mobile:</strong> {phoneDetails.mobile || "—"}
                    </div>
                    <div style={s.smallText}>
                      <strong>Email:</strong> {phoneDetails.email || "—"}
                    </div>
                    <div style={s.smallText}>
                      <strong>Adults (registered):</strong>{" "}
                      {phoneDetails.no_of_reg_adults ?? 0}
                    </div>
                    <div style={s.smallText}>
                      <strong>Children (registered):</strong>{" "}
                      {phoneDetails.no_of_reg_children ?? 0}
                    </div>
                    <div style={s.smallText}>
                      <strong>Performing:</strong>{" "}
                      {phoneDetails.preparing ? "Yes" : "No"}
                    </div>

                    <div style={{ marginTop: 14 }}>
                      <label style={s.fieldLabel}>Number of Adults:</label>
                      <input
                        type="number"
                        value={phoneDetails.no_of_actual_adults ?? ""}
                        onChange={(e) =>
                          setNumberField("no_of_actual_adults", e.target.value)
                        }
                        style={s.numberInput}
                      />

                      <label style={s.fieldLabel}>Number of Children:</label>
                      <input
                        type="number"
                        value={phoneDetails.no_of_actual_children ?? ""}
                        onChange={(e) =>
                          setNumberField(
                            "no_of_actual_children",
                            e.target.value,
                          )
                        }
                        style={s.numberInput}
                      />

                      <label style={s.fieldLabel}>
                        Performing (Bathukamma):
                      </label>
                      <select
                        value={phoneDetails.preparing ? "Yes" : "No"}
                        onChange={(e) =>
                          setBooleanField("preparing", e.target.value)
                        }
                        style={s.input}
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>

                      {/* <div style={{ marginTop: 12 }}>
                        <div style={s.pre}>{JSON.stringify(phoneDetails, null, 2)}</div>
                      </div> */}
                    </div>
                  </div>
                )}
              </div>

              <div style={s.footerBtns}>
                <button onClick={closeScanModal} style={s.secondaryBtn}>
                  Close
                </button>
                <button
                  onClick={markPresence}
                  style={s.primaryBtn}
                  disabled={phoneLoading}
                >
                  {phoneLoading ? "Updating…" : "Confirm"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Phone Modal */}
        {phoneModalOpen && (
          <div style={s.overlay}>
            <div
              style={{ ...s.modal, maxWidth: 520 }}
              role="dialog"
              aria-modal="true"
            >
              <div style={s.modalHeader}>
                <div style={s.modalTitle}>Lookup by Phone</div>
                <button
                  aria-label="Close"
                  onClick={closePhoneModal}
                  style={s.closeBtn}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handlePhoneSubmit} style={{ marginTop: 12 }}>
                <label style={s.fieldLabel}>Phone number</label>
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="9876543210"
                  style={s.input}
                  autoFocus
                />

                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 8,
                    marginTop: 12,
                  }}
                >
                  <button
                    type="button"
                    onClick={closePhoneModal}
                    style={s.secondaryBtn}
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={phoneLoading}
                    style={s.primaryBtn}
                  >
                    {phoneLoading ? "Searching…" : "Search"}
                  </button>
                </div>
              </form>

              <div style={{ marginTop: 14 }}>
                {phoneError && (
                  <div style={{ color: "#dc2626" }}>{phoneError}</div>
                )}

                {phoneDetails && (
                  <div style={{ marginTop: 12 }}>
                    <div style={s.smallText}>
                      <strong>Name:</strong> {phoneDetails.name || "—"}
                    </div>
                    <div style={s.smallText}>
                      <strong>Mobile:</strong> {phoneDetails.mobile || "—"}
                    </div>
                    <div style={s.smallText}>
                      <strong>Email:</strong> {phoneDetails.email || "—"}
                    </div>

                    <label style={s.fieldLabel}>Number of Adults</label>
                    <input
                      type="number"
                      value={phoneDetails.no_of_actual_adults ?? ""}
                      onChange={(e) =>
                        setNumberField("no_of_actual_adults", e.target.value)
                      }
                      style={s.numberInput}
                    />

                    <label style={s.fieldLabel}>Number of Children</label>
                    <input
                      type="number"
                      value={phoneDetails.no_of_actual_children ?? ""}
                      onChange={(e) =>
                        setNumberField("no_of_actual_children", e.target.value)
                      }
                      style={s.numberInput}
                    />

                    <label style={s.fieldLabel}>Performing (Bathukamma)</label>
                    <select
                      value={phoneDetails.preparing ? "Yes" : "No"}
                      onChange={(e) =>
                        setBooleanField("preparing", e.target.value)
                      }
                      style={s.input}
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>

                    {/* <div style={{ marginTop: 12 }}>
                      <div style={s.pre}>{JSON.stringify(phoneDetails, null, 2)}</div>
                    </div> */}

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "flex-end",
                        gap: 8,
                        marginTop: 12,
                      }}
                    >
                      <button
                        onClick={markPresence}
                        style={s.primaryBtn}
                        disabled={phoneLoading}
                      >
                        {phoneLoading ? "Updating…" : "Confirm"}
                      </button>
                      <button onClick={closePhoneModal} style={s.secondaryBtn}>
                        Close
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
