// Lightweight settings panel, presets & keyboard shortcuts
(function(){
  const LS_KEY = 'techedelic_presets_v1';

  function createButton(html, cls=''){
    const b = document.createElement('button'); b.className = cls; b.innerHTML = html; return b;
  }

  function buildUI(){
    const wrapper = document.createElement('div');
    wrapper.id = 'td-controls';
    wrapper.style.position = 'fixed';
    wrapper.style.right = '12px';
    wrapper.style.top = '12px';
    wrapper.style.zIndex = 9999;

    const gear = createButton('⚙','td-gear');
    gear.title = 'Settings';
    Object.assign(gear.style, {fontSize:'18px', padding:'6px 8px'});

    const panel = document.createElement('div');
    panel.style.position = 'fixed';
    panel.style.right = '12px';
    panel.style.top = '52px';
    panel.style.width = '300px';
    panel.style.maxHeight = '70vh';
    panel.style.overflow = 'auto';
    panel.style.background = 'rgba(8,8,8,0.88)';
    panel.style.color = '#fff';
    panel.style.padding = '12px';
    panel.style.borderRadius = '8px';
    panel.style.display = 'none';
    panel.style.fontFamily = 'sans-serif';

    // Render mode
    const renderLabel = document.createElement('label'); renderLabel.textContent = 'Render Mode: ';
    const renderSelect = document.createElement('select');
    ['neon','solid','wireframe'].forEach(m=>{ const o=document.createElement('option'); o.value=m; o.textContent=m; renderSelect.appendChild(o); });
    renderLabel.appendChild(renderSelect);
    panel.appendChild(renderLabel);
    panel.appendChild(document.createElement('hr'));

    // Bloom slider
    const bloomWrap = document.createElement('div');
    const bloomLabel = document.createElement('label'); bloomLabel.textContent = 'Bloom: ';
    const bloomRange = document.createElement('input'); bloomRange.type='range'; bloomRange.min=0; bloomRange.max=3; bloomRange.step=0.01; bloomRange.value=1.2;
    bloomLabel.appendChild(bloomRange); bloomWrap.appendChild(bloomLabel); panel.appendChild(bloomWrap);

    // Particles toggle
    const pWrap = document.createElement('div');
    const pLabel = document.createElement('label'); pLabel.textContent = 'Particles: ';
    const pCheckbox = document.createElement('input'); pCheckbox.type='checkbox'; pCheckbox.checked = true; pLabel.appendChild(pCheckbox); pWrap.appendChild(pLabel); panel.appendChild(pWrap);

    panel.appendChild(document.createElement('hr'));
    const presetsLabel = document.createElement('div'); presetsLabel.textContent = 'Presets:'; panel.appendChild(presetsLabel);
    const saveBtn = createButton('Save Preset'); const loadBtn = createButton('Load Preset'); const clearBtn = createButton('Clear Presets');
    panel.appendChild(saveBtn); panel.appendChild(loadBtn); panel.appendChild(clearBtn);

    document.body.appendChild(wrapper); wrapper.appendChild(gear); document.body.appendChild(panel);

    gear.addEventListener('click', ()=>{ panel.style.display = panel.style.display === 'none' ? 'block' : 'none'; });

    // Hook up change handlers (use window.app when available)
    renderSelect.addEventListener('change', ()=>{
      if(window.app && window.app.logoCube && window.app.logoCube.setRenderMode) window.app.logoCube.setRenderMode(renderSelect.value);
    });
    bloomRange.addEventListener('input', ()=>{
      if(window.app && window.app.sceneAPI && window.app.sceneAPI.bloomPass) window.app.sceneAPI.bloomPass.strength = parseFloat(bloomRange.value);
    });
    pCheckbox.addEventListener('change', ()=>{
      if(window.app && window.app.particles){
        if(pCheckbox.checked) window.app.particles.points.visible = true; else window.app.particles.points.visible = false;
      }
    });

    // Preset helpers
    function getPresetState(){
      return {render: renderSelect.value, bloom: parseFloat(bloomRange.value), particles: pCheckbox.checked};
    }
    saveBtn.addEventListener('click', ()=>{
      const presets = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
      presets.push(getPresetState()); localStorage.setItem(LS_KEY, JSON.stringify(presets)); alert('Preset saved');
    });
    loadBtn.addEventListener('click', ()=>{
      const presets = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
      if(!presets.length) return alert('No presets');
      const p = presets[presets.length-1]; renderSelect.value = p.render; bloomRange.value = p.bloom; pCheckbox.checked = p.particles;
      renderSelect.dispatchEvent(new Event('change')); bloomRange.dispatchEvent(new Event('input')); pCheckbox.dispatchEvent(new Event('change'));
    });
    clearBtn.addEventListener('click', ()=>{ localStorage.removeItem(LS_KEY); alert('Presets cleared'); });

    // Keyboard shortcuts
    window.addEventListener('keydown', (e)=>{
      if(e.code === 'KeyP'){
        pCheckbox.checked = !pCheckbox.checked; pCheckbox.dispatchEvent(new Event('change'));
      }
      if(e.code === 'KeyS'){
        // screenshot stub
        console.info('Screenshot stub — implement capture flow here');
      }
      if(e.key === '?') panel.style.display = 'block';
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', buildUI); else buildUI();
})();
