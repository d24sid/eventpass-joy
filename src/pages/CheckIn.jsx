import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, AlertCircle, CheckCircle, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import QRScanner from '../components/QRScanner';
import AttendeeForm from '../components/AttendeeForm';
import { checkInAttendee, cancelCheckIn, searchAttendeeByPhone } from '../firebase';
import { useToast } from '@/hooks/use-toast';

const CheckIn = () => {
  const [step, setStep] = useState('scan'); // 'scan', 'search', 'form', 'success'
  const [attendeeData, setAttendeeData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [phoneSearch, setPhoneSearch] = useState('');
  const [error, setError] = useState('');
  const { toast } = useToast();

  const handleQRScan = (qrData) => {
    console.log('QR scanned:', qrData);
    setAttendeeData(qrData);
    setStep('form');
    toast({
      title: "QR Code Scanned! 📱",
      description: "Great! We found your information.",
    });
  };

  const handleQRError = (error) => {
    console.error('QR scan error:', error);
    setError(error);
    toast({
      title: "Camera Issue 📷",
      description: error,
      variant: "destructive"
    });
  };

  const handlePhoneSearch = async () => {
    if (!phoneSearch.trim()) return;
    
    setIsLoading(true);
    setError('');
    
    try {
      const result = await searchAttendeeByPhone(phoneSearch);
      
      if (result.success) {
        setAttendeeData(result.attendee);
        setStep('form');
        toast({
          title: "Found you! 🎉",
          description: `Welcome back, ${result.attendee.name}!`,
        });
      } else {
        setError(result.message);
        toast({
          title: "Not found 😔",
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Phone search error:', error);
      setError('Something went wrong. Please try again.');
      toast({
        title: "Oops! 😅",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormConfirm = async (formData) => {
    setIsLoading(true);
    
    try {
      const result = await checkInAttendee(formData);
      
      if (result.success) {
        setStep('success');
        toast({
          title: "Check-in Complete! ✨",
          description: result.message,
        });
      } else {
        setError(result.message || 'Check-in failed');
        toast({
          title: "Check-in Failed 😔",
          description: result.message || 'Something went wrong.',
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Check-in error:', error);
      setError('Something went wrong. Please try again.');
      toast({
        title: "Oops! 😅",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFormCancel = () => {
    setStep('scan');
    setAttendeeData(null);
    setError('');
  };

  const resetFlow = () => {
    setStep('scan');
    setAttendeeData(null);
    setError('');
    setPhoneSearch('');
  };

  return (
    <div className="min-h-screen bg-gradient-soft py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            Event Check-In 🎫
          </h1>
          <p className="text-muted-foreground">
            Hey friend, let's get you checked in! Choose your preferred method below.
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {/* QR Scan & Phone Search Step */}
          {step === 'scan' && (
            <motion.div
              key="scan"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* QR Scanner */}
              <QRScanner onScan={handleQRScan} onError={handleQRError} />

              {/* Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-background px-4 text-muted-foreground font-medium">
                    Or search by phone
                  </span>
                </div>
              </div>

              {/* Phone Search */}
              <Card className="shadow-soft border-border/50 bg-card/80 backdrop-blur-sm">
                <CardHeader className="text-center pb-4">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="w-12 h-12 bg-secondary/20 rounded-xl flex items-center justify-center mx-auto mb-4"
                  >
                    <Search className="w-6 h-6 text-secondary" />
                  </motion.div>
                  <CardTitle className="text-lg">Can't scan? No worries! 📞</CardTitle>
                  <p className="text-muted-foreground text-sm">
                    Enter your phone number and we'll find your registration
                  </p>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone-search">Phone Number</Label>
                      <Input
                        id="phone-search"
                        type="tel"
                        placeholder="(555) 123-4567"
                        value={phoneSearch}
                        onChange={(e) => setPhoneSearch(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handlePhoneSearch()}
                        className="bg-background/50 border-border/50 focus:border-primary transition-colors"
                      />
                    </div>
                    
                    <Button
                      onClick={handlePhoneSearch}
                      disabled={!phoneSearch.trim() || isLoading}
                      className="w-full bounce-hover bg-secondary hover:bg-secondary/90"
                    >
                      <Search className="w-4 h-4 mr-2" />
                      {isLoading ? 'Searching...' : 'Find My Registration'}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Error Display */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Form Step */}
          {step === 'form' && (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <AttendeeForm
                initialData={attendeeData}
                onConfirm={handleFormConfirm}
                onCancel={handleFormCancel}
                isLoading={isLoading}
              />
            </motion.div>
          )}

          {/* Success Step */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Card className="shadow-glow border-0 bg-gradient-primary text-primary-foreground">
                <CardContent className="p-12 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                    className="w-20 h-20 bg-primary-foreground/20 rounded-full flex items-center justify-center mx-auto mb-6"
                  >
                    <CheckCircle className="w-10 h-10" />
                  </motion.div>
                  
                  <h2 className="text-3xl font-bold mb-4">You're all set! 🎉</h2>
                  <p className="text-primary-foreground/90 mb-8 text-lg">
                    Welcome to the event! Have an amazing time! ✨
                  </p>
                  
                  <div className="space-y-4">
                    <div className="bg-primary-foreground/10 rounded-xl p-4">
                      <p className="text-sm opacity-90">
                        Keep this page handy in case you need to show proof of check-in
                      </p>
                    </div>
                    
                    <Button
                      onClick={resetFlow}
                      variant="secondary"
                      className="bounce-hover"
                    >
                      <QrCode className="w-4 h-4 mr-2" />
                      Check In Another Person
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CheckIn;