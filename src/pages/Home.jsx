import React, { useEffect, useRef, useState, useCallback } from "react";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { getById, getByPhone } from "../service";

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

  const fetchDetails = useCallback(async (id) => {
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
      console.log("Fetched details:", res);
      setPhoneDetails(res);
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
      const result = {...res[0], no_of_actual_adults: res[0].no_of_reg_adults, no_of_actual_children: res[0].no_of_reg_children};
      console.log("Fetched phone details:", result);
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

      if (
        lastHandledRef.current === id &&
        now < (ignoreUntilRef.current || 0)
      ) {
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

    window.location.reload();
  }, [stopScanner]);

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
    console.log("markPresence", phoneDetails);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gray-50 p-6">

      {!showScanModal && !phoneModalOpen && (
        <div className="w-full max-w-md bg-white rounded-xl shadow p-4">
          <div className="rounded overflow-hidden">
            <video
              ref={videoRef}
              style={{ width: "100%", height: "auto" }}
              muted
              playsInline
              autoPlay
            />
          </div>

          <div className="mt-4 flex justify-center gap-2">
            <button
              onClick={openPhoneModal}
              style={{ color: "white", backgroundColor: "#4F46E5" , width: '100%'}}
              className="px-6 py-3 rounded-lg shadow hover:opacity-90 focus:outline-none"
            >
              Use Phone
            </button>
          </div>

          <div className="mt-3 text-sm text-gray-600 text-center">
            {error && <span className="text-red-600">Error: {error}</span>}
            
            {!error && scannedId && !loading && !details && (
              <span>Scanned ID: {scannedId}</span>
            )}
          </div>
        </div>
      )}
      {showScanModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-xl">
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-semibold">Check-in details</h2>
              <button
                onClick={closeScanModal}
                className="text-gray-500 hover:text-gray-800"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="mt-4">
              <div className="text-sm text-gray-600">
                <strong>Scanned ID:</strong> {scannedId || "—"}
              </div>

              {loading && <div className="mt-4">Loading details…</div>}
              {error && (
                <div className="mt-4 text-red-600">
                  Failed to load details: {error}
                </div>
              )}

              {phoneDetails && (
                <div className="mt-4 space-y-2 text-sm">
                                {phoneDetails && (
                <div className="mt-3 text-sm space-y-2">
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
                    <strong>Adults:</strong>{" "}
                    {phoneDetails.no_of_reg_adults || 0}
                  </div>
                  <div>
                    <strong>Children:</strong>{" "}
                    {phoneDetails.no_of_reg_children || 0}
                  </div>
                  <div>
                    <strong>Performing:</strong>{" "}
                    {phoneDetails.preparing ? "Yes" : "No"}
                  </div>
                  <div className="mt-4">
                    <label
                      htmlFor="no_of_reg_adults"
                      className="block text-sm text-gray-700 mb-2"
                    >
                      Number of Adults:
                    </label>
                    <input
                      type="number"
                      id="no_of_reg_adults"
                      value={phoneDetails?.no_of_reg_adults || ""}
                      onChange={(e) => {
                        setPhoneDetails((prevDetails) => ({
                          ...prevDetails,
                          no_of_actual_adults: e.target.value,
                        }));
                      }}
                      className="w-full border rounded px-3 py-2"
                    />

                    <label
                      htmlFor="no_of_reg_children"
                      className="block text-sm text-gray-700 mt-2 mb-2"
                    >
                      Number of Children:
                    </label>
                    <input
                      type="number"
                      id="no_of_reg_children"
                      value={phoneDetails?.no_of_reg_children || ""}
                      onChange={(e) => {
                        setPhoneDetails((prevDetails) => ({
                          ...prevDetails,
                          no_of_actual_children: e.target.value,
                        }));
                      }}
                      className="w-full border rounded px-3 py-2"
                    />

                    <label
                      htmlFor="performing"
                      className="block text-sm text-gray-700 mt-2 mb-2"
                    >
                      Performing:
                    </label>
                    <select
                      id="performing"
                      value={phoneDetails?.performing || ""}
                      onChange={(e) => {
                        setPhoneDetails((prevDetails) => ({
                          ...prevDetails,
                          performing: e.target.value,
                        }));
                      }}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>
              )}
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
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex justify-between items-start">
              <h2 className="text-xl font-semibold">Lookup by Phone</h2>
              <button
                onClick={closePhoneModal}
                className="text-gray-500 hover:text-gray-800"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handlePhoneSubmit} className="mt-4">
              <label className="block text-sm text-gray-700 mb-2">
                Phone number
              </label>
              <input
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="9876543210"
                className="w-full border rounded px-3 py-2"
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
                  className="px-4 py-2 bg-indigo-600 text-white rounded"
                >
                  {phoneLoading ? "Searching..." : "Search"}
                </button>
              </div>
            </form>

            <div className="mt-4">
              {phoneError && <div className="text-red-600">{phoneError}</div>}

              {phoneDetails && (
                <div className="mt-3 text-sm space-y-2">
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
                    <strong>Adults:</strong>{" "}
                    {phoneDetails.no_of_reg_adults || 0}
                  </div>
                  <div>
                    <strong>Children:</strong>{" "}
                    {phoneDetails.no_of_reg_children || 0}
                  </div>
                  <div>
                    <strong>Performing:</strong>{" "}
                    {phoneDetails.preparing ? "Yes" : "No"}
                  </div>
                  <div className="mt-4">
                    <label
                      htmlFor="no_of_reg_adults"
                      className="block text-sm text-gray-700 mb-2"
                    >
                      Number of Adults:
                    </label>
                    <input
                      type="number"
                      id="no_of_reg_adults"
                      value={phoneDetails?.no_of_reg_adults || ""}
                      onChange={(e) => {
                        setPhoneDetails((prevDetails) => ({
                          ...prevDetails,
                          no_of_reg_adults: e.target.value,
                        }));
                      }}
                      className="w-full border rounded px-3 py-2"
                    />

                    <label
                      htmlFor="no_of_reg_children"
                      className="block text-sm text-gray-700 mt-2 mb-2"
                    >
                      Number of Children:
                    </label>
                    <input
                      type="number"
                      id="no_of_reg_children"
                      value={phoneDetails?.no_of_reg_children || ""}
                      onChange={(e) => {
                        setPhoneDetails((prevDetails) => ({
                          ...prevDetails,
                          no_of_reg_children: e.target.value,
                        }));
                      }}
                      className="w-full border rounded px-3 py-2"
                    />

                    <label
                      htmlFor="performing"
                      className="block text-sm text-gray-700 mt-2 mb-2"
                    >
                      Performing:
                    </label>
                    <select
                      id="performing"
                      value={phoneDetails?.performing || ""}
                      onChange={(e) => {
                        setPhoneDetails((prevDetails) => ({
                          ...prevDetails,
                          performing: e.target.value,
                        }));
                      }}
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>

                  <div className="mt-3 flex justify-end gap-2">
                    <button
                      onClick={markPresence}
                      className="px-4 py-2 bg-indigo-600 text-white rounded"
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
  );
}
