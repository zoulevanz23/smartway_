import React, { useState } from 'react';
import { FiDownload, FiCheck, FiShare2 } from 'react-icons/fi';

interface ExportOptionsProps {
  content: string;
  type: 'summary' | 'flashcards' | 'quiz';
}

export const ExportOptions: React.FC<ExportOptionsProps> = ({ content, type }) => {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const downloadAsText = () => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smartway-${type}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadAsMarkdown = () => {
    const markdownContent = `# SmartWay ${type.charAt(0).toUpperCase() + type.slice(1)}\n\n${content}`;
    const blob = new Blob([markdownContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `smartway-${type}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="d-flex flex-wrap gap-2 justify-content-center mt-3">
      <button
        onClick={copyToClipboard}
        className="btn btn-outline-light d-flex align-items-center gap-2 px-4 py-2"
      >
        {copied ? (
          <>
            <FiCheck className="text-success" />
            Copied!
          </>
        ) : (
          <>
            <FiShare2 />
            Copy
          </>
        )}
      </button>

      <button
        onClick={downloadAsText}
        className="btn btn-outline-light d-flex align-items-center gap-2 px-4 py-2"
      >
        <FiDownload />
        Download .txt
      </button>

      <button
        onClick={downloadAsMarkdown}
        className="btn btn-outline-light d-flex align-items-center gap-2 px-4 py-2"
      >
        <FiDownload />
        Download .md
      </button>
    </div>
  );
};
