export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FBFBFB] flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#8A70D6] to-[#5B3FBF] flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, white 0%, transparent 50%), radial-gradient(circle at 80% 20%, white 0%, transparent 50%)' }} />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <span className="text-white font-black text-lg">C</span>
          </div>
          <span className="text-white font-black text-2xl">Codentia</span>
        </div>

        {/* Main copy */}
        <div className="relative space-y-6">
          <h1 className="text-white text-4xl font-black leading-tight">
            Learn to code.<br />
            Build real projects.<br />
            Get hired.
          </h1>
          <p className="text-purple-200 text-lg leading-relaxed">
            Hybrid learning — video lessons, live classes twice a week, and an AI tutor available 24/7.
          </p>
          <div className="space-y-3">
            {[
              { icon: '🤖', text: 'AI coding tutor — always available' },
              { icon: '🎥', text: 'Live classes every Tuesday & Thursday' },
              { icon: '🚀', text: 'Real projects for your portfolio' },
              { icon: '📈', text: 'Track your progress in real time' },
            ].map(f => (
              <div key={f.text} className="flex items-center gap-3">
                <span className="text-lg">{f.icon}</span>
                <span className="text-purple-100 text-sm">{f.text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonial */}
        <div className="relative bg-white/10 rounded-2xl p-5 backdrop-blur-sm">
          <p className="text-purple-100 text-sm italic leading-relaxed">
            &ldquo;Codentia&apos;s AI tutor helped me debug code at midnight. I landed my first dev job 6 months after enrolling.&rdquo;
          </p>
          <div className="flex items-center gap-3 mt-3">
            <div className="w-8 h-8 rounded-full bg-white/30 flex items-center justify-center text-xs font-bold text-white">AO</div>
            <div>
              <p className="text-white text-xs font-semibold">Ada Okafor</p>
              <p className="text-purple-300 text-xs">Frontend Developer</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right: auth form */}
      <div className="flex-1 flex items-center justify-center p-6">
        {children}
      </div>
    </div>
  )
}