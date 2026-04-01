'use client'
// PATH: src/app/(marketing)/page.tsx
import Link from 'next/link'
import { Code2, Bot, Video, Rocket, BarChart2, CheckCircle, ArrowRight, Github, Twitter } from 'lucide-react'
import { motion, useInView } from 'framer-motion'
import { useRef } from 'react'

// ── Reusable scroll-reveal wrapper ────────────────────────────────────────────
function Reveal({
  children,
  delay = 0,
  className = '',
  direction = 'up',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
  direction?: 'up' | 'left' | 'right' | 'none'
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-60px' })
  const initial =
    direction === 'up'    ? { opacity: 0, y: 28 }  :
    direction === 'left'  ? { opacity: 0, x: -28 } :
    direction === 'right' ? { opacity: 0, x: 28 }  :
                            { opacity: 0 }
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={initial}
      animate={inView ? { opacity: 1, y: 0, x: 0 } : initial}
      transition={{ type: 'spring', stiffness: 300, damping: 28, delay }}
    >
      {children}
    </motion.div>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F7F7F9] font-lato">

      {/* ── NAVBAR ─────────────────────────────────────────── */}
      <motion.header
        initial={{ y: -16, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 340, damping: 28 }}
        className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#E9E7EF]"
      >
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <motion.div
              whileHover={{ scale: 1.1, rotate: 6 }}
              whileTap={{ scale: 0.92 }}
              transition={{ type: 'spring', stiffness: 500, damping: 22 }}
              className="w-8 h-8 bg-[#7C5CDB] rounded-lg flex items-center justify-center"
            >
              <Code2 size={16} className="text-white" />
            </motion.div>
            <span className="font-bold text-[#1A1523] text-[15px]" style={{ letterSpacing: '-0.02em' }}>
              Code<span className="text-[#7C5CDB]">ntia</span>
            </span>
          </Link>

          {/* CTA buttons */}
          <div className="flex items-center gap-3">
            <Link href="/login"
              className="text-sm font-semibold text-[#1A1523] hover:text-[#7C5CDB] transition-colors hidden sm:block">
              Log in
            </Link>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} transition={{ type: 'spring', stiffness: 500, damping: 28 }}>
              <Link href="/register"
                className="bg-[#7C5CDB] text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-[#6146C4] transition-colors">
                Get Started
              </Link>
            </motion.div>
          </div>
        </div>
      </motion.header>

      {/* ── HERO ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.06, 1], opacity: [0.3, 0.4, 0.3] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#EDE8FF] rounded-full translate-x-1/3 -translate-y-1/4"
          />
          <motion.div
            animate={{ scale: [1, 1.08, 1], opacity: [0.2, 0.28, 0.2] }}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
            className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#EDE8FF] rounded-full -translate-x-1/3 translate-y-1/4"
          />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left — copy */}
            <div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 26, delay: 0.1 }}
                className="inline-flex items-center gap-2 bg-[#EDE8FF] text-[#6146C4] text-xs font-bold px-3 py-1.5 rounded-full mb-6"
              >
                <span className="w-1.5 h-1.5 bg-[#7C5CDB] rounded-full animate-pulse" />
                Live classes every Tuesday &amp; Thursday
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.18 }}
                className="text-4xl lg:text-5xl font-bold text-[#1A1523] leading-tight mb-6"
              >
                Learn Frontend &amp; Backend Development at{' '}
                <span className="text-[#7C5CDB]">Codentia</span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.26 }}
                className="text-lg text-[#9591A8] leading-relaxed mb-8"
              >
                Build real projects. Get job-ready. Combine self-paced lessons,
                live instructor classes, and an AI tutor — all in one platform.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 28, delay: 0.34 }}
                className="flex flex-wrap gap-4"
              >
                <motion.div whileHover={{ scale: 1.04, boxShadow: '0 8px 24px rgba(124,92,219,0.4)' }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 500, damping: 28 }}>
                  <Link href="/register"
                    className="inline-flex items-center gap-2 bg-[#7C5CDB] text-white font-bold px-7 py-3.5 rounded-xl transition-colors text-sm">
                    Start Learning Free <ArrowRight size={16} />
                  </Link>
                </motion.div>
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 500, damping: 28 }}>
                  <Link href="/courses"
                    className="inline-flex items-center gap-2 border-2 border-[#7C5CDB] text-[#7C5CDB] font-bold px-7 py-3.5 rounded-xl hover:bg-[#EDE8FF] transition-colors text-sm">
                    View Courses
                  </Link>
                </motion.div>
              </motion.div>

              {/* Social proof */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.5 }}
                className="flex items-center gap-6 mt-10"
              >
                {[
                  { num: '500+', label: 'Students trained' },
                  { num: '4',    label: 'Career tracks' },
                  { num: '24/7', label: 'AI tutor access' },
                ].map(({ num, label }, i) => (
                  <div key={label} className="flex items-center gap-6">
                    {i > 0 && <div className="w-px h-10 bg-[#E9E7EF]" />}
                    <div>
                      <p className="text-2xl font-bold text-[#1A1523]">{num}</p>
                      <p className="text-xs text-[#9591A8]">{label}</p>
                    </div>
                  </div>
                ))}
              </motion.div>
            </div>

            {/* Right — hero illustration */}
            <motion.div
              initial={{ opacity: 0, x: 36, scale: 0.96 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 26, delay: 0.22 }}
              className="hidden lg:block relative"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                className="bg-[#1e1e2e] rounded-2xl p-6 shadow-2xl"
              >
                {/* Window chrome */}
                <div className="flex gap-1.5 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                {/* Code */}
                <pre className="font-code text-sm leading-relaxed">
