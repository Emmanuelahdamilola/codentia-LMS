// PATH: src/app/(marketing)/page.tsx
import Link from 'next/link'
import { Code2, Bot, Video, Rocket, BarChart2, CheckCircle, ArrowRight, Github, Twitter } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#FBFBFB] font-lato">

      {/* ── NAVBAR ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-[#E8E4F0]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-[#8A70D6] rounded-lg flex items-center justify-center">
              <Code2 size={16} className="text-white" />
            </div>
            <span className="text-lg font-black text-[#424040]">Codentia</span>
          </Link>

          {/* Nav links */}
          <nav className="hidden md:flex items-center gap-8">
            {['Courses', 'About'].map(item => (
              <Link key={item} href={`/${item.toLowerCase()}`}
                className="text-sm font-semibold text-[#8A8888] hover:text-[#424040] transition-colors">
                {item}
              </Link>
            ))}
          </nav>

          {/* CTA buttons */}
          <div className="flex items-center gap-3">
            <Link href="/login"
              className="text-sm font-semibold text-[#424040] hover:text-[#8A70D6] transition-colors hidden sm:block">
              Log in
            </Link>
            <Link href="/register"
              className="bg-[#8A70D6] text-white text-sm font-bold px-5 py-2.5 rounded-lg hover:bg-[#6B52B8] transition-colors">
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* ── HERO ───────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#E9E3FF] rounded-full opacity-30 translate-x-1/3 -translate-y-1/4" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-[#E9E3FF] rounded-full opacity-20 -translate-x-1/3 translate-y-1/4" />
        </div>

        <div className="relative max-w-6xl mx-auto px-6 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left — copy */}
            <div>
              <div className="inline-flex items-center gap-2 bg-[#E9E3FF] text-[#6B52B8] text-xs font-bold px-3 py-1.5 rounded-full mb-6">
                <span className="w-1.5 h-1.5 bg-[#8A70D6] rounded-full animate-pulse" />
                Live classes every Tuesday &amp; Thursday
              </div>

              <h1 className="text-4xl lg:text-5xl font-black text-[#424040] leading-tight mb-6">
                Learn Frontend &amp; Backend Development at{' '}
                <span className="text-[#8A70D6]">Codentia</span>
              </h1>

              <p className="text-lg text-[#8A8888] leading-relaxed mb-8">
                Build real projects. Get job-ready. Combine self-paced lessons,
                live instructor classes, and an AI tutor — all in one platform.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link href="/register"
                  className="inline-flex items-center gap-2 bg-[#8A70D6] text-white font-bold px-7 py-3.5 rounded-xl hover:bg-[#6B52B8] transition-colors text-sm">
                  Start Learning Free <ArrowRight size={16} />
                </Link>
                <Link href="/courses"
                  className="inline-flex items-center gap-2 border-2 border-[#8A70D6] text-[#8A70D6] font-bold px-7 py-3.5 rounded-xl hover:bg-[#E9E3FF] transition-colors text-sm">
                  View Courses
                </Link>
              </div>

              {/* Social proof */}
              <div className="flex items-center gap-6 mt-10">
                <div>
                  <p className="text-2xl font-black text-[#424040]">500+</p>
                  <p className="text-xs text-[#8A8888]">Students trained</p>
                </div>
                <div className="w-px h-10 bg-[#E8E4F0]" />
                <div>
                  <p className="text-2xl font-black text-[#424040]">4</p>
                  <p className="text-xs text-[#8A8888]">Career tracks</p>
                </div>
                <div className="w-px h-10 bg-[#E8E4F0]" />
                <div>
                  <p className="text-2xl font-black text-[#424040]">24/7</p>
                  <p className="text-xs text-[#8A8888]">AI tutor access</p>
                </div>
              </div>
            </div>

            {/* Right — hero illustration (code card) */}
            <div className="hidden lg:block relative">
              <div className="bg-[#1e1e2e] rounded-2xl p-6 shadow-2xl">
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
                  <div className="w-6 h-6 rounded-full bg-[#8A70D6] flex items-center justify-center shrink-0 mt-0.5">
                    <Bot size={12} className="text-white" />
                  </div>
                  <p className="text-[#cdd6f4] text-xs leading-relaxed">
                    Great work! Your function handles edge cases correctly.
                    Try adding error handling for null values next 🎉
                  </p>
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -top-4 -right-4 bg-white border border-[#E8E4F0] rounded-xl px-4 py-2.5 shadow-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-xs font-bold text-[#424040]">Live class starting</span>
                </div>
                <p className="text-[10px] text-[#8A8888] mt-0.5">React Hooks Deep Dive · 7:00 PM</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── COURSES OVERVIEW ───────────────────────────────── */}
      <section className="py-20 bg-[#FBFBFB]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-[#424040] mb-3">Our Courses</h2>
            <p className="text-[#8A8888]">From zero to full-stack developer in four structured tracks.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {COURSES.map(course => (
              <Link key={course.title} href="/register"
                className="bg-white rounded-2xl border border-[#E8E4F0] p-5 hover:border-[#C4B8EE] hover:shadow-md transition-all group">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${course.color}`}>
                  <course.icon size={22} />
                </div>
                <h3 className="font-bold text-[#424040] mb-1 group-hover:text-[#8A70D6] transition-colors">
                  {course.title}
                </h3>
                <p className="text-xs text-[#8A8888] leading-relaxed mb-3">{course.desc}</p>
                <span className={`inline-block text-[10px] font-bold px-2.5 py-1 rounded-full ${course.badge}`}>
                  {course.level}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── WHY CODENTIA ───────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-[#424040] mb-3">Why Codentia?</h2>
            <p className="text-[#8A8888]">A hybrid learning model built for real results.</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {BENEFITS.map(b => (
              <div key={b.title} className="text-center p-6">
                <div className="w-14 h-14 bg-[#E9E3FF] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <b.icon size={24} className="text-[#8A70D6]" />
                </div>
                <h3 className="font-bold text-[#424040] mb-2">{b.title}</h3>
                <p className="text-sm text-[#8A8888] leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ───────────────────────────────────── */}
      <section className="py-20 bg-[#FBFBFB]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-[#424040] mb-3">Student Stories</h2>
            <p className="text-[#8A8888]">Hear from developers who got job-ready with Codentia.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(t => (
              <div key={t.name} className="bg-white rounded-2xl border border-[#E8E4F0] p-6">
                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className="text-amber-400 text-sm">★</span>
                  ))}
                </div>
                <p className="text-sm text-[#424040] leading-relaxed mb-5 italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[#8A70D6] text-white text-sm font-bold flex items-center justify-center">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#424040]">{t.name}</p>
                    <p className="text-xs text-[#8A8888]">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ─────────────────────────────────────── */}
      <section className="py-20 bg-[#8A70D6]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl lg:text-4xl font-black text-white mb-4">
            Ready to become a developer?
          </h2>
          <p className="text-purple-200 mb-8 text-lg">
            Join the Codentia bootcamp — your first step to a tech career.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/register"
              className="inline-flex items-center gap-2 bg-white text-[#8A70D6] font-bold px-8 py-4 rounded-xl hover:bg-purple-50 transition-colors">
              Join Codentia Bootcamp <ArrowRight size={16} />
            </Link>
            <Link href="/login"
              className="inline-flex items-center gap-2 border-2 border-white text-white font-bold px-8 py-4 rounded-xl hover:bg-white/10 transition-colors">
              I have an account
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────── */}
      <footer className="bg-white border-t border-[#E8E4F0] py-12">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 bg-[#8A70D6] rounded-lg flex items-center justify-center">
                <Code2 size={14} className="text-white" />
              </div>
              <span className="font-black text-[#424040]">Codentia</span>
            </div>

            {/* Links */}
            <div className="flex gap-6 text-sm text-[#8A8888]">
              {['Courses', 'Login', 'Register'].map(l => (
                <Link key={l} href={`/${l.toLowerCase()}`}
                  className="hover:text-[#8A70D6] transition-colors font-medium">
                  {l}
                </Link>
              ))}
            </div>

            {/* Social */}
            <div className="flex gap-3">
              <a href="#" className="w-8 h-8 rounded-lg border border-[#E8E4F0] flex items-center justify-center hover:border-[#8A70D6] hover:text-[#8A70D6] text-[#8A8888] transition-colors">
                <Twitter size={14} />
              </a>
              <a href="#" className="w-8 h-8 rounded-lg border border-[#E8E4F0] flex items-center justify-center hover:border-[#8A70D6] hover:text-[#8A70D6] text-[#8A8888] transition-colors">
                <Github size={14} />
              </a>
            </div>
          </div>

          <div className="border-t border-[#E8E4F0] mt-8 pt-6 text-center">
            <p className="text-xs text-[#8A8888]">
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
  {
    title: 'HTML & CSS',
    desc:  'Master semantic HTML, Flexbox, Grid, and responsive design.',
    level: 'Beginner',
    icon:  Code2,
    color: 'bg-green-100 text-green-600',
    badge: 'bg-green-100 text-green-700',
  },
  {
    title: 'JavaScript',
    desc:  'Variables, functions, DOM, async/await, and ES6+ features.',
    level: 'Intermediate',
    icon:  Rocket,
    color: 'bg-amber-100 text-amber-600',
    badge: 'bg-amber-100 text-amber-700',
  },
  {
    title: 'React',
    desc:  'Components, hooks, state management, and real-world projects.',
    level: 'Intermediate',
    icon:  BarChart2,
    color: 'bg-blue-100 text-blue-600',
    badge: 'bg-amber-100 text-amber-700',
  },
  {
    title: 'Backend Dev',
    desc:  'Node.js, REST APIs, databases, and authentication.',
    level: 'Advanced',
    icon:  Bot,
    color: 'bg-red-100 text-red-600',
    badge: 'bg-red-100 text-red-700',
  },
]

const BENEFITS = [
  {
    icon:  Bot,
    title: 'AI Coding Tutor',
    desc:  'Get instant explanations, debug help, and code reviews from your personal AI tutor — available 24/7.',
  },
  {
    icon:  Video,
    title: 'Live Classes',
    desc:  'Join instructor-led sessions twice a week. Ask questions in real time and learn with your cohort.',
  },
  {
    icon:  Rocket,
    title: 'Real Projects',
    desc:  'Build portfolio-ready projects with every course. Get AI feedback before instructor review.',
  },
  {
    icon:  BarChart2,
    title: 'Progress Tracking',
    desc:  'See your completion stats, quiz scores, and get personalized recommendations every day.',
  },
]

const TESTIMONIALS = [
  {
    name:  'Ada Okafor',
    role:  'Frontend Developer',
    quote: 'The AI tutor was a game changer. Whenever I was stuck at 2am, I just asked and got a clear explanation instantly.',
  },
  {
    name:  'Emeka Nwosu',
    role:  'React Developer',
    quote: 'Live classes twice a week kept me accountable. The hybrid model is exactly what I needed to stay on track.',
  },
  {
    name:  'John Adeyemi',
    role:  'Full-Stack Developer',
    quote: 'I went from knowing nothing to landing my first dev job in 6 months. Codentia\'s projects gave me a real portfolio.',
  },
]
