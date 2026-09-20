(function(){
  const SCALE = 1000000; // magnitude of direction "vector"

  const state = {
    coordType: 'caret',
    orientation: 'vertical',
    facing: 0,
    particleType: 'cloud',
    segments: 36,
    radius: 0.1,
    speed: 0.35,
    offset: 0,
    mode: 'force'
  };

  const els = {
    coordSeg: document.getElementById('coordSeg'),
    coordHint: document.getElementById('coordHint'),
    facingField: document.getElementById('facingField'),
    facing: document.getElementById('facing'),
    facingVal: document.getElementById('facingVal'),
    orientationSeg: document.getElementById('orientationSeg'),
    particleType: document.getElementById('particleType'),
    segments: document.getElementById('segments'),
    segmentsVal: document.getElementById('segmentsVal'),
    radius: document.getElementById('radius'),
    radiusVal: document.getElementById('radiusVal'),
    speed: document.getElementById('speed'),
    speedVal: document.getElementById('speedVal'),
    offset: document.getElementById('offset'),
    offsetVal: document.getElementById('offsetVal'),
    offsetLabel: document.getElementById('offsetLabel'),
    mode: document.getElementById('mode'),
    output: document.getElementById('output'),
    filename: document.getElementById('filename'),
    canvas: document.getElementById('preview'),
    viewLabel: document.getElementById('viewLabel'),
    ptCount: document.getElementById('ptCount'),
    toast: document.getElementById('toast')
  };

  function fmtCoord(n, prefix){
    if (Math.abs(n) < 1e-9) return prefix;
    let s = n.toFixed(10);
    s = s.replace(/0+$/,'').replace(/\.$/,'');
    if (s === '-0') s = '0';
    return prefix + s;
  }
  function fmtPlain(n){
    if (Math.abs(n) < 1e-9) return '0';
    if (Number.isInteger(n)) return n.toString();
    let s = n.toFixed(10);
    s = s.replace(/0+$/,'').replace(/\.$/,'');
    if (s === '-0' || s === '') s = '0';
    return s;
  }

  function buildLines(){
    const N = state.segments;
    const r = state.radius;
    const off = state.offset;
    const speedParam = state.speed / SCALE;
    const isCaret = state.coordType === 'caret';
    const prefix = isCaret ? '^' : '~';
    const yaw = (state.facing * Math.PI) / 180;
    const rightX = Math.cos(yaw), rightZ = -Math.sin(yaw);
    const faceX = Math.sin(yaw), faceZ = Math.cos(yaw);

    const lines = [];
    for (let i = 0; i < N; i++){
      const theta = (2 * Math.PI * i) / N;
      const c = Math.cos(theta);
      const s = Math.sin(theta);
      let px, py, pz, dx, dy, dz;

      if (isCaret){
        if (state.orientation === 'vertical'){
          px = r * c; py = r * s; pz = off;
          dx = c * SCALE; dy = s * SCALE; dz = 0;
        } else {
          px = r * c; py = off; pz = r * s;
          dx = c * SCALE; dy = 0; dz = s * SCALE;
        }
      } else {
        if (state.orientation === 'vertical'){
          px = rightX * r * c + faceX * off;
          py = r * s;
          pz = rightZ * r * c + faceZ * off;
          dx = rightX * c * SCALE; dy = s * SCALE; dz = rightZ * c * SCALE;
        } else {
          px = r * c; py = off; pz = r * s;
          dx = c * SCALE; dy = 0; dz = s * SCALE;
        }
      }

      const posStr = `${fmtCoord(px, prefix)} ${fmtCoord(py, prefix)} ${fmtCoord(pz, prefix)}`;
      const deltaStr = isCaret
        ? `${fmtCoord(dx, '^')} ${fmtCoord(dy, '^')} ${fmtCoord(dz, '^')}`
        : `${fmtPlain(dx)} ${fmtPlain(dy)} ${fmtPlain(dz)}`;

      lines.push(
        `particle ${state.particleType} ${posStr} ${deltaStr} ${fmtPlain(speedParam)} 0 ${state.mode}`
      );
    }
    return lines;
  }

  function drawPreview(){
    const ctx = els.canvas.getContext('2d');
    const W = els.canvas.width, H = els.canvas.height;
    ctx.clearRect(0,0,W,H);
    const cx = W/2, cy = H/2;
    const maxR = Math.min(W,H) * 0.34;
    const rNorm = Math.min(state.radius / 3, 1);
    const baseR = 14 + rNorm * (maxR - 30);
    const arrowLen = 12 + Math.min(state.speed / 1.2, 1) * 60;

    ctx.strokeStyle = 'rgba(209,185,235,0.22)';
    ctx.setLineDash([5,6]);
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, baseR, 0, Math.PI*2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#d1b9eb';
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI*2);
    ctx.fill();

    const N = state.segments;
    for (let i = 0; i < N; i++){
      const theta = (2*Math.PI*i)/N;
      const c = Math.cos(theta), s = Math.sin(theta);
      let vx, vy;
      if (state.orientation === 'vertical'){ vx = c; vy = -s; }
      else { vx = c; vy = s; }

      const x0 = cx + vx*baseR, y0 = cy + vy*baseR;
      const x1 = cx + vx*(baseR+arrowLen), y1 = cy + vy*(baseR+arrowLen);

      ctx.strokeStyle = 'rgba(209,185,235,0.58)';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(x0,y0);
      ctx.lineTo(x1,y1);
      ctx.stroke();

      ctx.fillStyle = '#d1b9eb';
      ctx.beginPath();
      ctx.arc(x0, y0, 3.2, 0, Math.PI*2);
      ctx.fill();
    }

    // orientation hint glyphs
    ctx.fillStyle = 'rgba(154,134,184,0.75)';
    ctx.font = '12px "JetBrains Mono", monospace';
    if (state.orientation === 'vertical'){
      ctx.fillText('up', cx + 6, cy - baseR - arrowLen - 8 > 14 ? cy - baseR - arrowLen - 8 : 14);
      ctx.fillText('right', cx + baseR + arrowLen + 6, cy + 4);
    } else {
      ctx.fillText('forward', cx + 6, cy - baseR - arrowLen - 8 > 14 ? cy - baseR - arrowLen - 8 : 14);
      ctx.fillText('right', cx + baseR + arrowLen + 6, cy + 4);
    }
  }

  function render(){
    const isCaret = state.coordType === 'caret';

    els.segmentsVal.textContent = state.segments;
    els.radiusVal.textContent = state.radius.toFixed(2) + ' blocks';
    els.speedVal.textContent = state.speed.toFixed(2) + ' blocks/tick';
    els.offsetVal.textContent = state.offset.toFixed(2) + ' blocks';
    els.facingVal.textContent = state.facing + '°';

    els.coordHint.textContent = isCaret
      ? 'Rotates with whatever runs the function.'
      : 'Fixed to the world.';

    const showFacing = !isCaret && state.orientation === 'vertical';
    els.facingField.style.display = showFacing ? '' : 'none';

    if (isCaret){
      els.offsetLabel.firstChild.textContent = state.orientation === 'vertical'
        ? 'Forward offset '
        : 'Height offset ';
    } else {
      els.offsetLabel.firstChild.textContent = state.orientation === 'vertical'
        ? 'Offset along facing angle '
        : 'Height offset ';
    }

    if (els.viewLabel){
      if (isCaret){
        els.viewLabel.textContent = state.orientation === 'vertical'
          ? 'Front view'
          : 'Top-down view';
      } else {
        els.viewLabel.textContent = state.orientation === 'vertical'
          ? `Front view`
          : 'Top-down view';
      }
    }

    els.ptCount.textContent = state.segments;

    const lines = buildLines();
    els.output.value = lines.join('\n');
    drawPreview();
  }

  els.coordSeg.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    [...els.coordSeg.children].forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.coordType = btn.dataset.val;
    render();
  });

  els.facing.addEventListener('input', () => {
    state.facing = parseInt(els.facing.value, 10);
    render();
  });

  els.orientationSeg.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    [...els.orientationSeg.children].forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.orientation = btn.dataset.val;
    render();
  });

  els.particleType.addEventListener('input', () => {
    state.particleType = els.particleType.value.trim() || 'cloud';
    render();
  });

  els.segments.addEventListener('input', () => {
    state.segments = parseInt(els.segments.value, 10);
    render();
  });

  els.radius.addEventListener('input', () => {
    state.radius = parseFloat(els.radius.value);
    render();
  });

  els.speed.addEventListener('input', () => {
    state.speed = parseFloat(els.speed.value);
    render();
  });

  els.offset.addEventListener('input', () => {
    state.offset = parseFloat(els.offset.value);
    render();
  });

  els.mode.addEventListener('change', () => {
    state.mode = els.mode.value;
    render();
  });

  document.querySelectorAll('.presets button').forEach(btn => {
    btn.addEventListener('click', () => {
      state.speed = parseFloat(btn.dataset.speed);
      els.speed.value = state.speed;
      render();
    });
  });

  function showToast(msg){
    els.toast.textContent = msg;
    els.toast.classList.add('show');
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => els.toast.classList.remove('show'), 1600);
  }

  document.getElementById('copyBtn').addEventListener('click', async () => {
    try{
      await navigator.clipboard.writeText(els.output.value);
      showToast('Copied to clipboard');
    }catch(e){
      els.output.select();
      document.execCommand('copy');
      showToast('Copied to clipboard');
    }
  });

  document.getElementById('downloadBtn').addEventListener('click', () => {
    const name = (els.filename.value.trim() || 'boom_ring') + '.mcfunction';
    const blob = new Blob([els.output.value + '\n'], {type: 'text/plain'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('Downloaded ' + name);
  });

  render();
})();