<span className="text-[#cba6f7]">const</span><span className="text-[#cdd6f4]"> student </span><span className="text-[#89dceb]">=</span><span className="text-[#cdd6f4]"> {'{'}</span>{'\n'}
<span className="text-[#cdd6f4]">  name: </span><span className="text-[#a6e3a1]">&quot;You&quot;</span><span className="text-[#cdd6f4]">,</span>{'\n'}
<span className="text-[#cdd6f4]">  skills: [</span><span className="text-[#a6e3a1]">&quot;HTML&quot;</span><span className="text-[#cdd6f4]">, </span><span className="text-[#a6e3a1]">&quot;CSS&quot;</span><span className="text-[#cdd6f4]">,</span>{'\n'}
<span className="text-[#cdd6f4]">           </span><span className="text-[#a6e3a1]">&quot;JavaScript&quot;</span><span className="text-[#cdd6f4]">,</span>{'\n'}
<span className="text-[#cdd6f4]">           </span><span className="text-[#a6e3a1]">&quot;React&quot;</span><span className="text-[#cdd6f4]">, </span><span className="text-[#a6e3a1]">&quot;Node.js&quot;</span><span className="text-[#cdd6f4]">],</span>{'\n'}
<span className="text-[#cdd6f4]">  jobReady: </span><span className="text-[#fab387]">true</span>{'\n'}
<span className="text-[#cdd6f4]">{'}'}</span>
                </pre>
                {/* AI bubble */}
                <div className="mt-5 bg-[#313244] rounded-xl p-3 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#7C5CDB] flex items-center justify-center shrink-0 mt-0.5">
                    <Bot size={12} className="text-white" />
                  </div>
                  <p className="text-[#cdd6f4] text-xs leading-relaxed">
                    Great work! Your function handles edge cases correctly.
                    Try adding error handling for null values next 🎉
                  </p>
                </div>
              </motion.div>

              {/* Floating badge */}
              <motion.div
                initial={{ opacity: 0, scale: 0.7, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 22, delay: 0.55 }}
                whileHover={{ scale: 1.05 }}
                className="absolute -top-4 -right-4 bg-white border border-[#E9E7EF] rounded-xl px-4 py-2.5 shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-xs font-bold text-[#1A1523]">Live class starting</span>
                </div>
                <p className="text-[10px] text-[#9591A8] mt-0.5">React Hooks Deep Dive · 7:00 PM</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── COURSES OVERVIEW ───────────────────────────────── */}
      <section className="py-20 bg-[#F7F7F9]">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1A1523] mb-3">Our Courses</h2>
            <p className="text-[#9591A8]">From zero to full-stack developer in four structured tracks.</p>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {COURSES.map((course, i) => (
              <Reveal key={course.title} delay={i * 0.08}>
                <motion.div whileHover={{ y: -6, boxShadow: '0 16px 40px rgba(124,92,219,0.14)' }} transition={{ type: 'spring', stiffness: 380, damping: 26 }}>
                  <Link href="/register"
                    className="bg-white rounded-2xl border border-[#E9E7EF] p-5 hover:border-[#C8C1E8] transition-all group block">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${course.color}`}>
                      <course.icon size={22} />
                    </div>
                    <h3 className="font-bold text-[#1A1523] mb-1 group-hover:text-[#7C5CDB] transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-xs text-[#9591A8] leading-relaxed mb-3">{course.desc}</p>
                    <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full ${course.badge}`}>
                      {course.level}
                    </span>
                  </Link>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY CODENTIA ───────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1A1523] mb-3">Why Codentia?</h2>
            <p className="text-[#9591A8]">A hybrid learning model built for real results.</p>
          </Reveal>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {BENEFITS.map((b, i) => (
              <Reveal key={b.title} delay={i * 0.09} className="text-center p-6">
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 24 }}
                  className="w-14 h-14 bg-[#EDE8FF] rounded-2xl flex items-center justify-center mx-auto mb-4"
                >
                  <b.icon size={24} className="text-[#7C5CDB]" />
                </motion.div>
                <h3 className="font-bold text-[#1A1523] mb-2">{b.title}</h3>
                <p className="text-sm text-[#9591A8] leading-relaxed">{b.desc}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────────────── */}
      <section className="py-20 bg-[#F7F7F9]">
        <div className="max-w-6xl mx-auto px-6">
          <Reveal className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1A1523] mb-3">Student Stories</h2>
            <p className="text-[#9591A8]">Hear from developers who got job-ready with Codentia.</p>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={i * 0.1}>
                <motion.div
                  whileHover={{ y: -5, boxShadow: '0 12px 32px rgba(15,13,26,0.1)' }}
                  transition={{ type: 'spring', stiffness: 380, damping: 26 }}
                  className="bg-white rounded-2xl border border-[#E9E7EF] p-6 h-full"
                >
                  <div className="flex mb-3">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-amber-400 text-sm">★</span>
                    ))}
                  </div>
                  <p className="text-sm text-[#1A1523] leading-relaxed mb-5 italic">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#7C5CDB] text-white text-sm font-bold flex items-center justify-center">
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-[#1A1523]">{t.name}</p>
                      <p className="text-xs text-[#9591A8]">{t.role}</p>
                    </div>
                  </div>
                </motion.div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ─────────────────────────────────────── */}
      <section className="py-20 bg-[#7C5CDB] overflow-hidden relative">
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)' }}
        />
        <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
          <Reveal direction="none">
            <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
              Ready to become a developer?
            </h2>
            <p className="text-purple-200 mb-8 text-lg">
              Join the Codentia bootcamp — your first step to a tech career.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <motion.div whileHover={{ scale: 1.05, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 460, damping: 26 }}>
                <Link href="/register"
                  className="inline-flex items-center gap-2 bg-white text-[#7C5CDB] font-bold px-8 py-4 rounded-xl hover:bg-purple-50 transition-colors">
                  Join Codentia Bootcamp <ArrowRight size={16} />
                </Link>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 460, damping: 26 }}>
                <Link href="/login"
                  className="inline-flex items-center gap-2 border-2 border-white text-white font-bold px-8 py-4 rounded-xl hover:bg-white/10 transition-colors">
                  I have an account
                </Link>
              </motion.div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer className="bg-white border-t border-[#E9E7EF] py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-[#7C5CDB] rounded-lg flex items-center justify-center">
                <Code2 size={14} className="text-white" />
              </div>
              <span className="font-bold text-[#1A1523]">Codentia</span>
            </div>
            <div className="flex gap-6 text-sm text-[#9591A8]">
              {['Courses', 'Login', 'Register'].map(l => (
                <Link key={l} href={`/${l.toLowerCase()}`}
                  className="hover:text-[#7C5CDB] transition-colors font-medium">
                  {l}
                </Link>
              ))}
            </div>
            <div className="flex gap-3">
              {[Twitter, Github].map((Icon, i) => (
                <motion.a key={i} href="#" whileHover={{ scale: 1.12, borderColor: '#7C5CDB', color: '#7C5CDB' }} transition={{ type: 'spring', stiffness: 500, damping: 26 }}
                  className="w-8 h-8 rounded-lg border border-[#E9E7EF] flex items-center justify-center text-[#9591A8] transition-colors">
                  <Icon size={14} />
                </motion.a>
              ))}
            </div>
          </div>
          <div className="border-t border-[#E9E7EF] mt-8 pt-6 text-center">
            <p className="text-xs text-[#9591A8]">
              © {new Date().getFullYear()} Codentia Interactive Coding Academy. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

    </div>
  )
}

