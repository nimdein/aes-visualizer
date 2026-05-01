import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { AESEncryptionVisualizer } from '../aes';
import StepInsight from './StepInsight';
import StudentStepInput from './StudentStepInput';

function hex2(b) { return b.toString(16).padStart(2, '0').toUpperCase(); }
function toBytes16(text) {
  const enc = new TextEncoder().encode(text.padEnd(16, ' ').slice(0, 16));
  return Array.from(enc);
}
function toRowMajor(state) {
  const out = [];
  for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) out.push({ value: state[col * 4 + row], idx: col * 4 + row, row, col });
  return out;
}
function headline(op) {
  return ({ init:'Initial Plaintext', addRoundKey:'AddRoundKey', subBytes:'SubBytes', shiftRows:'ShiftRows', mixColumns:'MixColumns', finalCipher:'Final Ciphertext' })[op] || op;
}
function explain(op) {
  return ({
    init:'The 16-byte plaintext block is loaded into a 4×4 AES state matrix.',
    addRoundKey:'Each byte is XORed with the active round key.',
    subBytes:'Every byte is substituted through the AES S-Box to add non-linearity.',
    shiftRows:'Rows are shifted left to move bytes across columns.',
    mixColumns:'Each column is mixed mathematically in GF(2^8) to create diffusion.',
    finalCipher:'The final AES ciphertext block is produced.',
  })[op] || 'AES encryption step.';
}

function Matrix({ state, prev }) {
  const cells = toRowMajor(state || Array(16).fill(0));
  return <div style={{ display:'grid', gridTemplateColumns:'repeat(4, 64px)', gap:6, padding:14, background:'var(--bg-card2)', border:'2px solid var(--border)', borderRadius:10 }}>
    {cells.map(c => {
      const changed = prev && prev[c.idx] !== c.value;
      return <motion.div key={c.idx + '-' + c.value}
        initial={changed ? { scale:0.82, opacity:0.4 } : { opacity:0.9 }}
        animate={changed ? { scale:[0.82,1.12,1], opacity:1 } : { opacity:1 }}
        transition={{ duration:0.35 }}
        className={`state-cell ${changed ? 'highlighted op-ark' : ''}`}
        style={{ width:64, height:64, fontFamily:'JetBrains Mono, monospace', fontSize:20, fontWeight:800 }}>
        {hex2(c.value)}
      </motion.div>
    })}
  </div>
}

export default function EncryptionDemo({ keyBytes, keyBits }) {
  const [text, setText] = useState('AES Encrypt Demo');
  const [stepIndex, setStepIndex] = useState(0);
  const plain = useMemo(() => toBytes16(text), [text]);
  const viz = useMemo(() => new AESEncryptionVisualizer(plain, keyBytes), [plain, keyBytes]);
  const step = viz.steps[stepIndex];
  const prev = stepIndex > 0 ? viz.steps[stepIndex - 1].state : null;
  const isLast = stepIndex >= viz.totalSteps - 1;
  const cipherHex = viz.steps[viz.totalSteps - 1].state.map(hex2).join('');

  return <div style={{ display:'grid', gridTemplateColumns:'320px 1fr', gap:20 }}>
    <aside className="upgrade-card">
      <div className="upgrade-title">AES encryption mode</div>
      <p className="upgrade-muted">This tab completes the project by showing the forward AES process, not only decryption.</p>
      <label className="eyebrow">Plaintext input</label>
      <input value={text} onChange={e => { setText(e.target.value); setStepIndex(0); }} maxLength={16}
        style={{ marginTop:8, width:'100%', background:'var(--bg-input)', border:'1px solid var(--border)', borderRadius:6, color:'var(--text)', fontFamily:'JetBrains Mono, monospace', padding:'10px 12px' }} />
      <p className="upgrade-muted" style={{ marginTop:8 }}>Exactly 16 characters are used. Short text is padded with spaces.</p>
      <div className="metric-row">
        <div className="metric-box"><b>{keyBits}</b><span>key bits</span></div>
        <div className="metric-box"><b>{viz.Nr}</b><span>rounds</span></div>
        <div className="metric-box"><b>{viz.totalSteps}</b><span>steps</span></div>
      </div>
      <button className="btn btn-filled" style={{ width:'100%', marginTop:10 }} onClick={() => setStepIndex(0)}>Reset encryption</button>
      <div style={{ marginTop:16 }}>
        <div className="eyebrow">Final ciphertext</div>
        <div style={{ fontFamily:'JetBrains Mono, monospace', fontSize:12, color:'var(--accent)', lineHeight:1.7, wordBreak:'break-all', marginTop:6 }}>{cipherHex}</div>
      </div>
    </aside>

    <main className="upgrade-card" style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>
      <div style={{ width:'100%', display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap' }}>
        <div>
          <div className="eyebrow">Step {stepIndex + 1} / {viz.totalSteps}</div>
          <h2 style={{ fontSize:30, color:'var(--accent)' }}>{headline(step.op)}</h2>
          <p style={{ color:'var(--text-2)', fontSize:14 }}>{explain(step.op)}</p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="btn-control" disabled={stepIndex === 0} onClick={() => setStepIndex(i => Math.max(0, i - 1))}>← Back</button>
          <button className="btn btn-filled" disabled={isLast} onClick={() => setStepIndex(i => Math.min(viz.totalSteps - 1, i + 1))}>Next →</button>
        </div>
      </div>
      <input className="timeline-range" type="range" min={0} max={viz.totalSteps - 1} value={stepIndex} onChange={e => setStepIndex(Number(e.target.value))} style={{ width:'100%' }} />
      <Matrix state={step.state} prev={prev} />
      <StepInsight step={step} previousState={prev} currentState={step.state} />
      <StudentStepInput currentStep={step} nextStep={viz.steps[stepIndex + 1]} onCorrect={() => setStepIndex(i => Math.min(viz.totalSteps - 1, i + 1))} />
    </main>
  </div>
}
