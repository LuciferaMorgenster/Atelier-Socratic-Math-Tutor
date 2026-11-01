import React from 'react';
import katex from 'katex';

interface MathRendererProps {
  content: string;
  className?: string;
}

/**
 * Parses markdown-like text with inline ($...$) and block ($$...$$) LaTeX expressions
 * and renders them safely using KaTeX.
 */
export const MathRenderer: React.FC<MathRendererProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Split content by $$ (block math) and $ (inline math)
  // We'll parse block math first, then inline math, then standard markdown blocks (bold, lists)
  const renderFormattedText = (rawText: string) => {
    // Break into lines to handle blockquotes, headers, lists
    const lines = rawText.split('\n');
    const elements: React.ReactNode[] = [];

    let inCodeBlock = false;
    let codeBuffer: string[] = [];

    lines.forEach((line, lineIdx) => {
      // Code block toggles
      if (line.trim().startsWith('```')) {
        if (inCodeBlock) {
          elements.push(
            <pre key={`code-${lineIdx}`} className="p-3 my-2 text-xs font-mono bg-[#EFE9DF] text-[#2A2421] rounded-lg overflow-x-auto border border-[#E0D5C3]">
              <code>{codeBuffer.join('\n')}</code>
            </pre>
          );
          codeBuffer = [];
          inCodeBlock = false;
        } else {
          inCodeBlock = true;
        }
        return;
      }

      if (inCodeBlock) {
        codeBuffer.push(line);
        return;
      }

      // Headers
      if (line.startsWith('### ')) {
        elements.push(
          <h3 key={`h3-${lineIdx}`} className="text-base font-semibold text-[#2A2421] mt-3 mb-1">
            {renderInlineMathAndFormatting(line.replace('### ', ''))}
          </h3>
        );
        return;
      }

      if (line.startsWith('## ')) {
        elements.push(
          <h2 key={`h2-${lineIdx}`} className="text-lg font-serif font-bold text-[#8C3A1E] mt-4 mb-1">
            {renderInlineMathAndFormatting(line.replace('## ', ''))}
          </h2>
        );
        return;
      }

      if (line.startsWith('# ')) {
        elements.push(
          <h1 key={`h1-${lineIdx}`} className="text-xl font-serif font-bold text-[#8C3A1E] mt-4 mb-2">
            {renderInlineMathAndFormatting(line.replace('# ', ''))}
          </h1>
        );
        return;
      }

      // Blockquotes
      if (line.startsWith('> ')) {
        elements.push(
          <blockquote key={`bq-${lineIdx}`} className="pl-3 py-1 my-2 border-l-2 border-[#C85A32] bg-[#F5EDE1]/60 text-[#473D35] italic text-sm rounded-r">
            {renderInlineMathAndFormatting(line.replace('> ', ''))}
          </blockquote>
        );
        return;
      }

      // Unordered list item
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const bulletText = line.trim().replace(/^[-*]\s+/, '');
        elements.push(
          <li key={`li-${lineIdx}`} className="ml-5 list-disc my-1 text-sm text-[#3E352F] leading-relaxed">
            {renderInlineMathAndFormatting(bulletText)}
          </li>
        );
        return;
      }

      // Numbered list item
      const numMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
      if (numMatch) {
        elements.push(
          <div key={`num-${lineIdx}`} className="flex items-start gap-2 my-1.5 text-sm text-[#3E352F]">
            <span className="font-semibold text-[#A84824] shrink-0">{numMatch[1]}.</span>
            <span className="leading-relaxed">{renderInlineMathAndFormatting(numMatch[2])}</span>
          </div>
        );
        return;
      }

      // Blank line
      if (!line.trim()) {
        elements.push(<div key={`blank-${lineIdx}`} className="h-2" />);
        return;
      }

      // Normal paragraph line
      elements.push(
        <p key={`p-${lineIdx}`} className="my-1 text-sm text-[#362E28] leading-relaxed">
          {renderInlineMathAndFormatting(line)}
        </p>
      );
    });

    return elements;
  };

  /**
   * Evaluates inline and display LaTeX ($$...$$ and $...$) as well as **bold** and *italic*
   */
  const renderInlineMathAndFormatting = (text: string): React.ReactNode => {
    // Regex for:
    // 1) $$...$$ (Display Math)
    // 2) $...$ (Inline Math)
    // 3) **...** (Bold)
    // 4) *...* (Italic)
    // 5) `...` (Inline code)
    const tokens = text.split(/(\$\$[\s\S]+?\$\$|\$[^\$\n]+?\$|\*\*[^*]+?\*\*|\*[^*]+?\*|`[^`]+?`)/g);

    return tokens.map((token, idx) => {
      if (!token) return null;

      // Display math: $$ ... $$
      if (token.startsWith('$$') && token.endsWith('$$') && token.length > 4) {
        const formula = token.slice(2, -2).trim();
        try {
          const html = katex.renderToString(formula, {
            displayMode: true,
            throwOnError: false,
          });
          return (
            <span
              key={`disp-${idx}`}
              className="block my-2 text-center overflow-x-auto text-[#1F1916]"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          return <code key={`disp-err-${idx}`} className="block text-center font-mono text-xs my-1">{formula}</code>;
        }
      }

      // Inline math: $ ... $
      if (token.startsWith('$') && token.endsWith('$') && token.length > 2) {
        const formula = token.slice(1, -1).trim();
        try {
          const html = katex.renderToString(formula, {
            displayMode: false,
            throwOnError: false,
          });
          return (
            <span
              key={`inl-${idx}`}
              className="inline-block px-0.5 text-[#1F1916]"
              dangerouslySetInnerHTML={{ __html: html }}
            />
          );
        } catch {
          return <code key={`inl-err-${idx}`} className="font-mono text-xs text-[#8C3A1E]">{formula}</code>;
        }
      }

      // Bold: ** ... **
      if (token.startsWith('**') && token.endsWith('**') && token.length >= 4) {
        return (
          <strong key={`b-${idx}`} className="font-semibold text-[#1F1916]">
            {token.slice(2, -2)}
          </strong>
        );
      }

      // Italic: * ... *
      if (token.startsWith('*') && token.endsWith('*') && token.length >= 2) {
        return (
          <em key={`em-${idx}`} className="italic text-[#4A3F38]">
            {token.slice(1, -1)}
          </em>
        );
      }

      // Inline code: ` ... `
      if (token.startsWith('`') && token.endsWith('`') && token.length >= 2) {
        return (
          <code key={`code-${idx}`} className="px-1.5 py-0.5 bg-[#EFE8DC] text-[#7A2A14] text-xs font-mono rounded">
            {token.slice(1, -1)}
          </code>
        );
      }

      // Plain string
      return <span key={`txt-${idx}`}>{token}</span>;
    });
  };

  return <div className={`math-rendered-flow ${className}`}>{renderFormattedText(content)}</div>;
};
