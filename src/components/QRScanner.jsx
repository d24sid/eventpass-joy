import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Camera, CameraOff, RotateCcw } from "lucide-react";
import { QrCode, Users, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// Note: react-qr-scanner might need different import in actual implementation
// This is a placeholder component structure

const QRScanner = ({ onScan, onError }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [hasPermission, setHasPermission] = useState(null);
  const scannerRef = useRef(null);

  const startScanning = async () => {
    try {
      // TODO: Implement actual QR scanner with react-qr-scanner
      setIsScanning(true);
      setHasPermission(true);

      // Placeholder: Simulate QR scan after 3 seconds
      setTimeout(() => {
        const mockQRData = {
          attendeeId: "mock-qr-" + Date.now(),
          name: "Jane Smith",
          phone: "555-0123",
        };
        onScan?.(mockQRData);
      }, 3000);
    } catch (error) {
      console.error("Camera access denied:", error);
      setHasPermission(false);
      onError?.("Camera access denied. Please enable camera permissions.");
    }
  };

  const stopScanning = () => {
    setIsScanning(false);
    // TODO: Stop actual scanner
  };

  if (hasPermission === false) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center p-8 bg-destructive/10 rounded-2xl border border-destructive/20"
      >
        <CameraOff className="w-12 h-12 text-destructive mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-destructive mb-2">
          Camera Access Needed
        </h3>
        <p className="text-muted-foreground mb-4">
          Please enable camera permissions to scan QR codes
        </p>
        <Button
          onClick={() => setHasPermission(null)}
          variant="outline"
          className="bounce-hover"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-card rounded-2xl overflow-hidden shadow-soft border border-border"
      >
        {!isScanning ? (
          <div className="aspect-square bg-gradient-soft flex flex-col items-center justify-center p-8">
            <motion.div
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="w-24 h-24 bg-primary/20 rounded-full flex items-center justify-center mb-6"
            >
              <Camera className="w-12 h-12 text-primary" />
            </motion.div>
            <h3 className="text-lg font-semibold mb-2">Ready to Scan</h3>
            <p className="text-muted-foreground text-center mb-6">
              Hey friend, point your camera at a QR code to get started! ✨
            </p>
            <Button
              onClick={startScanning}
              className="bounce-hover bg-gradient-primary"
              size="lg"
            >
              <Camera className="w-4 h-4 mr-2" />
              Start Scanning
            </Button>
          </div>
        ) : (
          <div className="aspect-square bg-black relative flex items-center justify-center">
            {/* TODO: Replace with actual QR scanner component */}
            <div className="absolute inset-4 border-2 border-primary rounded-2xl">
              <div className="absolute inset-0 bg-primary/10 animate-pulse rounded-2xl" />
              <motion.div
                animate={{
                  y: ["0%", "100%", "0%"],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute top-0 left-0 right-0 h-1 bg-primary shadow-glow"
              />
            </div>
            <div className="text-center z-10">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="w-16 h-16 border-4 border-primary rounded-full flex items-center justify-center mb-4"
              >
                <QrCode className="w-8 h-8 text-primary" />
              </motion.div>
              <p className="text-white font-medium">Scanning for QR codes...</p>
              <p className="text-white/70 text-sm mt-1">Hold steady! 📱</p>
            </div>
            <Button
              onClick={stopScanning}
              variant="secondary"
              size="sm"
              className="absolute top-4 right-4 bounce-hover"
            >
              <CameraOff className="w-4 h-4 mr-1" />
              Stop
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default QRScanner;
