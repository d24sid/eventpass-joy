import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Phone, Users, Baby, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const AttendeeForm = ({ initialData, onConfirm, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    phone: initialData?.phone || '',
    adults: initialData?.adults || 1,
    children: initialData?.children || 0,
    performing: initialData?.performing || false,
    ...initialData
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onConfirm?.(formData);
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      <Card className="shadow-soft border-border/50 bg-card/80 backdrop-blur-sm">
        <CardHeader className="text-center pb-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4"
          >
            <User className="w-8 h-8 text-primary-foreground" />
          </motion.div>
          <CardTitle className="text-xl font-bold">
            Tell us about yourself! 👋
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            Just a few quick details to complete your check-in
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-2"
            >
              <Label htmlFor="name" className="flex items-center space-x-2">
                <User className="w-4 h-4 text-primary" />
                <span>What's your name?</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Enter your full name"
                className="bg-background/50 border-border/50 focus:border-primary transition-colors"
                required
              />
            </motion.div>

            {/* Phone Field */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="space-y-2"
            >
              <Label htmlFor="phone" className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-primary" />
                <span>Phone number</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                placeholder="(555) 123-4567"
                className="bg-background/50 border-border/50 focus:border-primary transition-colors"
                required
              />
            </motion.div>

            {/* Adults Count */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
              className="space-y-2"
            >
              <Label htmlFor="adults" className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-primary" />
                <span>How many adults?</span>
              </Label>
              <Input
                id="adults"
                type="number"
                min="1"
                max="20"
                value={formData.adults}
                onChange={(e) => updateField('adults', parseInt(e.target.value) || 1)}
                className="bg-background/50 border-border/50 focus:border-primary transition-colors"
              />
            </motion.div>

            {/* Children Count */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="space-y-2"
            >
              <Label htmlFor="children" className="flex items-center space-x-2">
                <Baby className="w-4 h-4 text-primary" />
                <span>How many children?</span>
              </Label>
              <Input
                id="children"
                type="number"
                min="0"
                max="20"
                value={formData.children}
                onChange={(e) => updateField('children', parseInt(e.target.value) || 0)}
                className="bg-background/50 border-border/50 focus:border-primary transition-colors"
              />
            </motion.div>

            {/* Performing Toggle */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 }}
              className="flex items-center justify-between p-4 bg-accent/20 rounded-xl border border-accent/30"
            >
              <div className="flex items-center space-x-3">
                <Star className="w-5 h-5 text-accent-foreground" />
                <div>
                  <Label htmlFor="performing" className="font-medium">
                    Are you performing today?
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Let us know if you're part of the show! 🎭
                  </p>
                </div>
              </div>
              <Switch
                id="performing"
                checked={formData.performing}
                onCheckedChange={(checked) => updateField('performing', checked)}
              />
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="flex space-x-3 pt-4"
            >
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className="flex-1 bounce-hover"
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bounce-hover bg-gradient-primary hover:opacity-90 transition-opacity"
                disabled={isLoading || !formData.name || !formData.phone}
              >
                {isLoading ? 'Checking in...' : 'Confirm Check-in ✨'}
              </Button>
            </motion.div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AttendeeForm;