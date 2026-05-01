import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';

function hex2(b) { return (b ?? 0).toString(16).padStart(2, '0').toUpperCase(); }

function opName(op) {
  if (op === 'addRoundKey') return 'AddRoundKey';
  if (op === 'invSubBytes') return 'InvSubBytes';
  if (op === 'invShiftRows') return 'InvShiftRows';
  if (op === 'invMixColumns') return 'InvMixColumns';
  if (op === 'subBytes') return 'SubBytes';
  if (op === 'shiftRows') return 'ShiftRows';
  if (op === 'mixColumns') return 'MixColumns';
  if (op === 'final' || op === 'finalCipher') return 'Final AddRoundKey';
  return 'Next AES step';
}

export default function StudentStepInput({ currentStep, nextStep, onCorrect }) {
  const [values, setValues] = useState(() => Array(16).fill(''));
  const [wrong, setWrong] = useState(() => Array(16).fill(false));
  const [checked, setChecked] = useState(false);
  const [message, setMessage] = useState('');
  const refs = useRef([]);

  useEffect(() => {
    setValues(Array(16).fill(''));
    setWrong(Array(16).fill(false));
    setChecked(false);
    setMessage('');
  }, [currentStep?.label, nextStep?.label]);

  const expected = nextStep?.state || null;
  const complete = values.every(v => /^[0-9A-Fa-f]{2}$/.test(v));
  const nextLabel = nextStep?.label || 'No next step';

  const wrongCount = useMemo(() => wrong.filter(Boolean).length, [wrong]);

  function updateCell(i, raw) {
    const clean = raw.replace(/[^0-9a-fA-F]/g, '').slice(0, 2).toUpperCase();
    const copy = [...values];
    copy[i] = clean;
    setValues(copy);
    if (checked) {
      const wrongCopy = [...wrong];
      wrongCopy[i] = expected ? clean !== hex2(expected[i]) : false;
      setWrong(wrongCopy);
    }
    if (clean.length === 2 && i < 15) refs.current[i + 1]?.focus();
  }

  function checkAnswer() {
    if (!expected) return;
    const nextWrong = values.map((v, i) => v.toUpperCase() !== hex2(expected[i]));
    const ok = nextWrong.every(x => !x);
    setWrong(nextWrong);
    setChecked(true);
    if (ok) {
      setMessage('Correct ✅ Moving to the next AES step...');
      setTimeout(() => onCorrect?.(), 450);
    } else {
      setMessage(`${nextWrong.filter(Boolean).length} byte(s) are wrong. Red cells show where to fix.`);
    }
  }

  function clearGrid() {
    setValues(Array(16).fill(''));
    setWrong(Array(16).fill(false));
    setChecked(false);
    setMessage('');
  }

  function revealOneHint() {
    if (!expected) return;
    const idx = values.findIndex((v, i) => v.toUpperCase() !== hex2(expected[i]));
    if (idx >= 0) {
      const copy = [...values];
      copy[idx] = hex2(expected[idx]);
      setValues(copy);
      refs.current[Math.min(idx + 1, 15)]?.focus();
    }
  }

  if (!currentStep || !nextStep || !expected) {
    return (
      <section className="student-step-card">
        <div className="student-step-title">Student calculation mode</div>
        <p className="upgrade-muted">Start the visualizer to enter the next AES state manually.</p>
      </section>
    );
  }

  return (
    <section className="student-step-card">
      <div className="student-step-head">
        <div>
          <div className="student-step-title">Student calculation mode</div>
          <p className="upgrade-muted">
            Calculate the next state for <b>{opName(nextStep.op)}</b>, then type all 16 hex bytes. Correct answer advances automatically.
          </p>
        </div>
        <div className={`student-score ${checked ? (wrongCount === 0 ? 'ok' : 'bad') : ''}`}>
          {checked ? (wrongCount === 0 ? '16/16' : `${16 - wrongCount}/16`) : 'unchecked'}
        </div>
      </div>

      <div className="next-target-label">Target step: {nextLabel}</div>

      <div className="student-grid-wrap">
        <div className="student-grid">
          {values.map((v, i) => (
            <motion.input
              key={i}
              ref={el => refs.current[i] = el}
              value={v}
              onChange={e => updateCell(i, e.target.value)}
              onFocus={e => e.target.select()}
              className={`student-byte ${wrong[i] ? 'wrong' : checked && v ? 'right' : ''}`}
              maxLength={2}
              placeholder="00"
              spellCheck={false}
              animate={wrong[i] ? { boxShadow: ['0 0 0 0 rgba(220,38,38,0)', '0 0 0 5px rgba(220,38,38,.22)', '0 0 0 0 rgba(220,38,38,0)'] } : {}}
              transition={{ duration: 0.8 }}
            />
          ))}
        </div>
        <div className="student-guide">
          <b>How to use:</b><br />
          1) Look at the current matrix above.<br />
          2) Apply the next AES operation yourself.<br />
          3) Type the resulting 16 bytes here.<br />
          4) Red cells mean incorrect bytes.
        </div>
      </div>

      {message && <div className={`student-message ${wrongCount === 0 && checked ? 'ok' : 'bad'}`}>{message}</div>}

      <div className="student-actions">
        <button className="btn-control" onClick={clearGrid}>Clear</button>
        <button className="btn-control" onClick={revealOneHint}>Hint: fill one byte</button>
        <button className="btn-control active" onClick={checkAnswer} disabled={!complete}>Check my state</button>
      </div>
    </section>
  );
}
