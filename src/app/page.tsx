'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Video, Zap, Users, Sparkles, ArrowRight, Check } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold mb-6">
              <span className="bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Ghost Creator
              </span>
            </h1>
            <p className="text-xl sm:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              AI-powered video content creation for local businesses.
              Transform your ideas into viral-ready videos in minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/upload"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg font-semibold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
              >
                Start Creating <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <button className="inline-flex items-center px-8 py-4 border border-gray-600 rounded-lg font-semibold text-lg hover:bg-gray-800 transition-colors">
                Watch Demo
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Powerful Features for Modern Businesses
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Everything you need to create engaging video content that drives results.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Video,
                title: 'AI Video Creation',
                description: 'Generate professional videos from text, images, or voice recordings using advanced AI.'
              },
              {
                icon: Zap,
                title: 'Lightning Fast',
                description: 'Create high-quality videos in minutes, not hours. Perfect for busy entrepreneurs.'
              },
              {
                icon: Sparkles,
                title: 'Social Media Ready',
                description: 'Optimized for TikTok, Instagram, and all major platforms with perfect aspect ratios.'
              },
              {
                icon: Users,
                title: 'Team Collaboration',
                description: 'Share projects with your team and collaborate on video creation seamlessly.'
              },
              {
                icon: Check,
                title: 'Professional Quality',
                description: 'Hollywood-grade effects and transitions without the expensive equipment.'
              },
              {
                icon: ArrowRight,
                title: 'Easy Export',
                description: 'Download in any format or directly publish to social media platforms.'
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-gray-700 rounded-lg p-6 hover:bg-gray-600 transition-colors"
              >
                <feature.icon className="w-12 h-12 text-blue-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-400 max-w-2xl mx-auto">
              Choose the plan that fits your business. Start free and scale as you grow.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: 'Starter',
                price: 'Free',
                description: 'Perfect for trying out Ghost Creator',
                features: [
                  '5 videos per month',
                  'Basic AI transcription',
                  '720p export',
                  'Watermark on videos',
                  'Email support'
                ],
                cta: 'Get Started',
                popular: false
              },
              {
                name: 'Pro',
                price: '$29',
                period: '/month',
                description: 'For growing businesses',
                features: [
                  'Unlimited videos',
                  'Advanced AI features',
                  '4K export',
                  'No watermark',
                  'Priority support',
                  'Team collaboration',
                  'Custom branding'
                ],
                cta: 'Start Pro Trial',
                popular: true
              },
              {
                name: 'Enterprise',
                price: 'Custom',
                description: 'For large organizations',
                features: [
                  'Everything in Pro',
                  'White-label solution',
                  'API access',
                  'Dedicated support',
                  'Custom integrations',
                  'SLA guarantee'
                ],
                cta: 'Contact Sales',
                popular: false
              }
            ].map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
                viewport={{ once: true }}
                className={`relative bg-gray-800 rounded-lg p-8 ${
                  plan.popular ? 'ring-2 ring-blue-500' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-medium">
                      Most Popular
                    </span>
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold mb-2">
                    {plan.price}
                    {plan.period && <span className="text-lg text-gray-400">{plan.period}</span>}
                  </div>
                  <p className="text-gray-400">{plan.description}</p>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center">
                      <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                      <span className="text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <button
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-colors ${
                    plan.popular
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-gray-700 hover:bg-gray-600 text-white'
                  }`}
                >
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to Transform Your Content Creation?
            </h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of businesses using Ghost Creator to create amazing video content.
              Start your free trial today.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/upload"
                className="inline-flex items-center px-8 py-4 bg-white text-blue-600 rounded-lg font-semibold text-lg hover:bg-gray-100 transition-colors transform hover:scale-105"
              >
                Start Creating Now <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <button className="inline-flex items-center px-8 py-4 border border-white text-white rounded-lg font-semibold text-lg hover:bg-white hover:text-blue-600 transition-colors">
                Schedule Demo
              </button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="flex justify-center items-center mb-4">
              <Video className="w-8 h-8 text-blue-400 mr-2" />
              <span className="text-2xl font-bold">Ghost Creator</span>
            </div>
            <p className="text-gray-400 mb-4">
              © 2026 Ghost Creator. All rights reserved.
            </p>
            <div className="flex justify-center space-x-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Terms</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}