import { motion } from 'framer-motion';
import { QrCode, Smartphone, Shield, Clock, Heart, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const About = () => {
  const benefits = [
    {
      icon: Clock,
      title: 'Lightning Fast',
      description: 'Check in within seconds, not minutes',
      color: 'text-pastel-yellow'
    },
    {
      icon: Smartphone,
      title: 'Mobile Friendly',
      description: 'Works perfectly on any device',
      color: 'text-pastel-blue'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your data is protected and encrypted',
      color: 'text-pastel-green'
    },
    {
      icon: Heart,
      title: 'Made with Love',
      description: 'Designed to make your experience delightful',
      color: 'text-pastel-pink'
    }
  ];

  const steps = [
    {
      number: '01',
      title: 'Scan Your QR Code',
      description: 'Point your camera at the QR code on your pass'
    },
    {
      number: '02', 
      title: 'Confirm Your Details',
      description: 'Quick form to verify your information'
    },
    {
      number: '03',
      title: 'You\'re In!',
      description: 'Welcome to the event - enjoy yourself!'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-soft">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2 }}
            className="w-20 h-20 bg-gradient-primary rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-glow"
          >
            <Zap className="w-10 h-10 text-primary-foreground" />
          </motion.div>
          
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            About <span className="bg-gradient-primary bg-clip-text text-transparent">GatePass</span>
          </h1>
          
          <p className="text-xl text-muted-foreground leading-relaxed">
            We believe check-ins should be delightful, not stressful. That's why we created 
            the friendliest event entry experience possible! 🌟
          </p>
        </motion.div>

        {/* How It Works */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-20"
        >
          <h2 className="text-3xl font-bold text-center mb-12">How it works ✨</h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + index * 0.2 }}
                className="text-center"
              >
                <div className="relative">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-soft"
                  >
                    <span className="text-2xl font-bold text-primary-foreground">
                      {step.number}
                    </span>
                  </motion.div>
                  
                  {index < steps.length - 1 && (
                    <motion.div
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ delay: 0.8 + index * 0.2, duration: 0.6 }}
                      className="hidden md:block absolute top-8 left-full w-full h-0.5 bg-gradient-to-r from-primary to-transparent transform -translate-y-1/2"
                    />
                  )}
                </div>
                
                <h3 className="text-xl font-semibold mb-3">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Benefits */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-20"
        >
          <h2 className="text-3xl font-bold text-center mb-12">Why choose GatePass? 🤔</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1 + index * 0.1 }}
                >
                  <Card className="h-full hover:shadow-soft transition-all duration-300 bounce-hover bg-card/80 backdrop-blur-sm border-border/50">
                    <CardHeader className="text-center pb-4">
                      <motion.div
                        whileHover={{ rotate: 15, scale: 1.1 }}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 ${benefit.color} bg-current/10`}
                      >
                        <Icon className={`w-6 h-6 ${benefit.color}`} />
                      </motion.div>
                      <CardTitle className="text-lg">{benefit.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-muted-foreground text-sm text-center">
                        {benefit.description}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.section>

        {/* Tech Info */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <Card className="bg-gradient-primary text-primary-foreground shadow-glow border-0">
            <CardContent className="p-12 text-center">
              <QrCode className="w-16 h-16 mx-auto mb-6 opacity-90" />
              <h2 className="text-3xl font-bold mb-4">Built for the future 🚀</h2>
              <p className="text-primary-foreground/90 mb-6 text-lg max-w-2xl mx-auto leading-relaxed">
                Our app uses cutting-edge QR technology with Firebase backend to ensure 
                your check-in is not only fast but also reliable and secure. Every scan 
                is processed instantly, so you can focus on what matters - having fun!
              </p>
              <div className="grid md:grid-cols-3 gap-6 mt-8">
                <div>
                  <div className="text-2xl font-bold">⚡</div>
                  <div className="text-sm opacity-90">Lightning Fast</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">🔒</div>
                  <div className="text-sm opacity-90">Secure & Private</div>
                </div>
                <div>
                  <div className="text-2xl font-bold">📱</div>
                  <div className="text-sm opacity-90">Mobile Optimized</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>
      </div>
    </div>
  );
};

export default About;