import React from 'react'

// ── Inline parser: **bold**, *italic*, `code` ───────────────
export function inlineMarkdown(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} className="font-bold">{part.slice(2, -2)}</strong>
    if (part.startsWith('*') && part.endsWith('*'))
      return <em key={i} className="italic">{part.slice(1, -1)}</em>
    if (part.startsWith('`') && part.endsWith('`'))
      return (
        <code key={i} className="font-mono text-[11px] bg-[#E9E3FF] text-[#6B52B8] px-1 py-0.5 rounded">
          {part.slice(1, -1)}
        </code>
      )
    return part
  })
}

// ── Block parser ────────────────────────────────────────────
export function renderMarkdown(text: string): React.ReactNode {
  const lines  = text.split('\n')
  const output: React.ReactNode[] = []
  let   key    = 0
  let   i      = 0

  while (i < lines.length) {
    const line = lines[i]

    // Fenced code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim()
      const codeLines: string[] = []
      i++
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeLines.push(lines[i])
        i++
      }
      output.push(
        <div key={key++} className="my-2 rounded-lg overflow-hidden border border-[#EBEBEB]">
          {lang && (
            <div className="px-3 py-1.5 bg-[#1E1E2E] border-b border-white/10">
              <span className="text-[10px] font-bold text-[#A48FE0] uppercase tracking-wider">{lang}</span>
            </div>
          )}
          <pre className="bg-[#1E1E2E] px-4 py-3 overflow-x-auto m-0">
            <code className="text-[#CDD6F4] font-mono text-[12px] leading-relaxed">
              {codeLines.join('\n')}
            </code>
          </pre>
        </div>
      )
      i++; continue
    }

    // Headings
    if (line.startsWith('### ')) {
      output.push(<p key={key++} className="text-[13px] font-black text-[#424040] mt-3 mb-1 first:mt-0">{inlineMarkdown(line.slice(4))}</p>)
      i++; continue
    }
    if (line.startsWith('## ')) {
      output.push(<p key={key++} className="text-[13px] font-black text-[#8A70D6] mt-3 mb-1 first:mt-0">{inlineMarkdown(line.slice(3))}</p>)
      i++; continue
    }
    if (line.startsWith('# ')) {
      output.push(<p key={key++} className="text-[14px] font-black text-[#424040] mt-2 mb-1 first:mt-0">{inlineMarkdown(line.slice(2))}</p>)
      i++; continue
    }

    // Unordered list
    if (line.match(/^[-*+] /)) {
      const items: string[] = []
      while (i < lines.length && lines[i].match(/^[-*+] /)) {
        items.push(lines[i].replace(/^[-*+] /, ''))
        i++
      }
      output.push(
        <ul key={key++} className="my-1.5 flex flex-col gap-1 pl-1">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-2 text-[13px] text-[#424040] leading-relaxed">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8A70D6] flex-shrink-0 mt-[7px]" />
              <span>{inlineMarkdown(item)}</span>
            </li>
          ))}
        </ul>
      )
      continue
    }

    // Ordered list
    if (line.match(/^\d+\. /)) {
      const items: string[] = []
      while (i < lines.length && lines[i].match(/^\d+\. /)) {
        items.push(lines[i].replace(/^\d+\. /, ''))
        i++
      }
      output.push(
        <ol key={key++} className="my-1.5 flex flex-col gap-1 pl-1">
          {items.map((item, j) => (
            <li key={j} className="flex items-start gap-2 text-[13px] text-[#424040] leading-relaxed">
              <span className="w-5 h-5 rounded-full bg-[#E9E3FF] text-[#8A70D6] text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {j + 1}
              </span>
              <span>{inlineMarkdown(item)}</span>
            </li>
          ))}
        </ol>
      )
      continue
    }

    // Horizontal rule
    if (line.match(/^---+$/)) {
      output.push(<hr key={key++} className="my-2 border-[#EBEBEB]" />)
      i++; continue
    }

    // Blank line — skip
    if (line.trim() === '') { i++; continue }

    // Paragraph
    output.push(
      <p key={key++} className="text-[13px] text-[#424040] leading-relaxed">
        {inlineMarkdown(line)}
      </p>
    )
    i++
  }

  return <div className="flex flex-col gap-1">{output}</div>
}
