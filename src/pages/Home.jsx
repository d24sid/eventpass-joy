import React, { useEffect, useRef, useState, useCallback } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { getById, getByPhone, updateById } from "../service";

export default function Home() {
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

  const fetchDetails = useCallback(
    async (id) => {
      if (fetchAbortRef.current) {
        fetchAbortRef.current.abort();
        fetchAbortRef.current = null;
      }
      const controller = new AbortController();
      fetchAbortRef.current = controller;
      setLoading(true);
      setError(null);
      setPhoneDetails(null);
      isProcessingRef.current = true;

      try {
        const res = await getById(id, { signal: controller.signal });
        const normalized = {
          ...res,
          no_of_actual_adults:
            res.no_of_reg_adults,
          no_of_actual_children:
            res.no_of_reg_children,
          preparing: !!res.preparing,
        };
        console.log("Fetched details:", normalized);
        if(normalized.present) {
          alert("This attendee has already checked in.");
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
    },
    []
  );

  const fetchDetailsByPhone = useCallback(async (phone) => {
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
      const res = await getByPhone(phone, { signal: controller.signal });
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
      if(result.present) {
        alert("This attendee has already checked in.");
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

  const stopScanner = useCallback(() => {
    decodeActiveRef.current = false;
    const codeReader = codeReaderRef.current;
    if (codeReader) {
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

      if (now < ignoreUntilRef.current) {
        return;
      }

      if (isProcessingRef.current) return;

      // Avoid handling same id repeatedly
      if (lastHandledRef.current === id && now < ignoreUntilRef.current) {
        return;
      }

      lastHandledRef.current = id;
      ignoreUntilRef.current = now + COOLDOWN_MS;

      setScannedId(id);
      setShowScanModal(true);
      setPhoneDetails(null);
      setError(null);

      stopScanner();

      fetchDetails(id);
    },
    [fetchDetails, stopScanner]
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
          }
        );
      } catch (e) {
        try {
          await codeReader.decodeFromVideoDevice(
            undefined,
            videoRef.current,
            (result) => {
              if (result) handleScanned(result.getText());
            }
          );
        } catch (err) {
          console.error("Camera start failed:", err);
          setError(
            "Unable to access camera. Please allow camera permission or use a different device."
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
        fetchAbortRef.current.abort();
        fetchAbortRef.current = null;
      }
      if (phoneFetchAbortRef.current) {
        phoneFetchAbortRef.current.abort();
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

    setTimeout(() => {
      startScanner();
    }, 300);
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
  };

  const handlePhoneSubmit = async (e) => {
    e?.preventDefault();
    setPhoneDetails(null);
    setPhoneError(null);

    const trimmed = (phoneInput || "").replace(/\s+/g, "");
    const ok = /^[+\d][\d]{5,14}$/.test(trimmed);
    if (!ok) {
      setPhoneError("Enter a valid phone number (10 digits) .");
      return;
    }
    await fetchDetailsByPhone(trimmed);
  };

  const markPresence = () => {
    const req = {...phoneDetails, present: true};
    updateById(phoneDetails.id, req);
  };

  const setNumberField = (field, value) => {
    setPhoneDetails((prev) => ({
      ...prev,
      [field]: value === "" ? "" : Number(value),
    }));
  };
  const setBooleanField = (field, value) => {
    setPhoneDetails((prev) => ({
      ...prev,
      [field]: value === "Yes" || value === true,
    }));
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gray-50 py-6 px-4">
      <div className="w-[90%] max-w-2xl mx-auto">
        {/* Scanner card */}
        {!showScanModal && !phoneModalOpen && (
          <div className="bg-white rounded-xl shadow p-5">
            <div className="rounded overflow-hidden border border-gray-100">
              <video
                ref={videoRef}
                className="w-full h-auto rounded-md bg-black"
                muted
                playsInline
                autoPlay
              />
            </div>

            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <button
                onClick={openPhoneModal}
                className="w-full sm:w-auto flex-1 px-6 py-3 text-base font-medium rounded-lg shadow bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none"
              >
                Use Phone
              </button>

            </div>

            <div className="mt-3 text-sm text-gray-600 text-center">
              {error && (
                <span className="text-red-600 text-sm">Error: {error}</span>
              )}

              {!error && scannedId && !loading && !phoneDetails && (
                <span className="text-gray-700">Scanned ID: {scannedId}</span>
              )}

              {!error && loading && <div className="text-gray-500">Loading…</div>}
            </div>
          </div>
        )}

        {/* Scanned Modal */}
        {showScanModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="bg-white rounded-xl w-[90%] max-w-lg p-6 shadow-xl">
              <div className="flex justify-between items-start">
                <h2 className="text-2xl font-semibold text-gray-800">
                  Check-in details
                </h2>
                <button
                  onClick={closeScanModal}
                  className="text-gray-500 hover:text-gray-800 text-lg"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div className="mt-4 text-sm text-gray-700 space-y-3">
                <div>
                  <strong className="text-base">Scanned ID:</strong>{" "}
                  <span className="text-gray-600">{scannedId || "—"}</span>
                </div>

                {loading && <div className="text-gray-500">Loading details…</div>}
                {error && (
                  <div className="text-red-600">Failed to load details: {error}</div>
                )}

                {phoneDetails && (
                  <div className="mt-2">
                    <div className="space-y-2 text-sm text-gray-700">
                      <div>
                        <strong>Name:</strong> {phoneDetails.name || "—"}
                      </div>
                      <div>
                        <strong>Mobile:</strong> {phoneDetails.mobile || "—"}
                      </div>
                      <div>
                        <strong>Email:</strong> {phoneDetails.email || "—"}
                      </div>
                      <div>
                        <strong>Adults (registered):</strong>{" "}
                        {phoneDetails.no_of_reg_adults ?? 0}
                      </div>
                      <div>
                        <strong>Children (registered):</strong>{" "}
                        {phoneDetails.no_of_reg_children ?? 0}
                      </div>
                      <div>
                        <strong>Performing:</strong>{" "}
                        {phoneDetails.preparing ? "Yes" : "No"}
                      </div>

                      <div className="mt-4">
                        <label
                          htmlFor="no_of_actual_adults"
                          className="block text-sm font-medium text-gray-700 mb-2"
                        >
                          Number of Adults:
                        </label>
                        <input
                          type="number"
                          id="no_of_actual_adults"
                          value={
                            phoneDetails?.no_of_actual_adults
                          }
                          onChange={(e) =>
                            setNumberField("no_of_actual_adults", e.target.value)
                          }
                          className="w-full border rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-indigo-500"
                        />

                        <label
                          htmlFor="no_of_actual_children"
                          className="block text-sm font-medium text-gray-700 mt-3 mb-2"
                        >
                          Number of Children:
                        </label>
                        <input
                          type="number"
                          id="no_of_actual_children"
                          value={
                            phoneDetails?.no_of_actual_children
                          }
                          onChange={(e) =>
                            setNumberField("no_of_actual_children", e.target.value)
                          }
                          className="w-full border rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-indigo-500"
                        />

                        <label
                          htmlFor="preparing"
                          className="block text-sm font-medium text-gray-700 mt-3 mb-2"
                        >
                          Performing:
                        </label>
                        <select
                          id="preparing"
                          value={phoneDetails?.preparing ? "Yes" : "No"}
                          onChange={(e) =>
                            setBooleanField("preparing", e.target.value)
                          }
                          className="w-full border rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={closeScanModal}
                  className="px-4 py-2 rounded border"
                >
                  Close
                </button>
                <button
                  onClick={markPresence}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Phone Modal */}
        {phoneModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            role="dialog"
            aria-modal="true"
          >
            <div className="bg-white rounded-xl w-[90%] max-w-md p-6 shadow-xl">
              <div className="flex justify-between items-start">
                <h2 className="text-2xl font-semibold text-gray-800">
                  Lookup by Phone
                </h2>
                <button
                  onClick={closePhoneModal}
                  className="text-gray-500 hover:text-gray-800 text-lg"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handlePhoneSubmit} className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone number
                </label>
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="9876543210"
                  className="w-full border rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-indigo-500"
                  autoFocus
                />

                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closePhoneModal}
                    className="px-4 py-2 rounded border"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={phoneLoading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    {phoneLoading ? "Searching..." : "Search"}
                  </button>
                </div>
              </form>

              <div className="mt-4">
                {phoneError && <div className="text-red-600">{phoneError}</div>}

                {phoneDetails && (
                  <div className="mt-3 text-sm space-y-2 text-gray-700">
                    <div>
                      <strong>Name:</strong> {phoneDetails.name || "—"}
                    </div>
                    <div>
                      <strong>Mobile:</strong> {phoneDetails.mobile || "—"}
                    </div>
                    <div>
                      <strong>Email:</strong> {phoneDetails.email || "—"}
                    </div>
                    <div>
                      <strong>Adults (registered):</strong>{" "}
                      {phoneDetails.no_of_reg_adults ?? 0}
                    </div>
                    <div>
                      <strong>Children (registered):</strong>{" "}
                      {phoneDetails.no_of_reg_children ?? 0}
                    </div>
                    <div>
                      <strong>Performing:</strong>{" "}
                      {phoneDetails.preparing ? "Yes" : "No"}
                    </div>

                    <div className="mt-4">
                      <label
                        htmlFor="no_of_reg_adults"
                        className="block text-sm font-medium text-gray-700 mb-2"
                      >
                        Number of Adults:
                      </label>
                      <input
                        type="number"
                        id="no_of_reg_adults"
                        value={
                          phoneDetails?.no_of_actual_adults ??
                          phoneDetails?.no_of_reg_adults ??
                          ""
                        }
                        onChange={(e) =>
                          setNumberField("no_of_actual_adults", e.target.value)
                        }
                        className="w-full border rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-indigo-500"
                      />

                      <label
                        htmlFor="no_of_reg_children"
                        className="block text-sm font-medium text-gray-700 mt-3 mb-2"
                      >
                        Number of Children:
                      </label>
                      <input
                        type="number"
                        id="no_of_reg_children"
                        value={
                          phoneDetails?.no_of_actual_children ??
                          phoneDetails?.no_of_reg_children ??
                          ""
                        }
                        onChange={(e) =>
                          setNumberField("no_of_actual_children", e.target.value)
                        }
                        className="w-full border rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-indigo-500"
                      />

                      <label
                        htmlFor="performing"
                        className="block text-sm font-medium text-gray-700 mt-3 mb-2"
                      >
                        Performing:
                      </label>
                      <select
                        id="performing"
                        value={phoneDetails?.preparing ? "Yes" : "No"}
                        onChange={(e) =>
                          setBooleanField("preparing", e.target.value)
                        }
                        className="w-full border rounded-lg px-3 py-2 text-base focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="Yes">Yes</option>
                        <option value="No">No</option>
                      </select>
                    </div>

                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        onClick={markPresence}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                      >
                        Confirm
                      </button>
                      <button
                        onClick={closePhoneModal}
                        className="px-4 py-2 rounded border"
                      >
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
