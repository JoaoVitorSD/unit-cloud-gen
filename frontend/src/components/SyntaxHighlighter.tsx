// Simple syntax highlighter
const SyntaxHighlighter = ({ children, language }: { children: string; language: string }) => {
  const highlightCode = (code: string, lang: string) => {
    // Keywords for different languages
    const keywords = {
      javascript: [
        "function",
        "const",
        "let",
        "var",
        "if",
        "else",
        "for",
        "while",
        "return",
        "class",
        "import",
        "export",
        "async",
        "await",
        "try",
        "catch",
        "new",
        "this",
      ],
      python: [
        "def",
        "class",
        "if",
        "elif",
        "else",
        "for",
        "while",
        "return",
        "import",
        "from",
        "as",
        "try",
        "except",
        "with",
        "lambda",
        "yield",
        "async",
        "await",
      ],
      java: [
        "public",
        "private",
        "protected",
        "class",
        "interface",
        "extends",
        "implements",
        "if",
        "else",
        "for",
        "while",
        "return",
        "new",
        "static",
        "final",
        "abstract",
        "try",
        "catch",
      ],
      go: [
        "func",
        "var",
        "const",
        "if",
        "else",
        "for",
        "range",
        "return",
        "package",
        "import",
        "type",
        "struct",
        "interface",
        "go",
        "chan",
        "select",
        "defer",
      ],
      typescript: [
        "function",
        "const",
        "let",
        "var",
        "if",
        "else",
        "for",
        "while",
        "return",
        "class",
        "import",
        "export",
        "interface",
        "type",
        "async",
        "await",
        "try",
        "catch",
      ],
      rust: [
        "fn",
        "let",
        "mut",
        "const",
        "if",
        "else",
        "for",
        "while",
        "return",
        "struct",
        "enum",
        "impl",
        "trait",
        "use",
        "mod",
        "pub",
        "match",
        "async",
        "await",
      ],
    };

    let highlighted = code;
    const langKeywords = keywords[lang as keyof typeof keywords] || [];

    // Highlight keywords
    langKeywords.forEach((keyword) => {
      const regex = new RegExp(`\\b${keyword}\\b`, "g");
      highlighted = highlighted.replace(
        regex,
        `<span class="text-blue-400 font-semibold">${keyword}</span>`
      );
    });

    // Highlight strings
    highlighted = highlighted.replace(
      /(["'`])((?:\\.|(?!\1)[^\\])*?)\1/g,
      '<span class="text-green-400">$1$2$1</span>'
    );

    // Highlight comments
    highlighted = highlighted.replace(
      /\/\/.*$/gm,
      '<span class="text-gray-500 italic">$&</span>'
    );
    highlighted = highlighted.replace(
      /\/\*[\s\S]*?\*\//g,
      '<span class="text-gray-500 italic">$&</span>'
    );
    highlighted = highlighted.replace(
      /#.*$/gm,
      '<span class="text-gray-500 italic">$&</span>'
    );

    // Highlight numbers
    highlighted = highlighted.replace(
      /\b\d+\.?\d*\b/g,
      '<span class="text-orange-400">$&</span>'
    );

    // Highlight operators
    highlighted = highlighted.replace(
      /[+\-*/%=<>!&|^~]/g,
      '<span class="text-purple-400">$&</span>'
    );

    return highlighted;
  };

  return (
    <pre className="bg-slate-950 text-slate-50 p-4 rounded-md overflow-auto font-mono text-sm h-full leading-relaxed">
      <code
        dangerouslySetInnerHTML={{
          __html: highlightCode(children, language),
        }}
      />
    </pre>
  );
};

export default SyntaxHighlighter;