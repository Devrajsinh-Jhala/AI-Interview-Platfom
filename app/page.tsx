"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  Code,
  FileCode,
  Layout,
  MessagesSquare,
  Play,
  Sparkles,
  TimerIcon,
  MoveRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function Home() {
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.1], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.1], [1, 0.97]);

  // Animated typing effect for the hero text
  const phrases = [
    "Ace your next tech interview.",
    "Land your dream job.",
    "Master DSA challenges.",
    "Excel at system design.",
  ];
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [currentText, setCurrentText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [typingSpeed, setTypingSpeed] = useState(100);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const currentPhrase = phrases[currentPhraseIndex];

      if (isDeleting) {
        setCurrentText(currentPhrase.substring(0, currentText.length - 1));
        setTypingSpeed(50);
      } else {
        setCurrentText(currentPhrase.substring(0, currentText.length + 1));
        setTypingSpeed(100);
      }

      // If typing complete, start deleting after a pause
      if (!isDeleting && currentText === currentPhrase) {
        setTypingSpeed(1500);
        setIsDeleting(true);
      }

      // If deleted completely, move to next phrase
      if (isDeleting && currentText === "") {
        setIsDeleting(false);
        setTypingSpeed(500);
        setCurrentPhraseIndex((currentPhraseIndex + 1) % phrases.length);
      }
    }, typingSpeed);

    return () => clearTimeout(timeout);
  }, [currentText, currentPhraseIndex, isDeleting, typingSpeed, phrases]);

  return (
    <div className="min-h-screen ">
      {/* Navigation */}
      <header className="fixed top-0 left-0 w-full z-50 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-10 py-4 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Link href="/" className="text-2xl font-bold gradient-text">
              InterviewPro AI
            </Link>
          </motion.div>

          <motion.nav
            className="hidden md:flex items-center gap-6"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Link
              href="#features"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              How It Works
            </Link>
          </motion.nav>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Button asChild>
              <Link href="/interview/configure">Start Interview</Link>
            </Button>
          </motion.div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
        <div className="hero-glow"></div>
        <motion.div
          className="container mx-auto px-10 text-center"
          style={{ opacity, scale }}
        >
          <motion.h1
            className="text-4xl md:text-6xl font-bold tracking-tight mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            AI-Powered Interview Practice <br />
            <span className="gradient-text min-h-[1.2em] inline-block">
              {currentText}
              <span className="typing-cursor"></span>
            </span>
          </motion.h1>

          <motion.p
            className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Practice technical interviews with our AI interviewer that simulates
            real-world scenarios, provides real-time feedback, and helps you
            improve your coding skills.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Button size="lg" asChild className="group">
              <Link href="/interview/configure">
                Start Practicing
                <MoveRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="gap-2">
              <Play className="h-4 w-4" /> Watch Demo
            </Button>
          </motion.div>
        </motion.div>

        {/* Mockup Preview */}
        <motion.div
          className="container mx-auto px-10 mt-20"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.6 }}
        >
          <div className="relative max-w-5xl mx-auto">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-blue-600 to-violet-600 rounded-lg blur opacity-30"></div>
            <div className="relative bg-slate-900 rounded-lg border border-slate-800 shadow-2xl overflow-hidden">
              <div className="flex h-10 items-center px-10 border-b border-slate-800">
                <div className="flex space-x-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
              </div>
              <div className="grid grid-cols-2">
                <div className="border-r border-slate-800 p-4 h-[400px] flex flex-col">
                  <div className="flex items-center justify-center bg-slate-800 rounded-lg h-2/3 mb-4">
                    <div className="text-center text-slate-400">
                      <MessagesSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">AI Interviewer Video</p>
                    </div>
                  </div>
                  <div className="bg-slate-800 rounded-lg flex-1 p-3">
                    <div className="flex gap-3 mb-3">
                      <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                        AI
                      </div>
                      <div className="bg-slate-700 rounded-lg p-2 text-xs text-slate-300">
                        Explain how you would design a URL shortening service.
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="h-8 w-8 bg-green-600 rounded-full flex items-center justify-center">
                        You
                      </div>
                      <div className="bg-slate-700 rounded-lg p-2 text-xs text-slate-300">
                        I would start by discussing the requirements...
                      </div>
                    </div>
                  </div>
                </div>
                <div className="p-4 h-[400px] flex flex-col">
                  <div className="bg-slate-800 rounded-lg flex-1 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-400">
                        Code Editor
                      </span>
                      <div className="flex gap-2">
                        <span className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-300">
                          Python
                        </span>
                        <span className="text-xs px-2 py-1 rounded bg-slate-700 text-slate-300">
                          JavaScript
                        </span>
                      </div>
                    </div>
                    <div className="font-mono text-xs text-slate-300">
                      <div>
                        <span className="text-slate-500">1</span>{" "}
                        <span className="text-blue-400">class</span>{" "}
                        <span className="text-green-400">URLShortener</span>:
                      </div>
                      <div>
                        <span className="text-slate-500">2</span>{" "}
                        <span className="text-blue-400">def</span>{" "}
                        <span className="text-yellow-400">__init__</span>(self):
                      </div>
                      <div>
                        <span className="text-slate-500">3</span> self.url_map ={" "}
                        {}
                      </div>
                      <div>
                        <span className="text-slate-500">4</span> self.chars ={" "}
                        <span className="text-orange-400">
                          "abcdefghijklmnopqrstuvwxyzABCDEF"
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500">5</span>{" "}
                      </div>
                      <div>
                        <span className="text-slate-500">6</span>{" "}
                        <span className="text-blue-400">def</span>{" "}
                        <span className="text-yellow-400">shorten</span>(self,
                        long_url):
                      </div>
                      <div>
                        <span className="text-slate-500">7</span>{" "}
                        <span className="text-blue-400">import</span> random
                      </div>
                      <div>
                        <span className="text-slate-500">8</span> code ={" "}
                        <span className="text-orange-400">""</span>
                      </div>
                      <div>
                        <span className="text-slate-500">9</span>{" "}
                        <span className="text-blue-400">for</span> _{" "}
                        <span className="text-blue-400">in</span> range(
                        <span className="text-purple-400">6</span>):
                      </div>
                      <div>
                        <span className="text-slate-500">10</span> code +=
                        random.choice(self.chars)
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-800 rounded-lg mt-4 p-3 h-1/3">
                    <div className="text-xs text-slate-400 mb-2">
                      Problem Statement
                    </div>
                    <div className="text-xs text-slate-300">
                      Design a URL shortening service like bit.ly that takes in
                      a long URL and returns a shorter, unique URL.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Trusted by companies */}
        <div className="container mx-auto px-10 mt-20">
          <div className="text-center text-sm text-muted-foreground mb-6">
            Prepare for interviews at top companies
          </div>
          <div className="flex flex-wrap justify-center gap-8 md:gap-16">
            {["Google", "Amazon", "Microsoft", "Meta", "Apple", "Netflix"].map(
              (company, index) => (
                <motion.div
                  key={company}
                  className="text-xl font-bold text-muted-foreground opacity-70"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                >
                  {company}
                </motion.div>
              )
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-slate-50 dark:bg-slate-900">
        <div className="container mx-auto px-10">
          <div className="text-center mb-16">
            <motion.h2
              className="text-3xl md:text-4xl font-bold mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              Everything You Need to Ace Your Interview
            </motion.h2>
            <motion.p
              className="text-xl text-muted-foreground max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Our platform combines AI technology with practical interview
              scenarios to give you the best preparation experience.
            </motion.p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                title: "Real-time Video Interview",
                description:
                  "Practice with an AI interviewer that responds to your explanations and adapts to your performance.",
                icon: <MessagesSquare className="h-6 w-6" />,
                delay: 0,
              },
              {
                title: "Interactive Code Editor",
                description:
                  "Solve DSA problems with our integrated Monaco editor that supports multiple programming languages.",
                icon: <Code className="h-6 w-6" />,
                delay: 0.2,
              },
              {
                title: "System Design Practice",
                description:
                  "Explain your approach to complex system design problems and get feedback on your solutions.",
                icon: <Layout className="h-6 w-6" />,
                delay: 0.4,
              },
              {
                title: "Company-Specific Questions",
                description:
                  "Practice with interview questions tailored to your target companies like Google, Amazon, and more.",
                icon: <FileCode className="h-6 w-6" />,
                delay: 0,
              },
              {
                title: "Detailed Feedback",
                description:
                  "Receive comprehensive feedback on your technical skills, communication, and problem-solving approach.",
                icon: <Sparkles className="h-6 w-6" />,
                delay: 0.2,
              },
              {
                title: "Timed Challenges",
                description:
                  "Practice under realistic time constraints to build speed and confidence for your actual interview.",
                icon: <TimerIcon className="h-6 w-6" />,
                delay: 0.4,
              },
            ].map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: feature.delay }}
                className="card-hover"
              >
                <Card className="h-full border-none shadow-md">
                  <CardHeader>
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-2">
                      {feature.icon}
                    </div>
                    <CardTitle>{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20">
        <div className="container mx-auto px-10">
          <div className="text-center mb-16">
            <motion.h2
              className="text-3xl md:text-4xl font-bold mb-4"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              How It Works
            </motion.h2>
            <motion.p
              className="text-xl text-muted-foreground max-w-2xl mx-auto"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              Start preparing for your next technical interview in three simple
              steps.
            </motion.p>
          </div>

          <div className="relative max-w-4xl mx-auto">
            {/* Connection Lines */}
            <div className="absolute hidden md:block left-1/2 top-24 bottom-24 w-0.5 bg-gray-200 dark:bg-gray-800 -translate-x-1/2"></div>

            {/* Steps */}
            {[
              {
                number: "01",
                title: "Choose Your Focus",
                description:
                  "Select the companies you're targeting, the type of interview (DSA, System Design, or both), and your desired difficulty level.",
              },
              {
                number: "02",
                title: "Practice with AI",
                description:
                  "Enter our virtual interview room with video chat and code editor. Explain your approach and implement your solution in real-time.",
              },
              {
                number: "03",
                title: "Get Expert Feedback",
                description:
                  "Receive detailed feedback on your performance, including technical assessment, communication skills, and areas for improvement.",
              },
            ].map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: index * 0.2 }}
                className="flex flex-col md:flex-row items-center gap-6 mb-16"
              >
                <div
                  className={`md:w-1/2 ${index % 2 !== 0 ? "md:order-2" : ""}`}
                >
                  <div className="relative aspect-video bg-slate-100 dark:bg-slate-800 rounded-lg overflow-hidden">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-6xl font-bold gradient-text">
                        {step.number}
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  className={`md:w-1/2 ${
                    index % 2 !== 0 ? "md:order-1 md:text-right" : ""
                  }`}
                >
                  <h3 className="text-2xl font-bold mb-4">{step.title}</h3>
                  <p className="text-muted-foreground">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-slate-900 text-white">
        <div className="container mx-auto px-10">
          <motion.div
            className="max-w-3xl mx-auto text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Ace Your Next Tech Interview?
            </h2>
            <p className="text-xl text-slate-300 mb-8">
              Start practicing with our AI interviewer today and improve your
              chances of landing your dream job.
            </p>
            <Button size="lg" variant="default" asChild className="group">
              <Link href="/interview/configure">
                Start Free Practice
                <MoveRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 text-slate-300 py-12">
        <div className="container mx-auto px-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-2">
              <Link
                href="/"
                className="text-2xl font-bold text-white mb-6 block"
              >
                InterviewPro AI
              </Link>
              <p className="text-slate-400 max-w-md">
                An AI-powered platform that helps developers practice technical
                interviews and improve their coding skills.
              </p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Links</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="#features"
                    className="hover:text-white transition-colors"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="#how-it-works"
                    className="hover:text-white transition-colors"
                  >
                    How It Works
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="#" className="hover:text-white transition-colors">
                    Cookie Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <Separator className="my-8 bg-slate-800" />

          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-slate-400">
              © {new Date().getFullYear()} InterviewPro AI. All rights reserved.
            </p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <a
                href="#"
                aria-label="Twitter"
                className="hover:text-white transition-colors"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                </svg>
              </a>
              <a
                href="#"
                aria-label="GitHub"
                className="hover:text-white transition-colors"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"></path>
                </svg>
              </a>
              <a
                href="#"
                aria-label="LinkedIn"
                className="hover:text-white transition-colors"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452z"></path>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
