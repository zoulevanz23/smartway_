import React, { useState } from 'react';
import {
  FiBookOpen,
  FiTarget,
  FiHelpCircle,
  FiX,
  FiChevronRight,
  FiTag,
  FiInfo,
  FiZap,
  FiStar,
} from 'react-icons/fi';

interface KeyPoint {
  title: string;
  explanation: string;
}

interface SummaryData {
  overview: string;
  keyPoints: KeyPoint[] | string[];
  definitions: Record<string, string> | Array<{ term: string; definition: string }>;
  keyConcepts?: string[];
}

interface SummaryViewProps {
  summaryData: SummaryData;
}

export const SummaryView: React.FC<SummaryViewProps> = ({ summaryData }) => {
  const [selectedKeyPoint, setSelectedKeyPoint] = useState<KeyPoint | null>(null);
  const [selectedDefinition, setSelectedDefinition] = useState<{
    term: string;
    definition: string;
  } | null>(null);

  const formatDefinitions = () => {
    if (!summaryData.definitions) return [];
    if (Array.isArray(summaryData.definitions)) {
      return summaryData.definitions;
    }
    return Object.entries(summaryData.definitions).map(([term, definition]) => ({
      term,
      definition,
    }));
  };

  const formatKeyPoints = (): KeyPoint[] => {
    if (!summaryData.keyPoints) return [];

    if (
      Array.isArray(summaryData.keyPoints) &&
      summaryData.keyPoints.length > 0 &&
      typeof summaryData.keyPoints[0] === 'object' &&
      'title' in summaryData.keyPoints[0]
    ) {
      return (summaryData.keyPoints as KeyPoint[]).map((point, index) => {
        if (
          point.title.match(/^Key Point \d+$/i) ||
          point.title.match(/^Point \d+$/i) ||
          point.title.match(/^Concept \d+$/i)
        ) {
          const explanation = point.explanation || '';
          const sentences = explanation.split(/[.!?]+/);
          const firstSentence = sentences[0]?.trim() || '';
          let betterTitle = '';

          const conceptMatch = firstSentence.match(
            /(?:The concept of|The idea of|The principle of)\s+([^,]+)/i
          );
          const isMatch = firstSentence.match(/^([A-Z][^,]+?)\s+(?:is|are|refers to|involves)/);
          const subjectMatch = firstSentence.match(
            /^([A-Z][^.]{10,50}?)(?:\s+involves|\s+includes|\s+encompasses|\s+represents)/
          );

          if (conceptMatch) betterTitle = conceptMatch[1].trim();
          else if (isMatch) betterTitle = isMatch[1].trim();
          else if (subjectMatch) betterTitle = subjectMatch[1].trim();
          else {
            const words = firstSentence.split(' ').slice(0, 5);
            betterTitle = words.join(' ');
          }

          betterTitle = betterTitle.replace(/^(The|A|An)\s+/i, '').trim();
          return {
            ...point,
            title: betterTitle.length > 3 ? betterTitle : `Learning Concept ${index + 1}`,
          };
        }
        return point;
      });
    }

    if (Array.isArray(summaryData.keyPoints)) {
      return summaryData.keyPoints.map((point, index) => {
        const pointText = typeof point === 'string' ? point : String(point);
        const sentences = pointText.split(/[.!?]+/);
        const firstSentence = sentences[0]?.trim() || '';

        let title = '';
        const conceptMatch = firstSentence.match(
          /(?:The concept of|The idea of|The principle of)\s+([^,]+)/i
        );
        const isMatch = firstSentence.match(/^([A-Z][^,]+?)\s+(?:is|are|refers to|involves)/);

        if (conceptMatch) title = conceptMatch[1].trim();
        else if (isMatch) title = isMatch[1].trim();
        else if (firstSentence.length > 5 && firstSentence.length < 60) title = firstSentence;
        else {
          const words = firstSentence.split(' ').slice(0, 4);
          title = words.join(' ');
        }

        title = title.replace(/^(The|A|An)\s+/i, '').trim();
        return {
          title: title.length > 3 ? title : `Learning Concept ${index + 1}`,
          explanation: pointText,
        };
      });
    }

    return [];
  };

  const definitions = formatDefinitions();
  const keyPoints = formatKeyPoints();

  return (
    <div className="summary-container" style={{ maxWidth: '1100px', margin: '0 auto' }}>
      {/* Overview */}
      <div className="bento-tile p-4 mb-4">
        <div className="d-flex align-items-center gap-3 mb-3">
          <div
            className="d-flex align-items-center justify-content-center rounded"
            style={{
              width: 44,
              height: 44,
              backgroundColor: 'rgba(99, 102, 241, 0.15)',
              color: '#6366F1',
            }}
          >
            <FiBookOpen size={22} />
          </div>
          <div>
            <h2 className="h4 fw-bold text-bright mb-0">Study Overview</h2>
            <p className="text-bright-muted mb-0 small">Comprehensive content summary</p>
          </div>
        </div>
        <p className="text-bright mb-0 lh-lg" style={{ fontSize: '1.05rem' }}>
          {summaryData.overview}
        </p>
      </div>

      {/* Key Points */}
      {keyPoints.length > 0 && (
        <div className="mb-4">
          <div className="d-flex align-items-center gap-3 mb-3">
            <div
              className="d-flex align-items-center justify-content-center rounded"
              style={{
                width: 40,
                height: 40,
                backgroundColor: 'rgba(245, 158, 11, 0.15)',
                color: '#f59e0b',
              }}
            >
              <FiTarget size={18} />
            </div>
            <div>
              <h3 className="h5 fw-bold text-bright mb-0">Key Learning Points</h3>
              <p className="text-bright-muted mb-0 small">{keyPoints.length} concepts to master</p>
            </div>
          </div>

          <div className="row g-3">
            {keyPoints.map((point, index) => (
              <div key={index} className="col-12 col-md-6 col-lg-4">
                <div
                  className="bento-tile h-100 p-4 d-flex flex-column"
                  style={{ cursor: 'pointer', borderColor: 'rgba(245, 158, 11, 0.25)' }}
                  onClick={() => setSelectedKeyPoint(point)}
                >
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div
                      className="d-flex align-items-center justify-content-center rounded-circle flex-shrink-0"
                      style={{
                        width: 40,
                        height: 40,
                        backgroundColor: 'rgba(245, 158, 11, 0.15)',
                        color: '#f59e0b',
                      }}
                    >
                      <FiZap size={18} />
                    </div>
                    <div
                      className="d-flex align-items-center justify-content-center fw-bold rounded-circle"
                      style={{
                        marginLeft: 'auto',
                        width: 26,
                        height: 26,
                        backgroundColor: '#f59e0b',
                        color: '#fff',
                        fontSize: 12,
                      }}
                    >
                      {index + 1}
                    </div>
                  </div>
                  <h4 className="h5 fw-bold text-bright mb-0">{point.title}</h4>
                  <div className="d-flex align-items-center justify-content-between mt-auto pt-3">
                    <small className="text-bright-muted d-flex align-items-center gap-1">
                      <FiInfo size={12} />
                      Tap to explore
                    </small>
                    <FiChevronRight size={16} className="text-accent-yellow" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Definitions */}
      {definitions.length > 0 && (
        <div className="mb-4">
          <div className="d-flex align-items-center gap-3 mb-3">
            <div
              className="d-flex align-items-center justify-content-center rounded"
              style={{
                width: 40,
                height: 40,
                backgroundColor: 'rgba(16, 185, 129, 0.15)',
                color: '#10b981',
              }}
            >
              <FiHelpCircle size={18} />
            </div>
            <div>
              <h3 className="h5 fw-bold text-bright mb-0">Key Definitions</h3>
              <p className="text-bright-muted mb-0 small">{definitions.length} essential terms</p>
            </div>
          </div>

          <div className="row g-3">
            {definitions.map((def, index) => (
              <div key={index} className="col-12 col-sm-6 col-lg-4">
                <div
                  className="bento-tile h-100 p-3"
                  style={{ cursor: 'pointer', borderColor: 'rgba(16, 185, 129, 0.25)' }}
                  onClick={() =>
                    setSelectedDefinition({ term: def.term, definition: def.definition })
                  }
                >
                  <div className="d-flex align-items-start gap-2">
                    <FiTag size={14} className="text-success mt-1 flex-shrink-0" />
                    <div>
                      <h6 className="fw-bold text-bright mb-1">{def.term}</h6>
                      <p className="text-bright-muted small mb-0 lh-base">
                        {def.definition.length > 100
                          ? `${def.definition.substring(0, 100)}...`
                          : def.definition}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Point Modal */}
      {selectedKeyPoint && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: 'rgba(14, 16, 24, 0.8)', zIndex: 1050, padding: '1rem' }}
          onClick={() => setSelectedKeyPoint(null)}
        >
          <div
            className="p-4 p-md-5"
            style={{
              backgroundColor: '#171a26',
              border: '2px solid rgba(245, 158, 11, 0.4)',
              borderRadius: '18px',
              maxWidth: '700px',
              width: '100%',
              maxHeight: '85vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex align-items-start justify-content-between mb-4">
              <div className="d-flex align-items-center gap-3">
                <div
                  className="d-flex align-items-center justify-content-center rounded-circle"
                  style={{ width: 48, height: 48, backgroundColor: '#f59e0b', color: '#fff' }}
                >
                  <FiStar size={22} />
                </div>
                <div>
                  <h3 className="fw-bold text-bright mb-0">{selectedKeyPoint.title}</h3>
                  <small className="text-bright-muted">Key Learning Point</small>
                </div>
              </div>
              <button
                className="btn text-bright-muted p-2"
                onClick={() => setSelectedKeyPoint(null)}
                style={{ border: 'none', background: 'none' }}
                aria-label="Close"
              >
                <FiX size={22} />
              </button>
            </div>
            <div
              className="p-4 rounded"
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.2)',
              }}
            >
              <p className="text-bright mb-0 lh-lg" style={{ fontSize: '1.05rem' }}>
                {selectedKeyPoint.explanation}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Definition Modal */}
      {selectedDefinition && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: 'rgba(14, 16, 24, 0.8)', zIndex: 1050, padding: '1rem' }}
          onClick={() => setSelectedDefinition(null)}
        >
          <div
            className="p-4 p-md-5"
            style={{
              backgroundColor: '#171a26',
              border: '2px solid rgba(16, 185, 129, 0.4)',
              borderRadius: '18px',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex align-items-start justify-content-between mb-4">
              <div className="d-flex align-items-center gap-3">
                <div
                  className="d-flex align-items-center justify-content-center rounded-circle"
                  style={{ width: 44, height: 44, backgroundColor: '#10b981', color: '#fff' }}
                >
                  <FiTag size={18} />
                </div>
                <div>
                  <h4 className="fw-bold text-bright mb-0">{selectedDefinition.term}</h4>
                  <small className="text-bright-muted">Definition</small>
                </div>
              </div>
              <button
                className="btn text-bright-muted p-2"
                onClick={() => setSelectedDefinition(null)}
                style={{ border: 'none', background: 'none' }}
                aria-label="Close"
              >
                <FiX size={22} />
              </button>
            </div>
            <div
              className="p-4 rounded"
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
              }}
            >
              <p className="text-bright mb-0 lh-lg" style={{ fontSize: '1.05rem' }}>
                {selectedDefinition.definition}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
