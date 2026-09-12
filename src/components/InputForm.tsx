import React, { useState } from 'react';
import { FiFileText, FiUpload, FiZap } from 'react-icons/fi';
import { FileDropUpload } from './FileDropUpload';
import { useUpload } from '@hooks/useUpload';

interface InputFormProps {
  onSubmit: (data: { text?: string; fileUrl?: string }) => void;
  isLoading: boolean;
}

export const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading }) => {
  const [notes, setNotes] = useState('');
  const [inputMethod, setInputMethod] = useState<'text' | 'file'>('text');
  const { error, result, doUpload, reset } = useUpload();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMethod === 'text' && notes.trim()) { onSubmit({ text: notes.trim() }); }
    else if (inputMethod === 'file' && result) { onSubmit({ fileUrl: result.downloadURL }); }
  };

  const canSubmit = (inputMethod === 'text' && notes.trim()) || (inputMethod === 'file' && result);

  return (
    <div className="card-glass p-4 mx-auto" style={{ maxWidth: '800px' }}>
      <div className="text-center mb-4">
        <h2 className="text-bright fw-bold fs-4 mb-2">Create Your Study Pack</h2>
        <p className="text-bright-muted mb-0">Choose your preferred input method below</p>
      </div>

      <div className="d-flex gap-2 mb-4 justify-content-center">
        <button type="button" onClick={() => { setInputMethod('text'); reset(); }} className={`btn ${inputMethod === 'text' ? 'btn-primary' : 'btn-outline-primary'} d-flex align-items-center gap-2 px-4 py-2`}><FiFileText size={18} /><span>Type Text</span></button>
        <button type="button" onClick={() => setInputMethod('file')} className={`btn ${inputMethod === 'file' ? 'btn-primary' : 'btn-outline-primary'} d-flex align-items-center gap-2 px-4 py-2`}><FiUpload size={18} /><span>Upload Document</span></button>
      </div>

      <form onSubmit={handleSubmit}>
        {inputMethod === 'text' ? (
          <div className="mb-4">
            <label htmlFor="notes" className="form-label fw-semibold fs-6 mb-3">Your Study Material</label>
            <textarea id="notes" className="form-control" rows={8} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Paste your notes, lecture content, textbook chapters, or any study material here..." style={{ resize: 'vertical', fontSize: '16px', lineHeight: 1.5 }} disabled={isLoading} />
            <div className="text-bright-muted small mt-2 px-1">The more detailed your content, the better your study pack will be.</div>
          </div>
        ) : (
          <>
            <FileDropUpload onUploadComplete={doUpload} onUploadError={() => {}} disabled={isLoading} />
            {error && <div className="alert alert-danger mb-3" role="alert">{error}</div>}
          </>
        )}

        <div className="d-grid">
          <button type="submit" disabled={!canSubmit || isLoading} className="btn btn-primary btn-lg fw-bold" style={{ borderRadius: '10px', padding: '0.8rem 1.5rem', fontSize: '16px' }}>
            {isLoading ? (
              <span className="d-flex align-items-center justify-content-center gap-2"><span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>{inputMethod === 'file' ? 'Processing Document...' : 'Generating Study Pack...'}</span>
            ) : (
              <span className="d-flex align-items-center justify-content-center gap-2"><FiZap size={18} />Generate Study Pack</span>
            )}
          </button>
        </div>

        <div className="text-center mt-4">
          <div className="text-bright-muted small"><strong>What you'll get:</strong> Smart Summary • Interactive Flashcards • Adaptive Quiz</div>
        </div>
      </form>
    </div>
  );
};