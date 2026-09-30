import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStudyPackStore } from '@store/studyPackStore';
import type { StudyPackResult, StudyPackRecord } from '@api/generate';

export function useStudyPack() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const packs = useStudyPackStore((s) => s.packs);
  const history = useStudyPackStore((s) => s.history);
  const setPack = useStudyPackStore((s) => s.setPack);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local History first — a saved record is authoritative, so opening one never
  // triggers a network call or a regeneration.
  const record: StudyPackRecord | undefined = slug ? history.find((r) => r.id === slug) : undefined;
  const currentPack: StudyPackResult | undefined = record?.pack ?? (slug ? packs[slug] : undefined);

  useEffect(() => {
    if (!slug || currentPack) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/pack/${slug}`)
      .then((res) => { if (!res.ok) throw new Error('Pack not found'); return res.json(); })
      .then((data) => { if (!cancelled) { setPack(slug, data); setLoading(false); } })
      .catch((err) => { if (!cancelled) { setError(err.message); setLoading(false); navigate('/app'); } });
    return () => { cancelled = true; };
  }, [slug, currentPack, navigate, setPack]);

  const saveLocally = async (pack: StudyPackResult): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(pack));
    try { await crypto.subtle.digest('SHA-256', data); } catch { /* ignore */ }
    const newSlug = crypto.randomUUID?.() || Math.random().toString(36).slice(2, 15);
    setPack(newSlug, pack);
    return newSlug;
  };

  return { currentPack, record, loading, error, saveLocally, packs };
}