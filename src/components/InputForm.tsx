import React, { useState } from 'react';
import { FiFileText, FiUpload, FiZap } from 'react-icons/fi';
import { FileDropUpload } from './FileDropUpload';
import { CountSelector } from './CountSelector';
import { type GenerationSettings } from '@api/generate';
import { type UploadResult } from '@utils/uploadFile';

interface InputFormProps {
  onSubmit: (data: { text?: string; fileUrl?: string }) => void;
  isLoading: boolean;
  settings: GenerationSettings;
  onSettingsChange: (settings: GenerationSettings) => void;
}

export const InputForm: React.FC<InputFormProps> = ({ onSubmit, isLoading, settings, onSettingsChange }) => {
  const [notes, setNotes] = useState('');
  const [inputMethod, setInputMethod] = useState<'text' | 'file'>('text');
  // FileDropUpload owns the upload and hands back the finished result. This holds
  // that result so the submit button can enable once the upload succeeds.
  const [fileResult, setFileResult] = useState<UploadResult | null>(null);
  // Bumping this remounts FileDropUpload, clearing its internal success panel.
  const [fileEpoch, setFileEpoch] = useState(0);

  const switchToText = () => {
    setInputMethod('text');
    setFileResult(null);
    setFileEpoch((e) => e + 1);
  };

  const switchToFile = () => {
    setInputMethod('file');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMethod === 'text' && notes.trim()) { onSubmit({ text: notes.trim() }); }
    else if (inputMethod === 'file' && fileResult) { onSubmit({ fileUrl: fileResult.downloadURL }); }
  };

  const canSubmit = (inputMethod === 'text' && !!notes.trim()) || (inputMethod === 'file' && !!fileResult);

  return (
    <div className="card-glass p-4 mx-auto" style={{ maxWidth: '800px' }}>
      <div className="text-center mb-4">
        <h2 className="text-bright fw-bold fs-4 mb-2">Create Your Study Pack</h2>
        <p className="text-bright-muted mb-0">Choose your preferred input method below</p>
      </div>

      <div className="d-flex gap-2 mb-4 justify-content-center">
        <button type="button" onClick={switchToText} className={`btn ${inputMethod === 'text' ? 'btn-primary' : 'btn-outline-primary'} d-flex align-items-center gap-2 px-4 py-2`}><FiFileText size={18} /><span>Type Text</span></button>
        <button type="button" onClick={switchToFile} className={`btn ${inputMethod === 'file' ? 'btn-primary' : 'btn-outline-primary'} d-flex align-items-center gap-2 px-4 py-2`}><FiUpload size={18} /><span>Upload Document</span></button>
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
            <FileDropUpload
              key={fileEpoch}
              onUploadComplete={setFileResult}
              onUploadError={() => { /* FileDropUpload shows the error itself */ }}
              disabled={isLoading}
            />
            {/* FileDropUpload renders its own error alert, so don't repeat it here. */}
          </>
        )}

        <div className="border-top pt-3 mt-3 mb-4" style={{ borderColor: 'rgba(129,140,248,0.18) !important' }}>
          <div className="d-flex align-items-center justify-content-between mb-3 flex-wrap gap-2">
            <h3 className="text-bright fw-bold fs-6 mb-0">How much content?</h3>
            <span className="text-bright-muted small">
              {settings.flashcardCount} flashcards · {settings.quizCount} quiz questions
            </span>
          </div>
          <CountSelector
            id="flashcardCount"
            label="Flashcards"
            value={settings.flashcardCount}
            disabled={isLoading}
            accent="#8b5cf6"
            onChange={(flashcardCount) => onSettingsChange({ ...settings, flashcardCount })}
          />
          <CountSelector
            id="quizCount"
            label="Quiz questions"
            value={settings.quizCount}
            disabled={isLoading}
            accent="#f59e0b"
            onChange={(quizCount) => onSettingsChange({ ...settings, quizCount })}
          />
        </div>

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
          <div className="text-bright-muted small">
            <strong>You'll get:</strong> Smart Summary • {settings.flashcardCount} Interactive Flashcards • {settings.quizCount} Quiz
            Questions
          </div>
        </div>
      </form>
    </div>
  );
};