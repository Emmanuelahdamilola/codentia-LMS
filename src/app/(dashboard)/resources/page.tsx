// PATH: src/app/(dashboard)/resources/page.tsx
import { auth }   from '@/auth'
import Link       from 'next/link'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Resources — Codentia' }

const RESOURCES = [
  { id: 'mdn-html',         category: 'HTML & CSS',        categoryColor: 'bg-orange-100 text-orange-700', type: 'Documentation', typeColor: 'bg-blue-50 text-blue-600',   title: 'MDN Web Docs — HTML',                    description: 'The definitive reference for every HTML element, attribute, and global feature, maintained by Mozilla.', url: 'https://developer.mozilla.org/en-US/docs/Web/HTML',                              readTime: '∞ Reference',  icon: '📄' },
  { id: 'mdn-css',          category: 'HTML & CSS',        categoryColor: 'bg-orange-100 text-orange-700', type: 'Documentation', typeColor: 'bg-blue-50 text-blue-600',   title: 'MDN Web Docs — CSS',                     description: 'Complete CSS reference including properties, selectors, pseudo-classes, and layout guides.', url: 'https://developer.mozilla.org/en-US/docs/Web/CSS',                               readTime: '∞ Reference',  icon: '🎨' },
  { id: 'css-flexbox',      category: 'HTML & CSS',        categoryColor: 'bg-orange-100 text-orange-700', type: 'Article',       typeColor: 'bg-green-50 text-green-700', title: 'A Complete Guide to Flexbox',            description: "CSS-Tricks's comprehensive visual guide to every flexbox property with live examples and diagrams.",  url: 'https://css-tricks.com/snippets/css/a-guide-to-flexbox/',                        readTime: '12 min read',  icon: '📐' },
  { id: 'css-grid',         category: 'HTML & CSS',        categoryColor: 'bg-orange-100 text-orange-700', type: 'Article',       typeColor: 'bg-green-50 text-green-700', title: 'A Complete Guide to CSS Grid',           description: 'Everything you need to know about CSS Grid layout, from basic concepts to advanced techniques.', url: 'https://css-tricks.com/snippets/css/complete-guide-grid/',                        readTime: '15 min read',  icon: '🔲' },
  { id: 'js-info',          category: 'JavaScript',        categoryColor: 'bg-yellow-100 text-yellow-700', type: 'Book',          typeColor: 'bg-purple-50 text-purple-700',title: 'The Modern JavaScript Tutorial',         description: 'javascript.info — a complete, up-to-date JS guide from basics to advanced topics like async/await, modules, and classes.', url: 'https://javascript.info/',                                                       readTime: 'Full course',  icon: '⚡' },
  { id: 'mdn-js',           category: 'JavaScript',        categoryColor: 'bg-yellow-100 text-yellow-700', type: 'Documentation', typeColor: 'bg-blue-50 text-blue-600',   title: 'MDN JavaScript Reference',               description: 'Official documentation for every JS built-in, operator, statement, and standard library method.', url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript',                        readTime: '∞ Reference',  icon: '📖' },
  { id: 'event-loop',       category: 'JavaScript',        categoryColor: 'bg-yellow-100 text-yellow-700', type: 'Video',         typeColor: 'bg-red-50 text-red-600',     title: 'What the heck is the event loop?',       description: "Philip Roberts's iconic JSConf talk — the clearest explanation of how JavaScript's call stack and event loop work.",         url: 'https://www.youtube.com/watch?v=8aGhZQkoFbQ',                                   readTime: '26 min video', icon: '🔄' },
  { id: 'async-await',      category: 'JavaScript',        categoryColor: 'bg-yellow-100 text-yellow-700', type: 'Article',       typeColor: 'bg-green-50 text-green-700', title: 'Async/Await — How It Works',             description: 'A plain-English walkthrough of Promises, async functions, and error handling patterns in modern JavaScript.', url: 'https://javascript.info/async-await',                                            readTime: '10 min read',  icon: '⏳' },
  { id: 'react-docs',       category: 'React',             categoryColor: 'bg-blue-100 text-blue-700',     type: 'Documentation', typeColor: 'bg-blue-50 text-blue-600',   title: 'React Official Docs (react.dev)',         description: 'The new React documentation with interactive sandboxes covering hooks, components, state, and concurrent features.', url: 'https://react.dev/',                                                             readTime: '∞ Reference',  icon: '⚛️' },
  { id: 'hooks-guide',      category: 'React',             categoryColor: 'bg-blue-100 text-blue-700',     type: 'Article',       typeColor: 'bg-green-50 text-green-700', title: 'A Complete Guide to useEffect',          description: "Dan Abramov's deep-dive into React's useEffect hook — mental models, common pitfalls, and correct patterns.",              url: 'https://overreacted.io/a-complete-guide-to-useeffect/',                          readTime: '30 min read',  icon: '🪝' },
  { id: 'react-patterns',   category: 'React',             categoryColor: 'bg-blue-100 text-blue-700',     type: 'Article',       typeColor: 'bg-green-50 text-green-700', title: 'React Component Patterns',               description: 'Common design patterns — compound components, render props, custom hooks, and Context — with real-world examples.', url: 'https://kentcdodds.com/blog/compound-components-with-react-hooks',                readTime: '12 min read',  icon: '🧩' },
  { id: 'nodejs-docs',      category: 'Backend / Node.js', categoryColor: 'bg-green-100 text-green-700',   type: 'Documentation', typeColor: 'bg-blue-50 text-blue-600',   title: 'Node.js Official Docs',                  description: 'Complete API reference for Node.js — core modules, streams, file system, HTTP, events, and more.', url: 'https://nodejs.org/en/docs/',                                                    readTime: '∞ Reference',  icon: '🟢' },
  { id: 'rest-api',         category: 'Backend / Node.js', categoryColor: 'bg-green-100 text-green-700',   type: 'Article',       typeColor: 'bg-green-50 text-green-700', title: 'REST API Design Best Practices',         description: 'A pragmatic guide to naming conventions, HTTP methods, status codes, versioning, and error handling.', url: 'https://stackoverflow.blog/2020/03/02/best-practices-for-rest-api-design/',       readTime: '14 min read',  icon: '🔌' },
  { id: 'prisma-docs',      category: 'Backend / Node.js', categoryColor: 'bg-green-100 text-green-700',   type: 'Documentation', typeColor: 'bg-blue-50 text-blue-600',   title: 'Prisma Docs',                            description: 'Official Prisma documentation covering schema definition, queries, migrations, and database integration.', url: 'https://www.prisma.io/docs/',                                                    readTime: '∞ Reference',  icon: '🗄️' },
  { id: 'git-guide',        category: 'Tools & Career',    categoryColor: 'bg-gray-100 text-gray-700',     type: 'Article',       typeColor: 'bg-green-50 text-green-700', title: 'Git — The Simple Guide',                 description: 'A no-nonsense guide to git for beginners. Covers init, commit, branch, merge, and remote workflows.', url: 'https://rogerdudler.github.io/git-guide/',                                        readTime: '5 min read',   icon: '🔀' },
  { id: 'roadmap',          category: 'Tools & Career',    categoryColor: 'bg-gray-100 text-gray-700',     type: 'Guide',         typeColor: 'bg-purple-50 text-purple-700',title: 'Developer Roadmaps — roadmap.sh',        description: 'Visual, community-driven roadmaps for frontend, backend, DevOps, React, Node.js, and more career paths.', url: 'https://roadmap.sh/',                                                            readTime: 'Self-paced',   icon: '🗺️' },
  { id: 'web-almanac',      category: 'Tools & Career',    categoryColor: 'bg-gray-100 text-gray-700',     type: 'Report',        typeColor: 'bg-indigo-50 text-indigo-700',title: 'Web Almanac — State of the Web',         description: 'Annual HTTP Archive report on performance, accessibility, SEO, and the latest trends in web development.', url: 'https://almanac.httparchive.org/en/2023/',                                        readTime: '20 min read',  icon: '📊' },
]

const CATEGORIES = ['All', ...Array.from(new Set(RESOURCES.map(r => r.category)))]

export default async function ResourcesPage() {
  await auth()

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-[26px] font-bold text-[#1A1523]" style={{ letterSpacing: '-0.025em' }}>
          Resources
        </h1>
        <p className="text-[13.5px] text-[#9591A8] mt-1">
          Curated articles, docs, and guides to deepen your understanding beyond the course lessons.
        </p>
      </div>

      {/* Category filter tabs — CSS hover only */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {CATEGORIES.map(cat => (
          <span key={cat}
            className="flex-shrink-0 px-4 py-1.5 rounded-full text-[12.5px] font-semibold cursor-pointer select-none
              border border-[#E9E7EF] bg-white text-[#9591A8]
              hover:border-[#7C5CDB] hover:text-[#7C5CDB] hover:bg-[#EDE8FF]
              transition-all duration-150"
            style={{ whiteSpace: 'nowrap' }}
          >
            {cat}
          </span>
        ))}
      </div>

      {/* Resource grid — CSS hover, no JS handlers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {RESOURCES.map((r, i) => (
          <a
            key={r.id}
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group bg-white rounded-2xl p-5 flex flex-col gap-3 no-underline animate-fade-up
              border border-[#E9E7EF] hover:border-[#C8C1E8]
              shadow-[0_2px_8px_rgba(15,13,26,0.06)] hover:shadow-[0_16px_40px_rgba(124,92,219,0.14)]
              hover:-translate-y-1 transition-all duration-[220ms] ease-[cubic-bezier(0.25,1,0.5,1)]"
            style={{ animationDelay: `${i * 40}ms` }}
          >
            {/* Top row */}
            <div className="flex items-start justify-between gap-2">
              <span className="text-[28px] leading-none">{r.icon}</span>
              <div className="flex flex-wrap gap-1.5 justify-end">
                <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${r.categoryColor}`}>{r.category}</span>
                <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${r.typeColor}`}>{r.type}</span>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1">
              <h3 className="text-[14px] font-semibold text-[#1A1523] mb-1.5 leading-snug group-hover:text-[#7C5CDB] transition-colors">
                {r.title}
              </h3>
              <p className="text-[12.5px] text-[#9591A8] leading-relaxed line-clamp-3">{r.description}</p>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-2" style={{ borderTop: '1px solid #F0EEF7' }}>
              <span className="text-[11.5px] text-[#C4C0D4] font-medium">{r.readTime}</span>
              <span className="flex items-center gap-1 text-[12px] font-semibold text-[#7C5CDB] group-hover:gap-1.5 transition-all">
                Open
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </span>
            </div>
          </a>
        ))}
      </div>

      <p className="text-center text-[12px] text-[#C4C0D4] mt-8">
        All resources open in a new tab. More will be added as the curriculum grows. 🚀
      </p>
    </div>
  )
}