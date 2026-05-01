import { motion } from 'framer-motion';

const STATUS = {
  idle:          'Ready. Choose data, then press Start decryption.',
  init:          'Start point loaded. Press Next to begin round reversal.',
  addRoundKey:   'Step: AddRoundKey. XOR state bytes with the current round key.',
  invSubBytes:   'Step: InvSubBytes. Replace each byte via inverse S-Box lookup.',
  invShiftRows:  'Step: InvShiftRows. Shift rows right (1, 2, and 3 positions).',
  invMixColumns: 'Step: InvMixColumns. Rebuild each column using inverse matrix.',
  final:         'Done. Original plaintext is recovered.',
};

const SPEEDS = [
  { label: 'Slow', value: 3.5 },
  { label: 'Normal', value: 2.0 },
  { label: 'Fast', value: 0.5 },
];

const CONFIRM_LABEL = {
  addRoundKey:   'Confirm XOR →',
  invSubBytes:   'Confirm byte →',
  invShiftRows:  'Begin shift →',
  invMixColumns: 'Confirm column →',
};

export default function ControlBar({
  started, stepIndex, totalSteps, step, isPlaying, totalRounds,
  onBack, onPlayPause, onAdvance, onReset, onJumpToStep,
  speed = 2.0, onSpeedChange,
  manualMode = false, onManualToggle,
  animNeedsConfirm = false,
  animBusy = false,
}) {
  const op          = step?.op || 'idle';
  const statusMsg   = STATUS[started ? op : 'idle'];
  const round       = step?.round;
  const progress    = totalSteps > 1 ? (stepIndex / (totalSteps - 1)) * 100 : 0;

  const isLastStep      = stepIndex >= totalSteps - 1 && started;
  const advanceDisabled = !started || isLastStep;

  let primaryLabel = 'Next step →';
  let primaryStyle = 'normal';
  if (animNeedsConfirm) { primaryLabel = CONFIRM_LABEL[op] || 'Confirm →'; primaryStyle = 'confirm'; }
  else if (animBusy)    { primaryLabel = 'Skip animation ⏭'; primaryStyle = 'skip'; }

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'var(--bg-control)',
      borderTop: '1px solid var(--border)',
      zIndex: 100,
      boxShadow: '0 -2px 16px rgba(0,0,0,0.06)',
    }}>

      <div className="progress-track">
        <motion.div className="progress-fill"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      {started && totalSteps > 1 && (
        <div style={{
          display: 'grid', gridTemplateColumns: 'auto 1fr auto', alignItems: 'center',
          gap: 12, padding: '8px 28px', borderBottom: '1px solid var(--border-2)',
          background: 'color-mix(in srgb, var(--accent) 4%, var(--bg-card))',
        }}>
          <span className="eyebrow">Timeline</span>
          <input
            className="timeline-range"
            type="range"
            min={0}
            max={totalSteps - 1}
            value={stepIndex}
            disabled={animBusy}
            onChange={(e) => onJumpToStep?.(Number(e.target.value))}
            title="Drag to review any AES step"
          />
          <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: 'var(--text-3)' }}>
            Step {stepIndex + 1}
          </span>
        </div>
      )}

      {/* Status line */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '12px 28px',
        borderBottom: '1px solid var(--border-2)',
        background: 'var(--bg-card)',
      }}>
        <div className="pulse-dot" />
        <div style={{ flex: 1, display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
          <span className="eyebrow" style={{ flexShrink: 0 }}>Status</span>
          <span style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 14, fontWeight: 500,
            color: 'var(--text)', lineHeight: 1.4,
          }}>
            {statusMsg}
            {animNeedsConfirm && <span style={{ color: 'var(--accent)', marginLeft: 6 }}>· awaiting confirmation</span>}
            {animBusy && !animNeedsConfirm && <span style={{ color: 'var(--accent)', marginLeft: 6 }}>· animating…</span>}
          </span>
        </div>
        {started && totalSteps > 0 && (
          <span style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: 13, fontWeight: 600,
            color: 'var(--text-2)', whiteSpace: 'nowrap',
          }}>
            {stepIndex + 1} / {totalSteps}
          </span>
        )}
      </div>

      {/* Controls */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        gap: 12, padding: '12px 24px',
      }}>

        {/* Left — speed + mode */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
            <span className="eyebrow" style={{ marginRight: 10 }}>Speed</span>
            {SPEEDS.map((s, i) => {
              const active = speed === s.value;
              return (
                <button
                  key={s.label}
                  onClick={() => onSpeedChange?.(s.value)}
                  title={`${s.label} playback`}
                  style={{
                    fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600,
                    padding: '7px 14px',
                    border: '1px solid var(--border)',
                    borderRadius: i === 0 ? '6px 0 0 6px' : i === SPEEDS.length-1 ? '0 6px 6px 0' : '0',
                    borderLeftWidth: i === 0 ? '1px' : '0',
                    background: active ? 'var(--accent)' : 'var(--bg-card)',
                    color: active ? '#fff' : 'var(--text-3)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >{s.label}</button>
              );
            })}
          </div>

          <button
            onClick={onManualToggle}
            title="Step through each computation manually (M)"
            className={`btn-control ${manualMode ? 'active' : ''}`}
            style={{ padding: '7px 14px', fontSize: 12 }}
          >
            {manualMode ? '● Manual' : '○ Auto'}
          </button>

        </div>

        {/* Center — main controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button className="btn-control" onClick={onBack}
            disabled={!started || stepIndex === 0 || animBusy}
            title="Previous step (←)">
            ← Back
          </button>

          <button
            className={`btn-control ${isPlaying ? 'active' : ''}`}
            onClick={onPlayPause}
            disabled={!started || animNeedsConfirm}
            style={{ minWidth: 130 }}
            title={isPlaying ? 'Pause auto-play (Space)' : 'Auto-play (Space)'}
          >
            {isPlaying ? '⏸  Pause' : '▶  Auto-play'}
          </button>

          {/* SINGLE primary CTA */}
          <motion.button
            key={primaryStyle}
            onClick={onAdvance}
            disabled={advanceDisabled}
            initial={{ scale: 0.96, opacity: 0.85 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.18 }}
            style={{
              fontFamily: 'Inter, sans-serif', fontSize: 14, fontWeight: 700,
              padding: '11px 26px', minWidth: 200,
              borderRadius: 6,
              cursor: advanceDisabled ? 'not-allowed' : 'pointer',
              opacity: advanceDisabled ? 0.32 : 1,
              border: '1px solid var(--accent)',
              color: '#fff',
              background: 'var(--accent)',
              boxShadow: primaryStyle === 'confirm'
                ? '0 0 0 4px var(--accent-soft)'
                : '0 1px 3px rgba(0,0,0,0.08)',
              transition: 'background 0.15s, color 0.15s, border-color 0.15s, box-shadow 0.2s',
            }}
            title={
              primaryStyle === 'confirm' ? 'Confirm sub-step (Enter or →)'
              : primaryStyle === 'skip'  ? 'Skip current animation (→)'
              : 'Next step (→ or Enter)'
            }
          >
            {animNeedsConfirm ? (
              <motion.span
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ repeat: Infinity, duration: 1.2 }}
              >{primaryLabel}</motion.span>
            ) : (
              primaryLabel
            )}
          </motion.button>
        </div>

        {/* Right — round indicator + reset */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {started && round !== undefined && (
            <div style={{
              fontFamily: 'Inter, sans-serif', fontSize: 12, fontWeight: 600,
              color: 'var(--text-2)',
              padding: '8px 14px',
              border: '1px solid var(--border)',
              borderRadius: 6,
              background: 'var(--bg-card)',
              whiteSpace: 'nowrap',
            }}>
              Round{' '}
              <span style={{ color: 'var(--accent)', fontFamily: 'JetBrains Mono, monospace', fontSize: 14, fontWeight: 700 }}>
                {round}
              </span>
              <span style={{ color: 'var(--text-dim)', fontFamily: 'JetBrains Mono, monospace' }}>
                {' / '}{totalRounds ?? 10}
              </span>
            </div>
          )}
          {started && (
            <button
              className="btn-control"
              onClick={onReset}
              title="Reset (R)"
              style={{
                borderColor: 'color-mix(in srgb, var(--accent-red) 50%, var(--border))',
                color: 'var(--accent-red)',
              }}
            >Reset</button>
          )}
        </div>
      </div>
    </div>
  );
}
