import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { QrCode, Users, Star, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const Home = () => {
  const features = [
    {
      icon: QrCode,
      title: 'Quick QR Scanning',
      description: 'Scan your pass in seconds with our friendly scanner',
      color: 'text-primary'
    },
    {
      icon: Users,
      title: 'Group Check-ins',
      description: 'Check in your whole family or group together',
      color: 'text-secondary'
    },
    {
      icon: Star,
      title: 'Performer Mode',
      description: 'Special check-in flow for performers and VIPs',
      color: 'text-accent'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-soft">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center max-w-4xl mx-auto"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", delay: 0.2, duration: 0.6 }}
            className="w-24 h-24 bg-gradient-primary rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-glow"
          >
            <QrCode className="w-12 h-12 text-primary-foreground" />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent"
          >
            Welcome to the GatePass App ✨
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-xl text-muted-foreground mb-8 leading-relaxed"
          >
            Hey friend! Ready for an amazing experience? 🎉<br />
            Check in quickly and easily - we've made it super simple for you!
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/check-in">
              <Button 
                size="lg" 
                className="bounce-hover bg-gradient-primary hover:opacity-90 transition-opacity text-lg px-8 py-4"
              >
                Start Check-in
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Link to="/about">
              <Button 
                variant="outline" 
                size="lg"
                className="bounce-hover text-lg px-8 py-4"
              >
                Learn More
              </Button>
            </Link>
          </motion.div>
        </motion.div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="mt-24"
        >
          <h2 className="text-3xl font-bold text-center mb-12">
            Why you'll love our check-in process 💖
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.2 + index * 0.2 }}
                >
                  <Card className="hover:shadow-soft transition-all duration-300 bounce-hover bg-card/80 backdrop-blur-sm border-border/50">
                    <CardContent className="p-8 text-center">
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 ${feature.color} bg-current/10`}
                      >
                        <Icon className={`w-8 h-8 ${feature.color}`} />
                      </motion.div>
                      <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                      <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.8, duration: 0.6 }}
          className="mt-24 text-center"
        >
          <Card className="bg-gradient-primary text-primary-foreground shadow-glow border-0">
            <CardContent className="p-12">
              <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
              <p className="text-primary-foreground/90 mb-8 text-lg">
                Join the fun! Your adventure is just one scan away 🚀
              </p>
              <Link to="/check-in">
                <Button 
                  variant="secondary"
                  size="lg"
                  className="bounce-hover text-lg px-8 py-4"
                >
                  Check In Now
                  <QrCode className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;