// ── Static data ─────────────────────────────────────────────
const COURSES = [
  { title: 'HTML & CSS',    desc: 'Master semantic HTML, Flexbox, Grid, and responsive design.',           level: 'Beginner',     icon: Code2,     color: 'bg-green-100 text-green-600', badge: 'bg-green-100 text-green-700' },
  { title: 'JavaScript',   desc: 'Variables, functions, DOM, async/await, and ES6+ features.',             level: 'Intermediate', icon: Rocket,    color: 'bg-amber-100 text-amber-600', badge: 'bg-amber-100 text-amber-700' },
  { title: 'React',        desc: 'Components, hooks, state management, and real-world projects.',          level: 'Intermediate', icon: BarChart2, color: 'bg-blue-100 text-blue-600',   badge: 'bg-amber-100 text-amber-700' },
  { title: 'Backend Dev',  desc: 'Node.js, REST APIs, databases, and authentication.',                     level: 'Advanced',     icon: Bot,       color: 'bg-red-100 text-red-600',     badge: 'bg-red-100 text-red-700'    },
]
const BENEFITS = [
  { icon: Bot,      title: 'AI Coding Tutor',   desc: 'Get instant explanations, debug help, and code reviews from your personal AI tutor — available 24/7.' },
  { icon: Video,    title: 'Live Classes',       desc: 'Join instructor-led sessions twice a week. Ask questions in real time and learn with your cohort.' },
  { icon: Rocket,   title: 'Real Projects',      desc: 'Build portfolio-ready projects with every course. Get AI feedback before instructor review.' },
  { icon: BarChart2,title: 'Progress Tracking',  desc: 'See your completion stats, quiz scores, and get personalized recommendations every day.' },
]
const TESTIMONIALS = [
  { name: 'Ada Okafor',  role: 'Frontend Developer',   quote: 'The AI tutor was a game changer. Whenever I was stuck at 2am, I just asked and got a clear explanation instantly.' },
  { name: 'Emeka Nwosu', role: 'React Developer',       quote: 'Live classes twice a week kept me accountable. The hybrid model is exactly what I needed to stay on track.' },
  { name: 'John Adeyemi',role: 'Full-Stack Developer',  quote: "I went from knowing nothing to landing my first dev job in 6 months. Codentia's projects gave me a real portfolio." },
]
