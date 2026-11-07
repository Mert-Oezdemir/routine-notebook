(() => {
  'use strict';
  const photo = document.querySelector('#skin-photo');
  const preview = document.querySelector('#skin-preview');
  const consent = document.querySelector('#skin-consent');
  const start = document.querySelector('#skin-start');
  const resume = document.querySelector('#skin-resume');
  const status = document.querySelector('#analysis-status');
  const service = document.querySelector('#analysis-service');
  const results = document.querySelector('#analysis-results');
  const exportButton = document.querySelector('#skin-export');
  let configured = false;
  let file = null;
  let previewUrl = null;
  let taskId = null;
  let output = null;
  let busy = false;
  let timer;

  try { taskId = localStorage.getItem('routine-notebook.analysis-task.v1'); } catch {}
  resume.hidden = !taskId;

  async function api(route, payload) {
    const response = await fetch('api/' + route, payload ? {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Project-Request': '1' },
      body: JSON.stringify(payload),
    } : {});
    const value = await response.json();
    if (!response.ok) throw new Error(value.error || 'The analysis request failed.');
    return value;
  }

  function refresh() {
    start.disabled = !configured || !file || !consent.checked || busy;
    resume.disabled = !configured || busy;
  }

  photo.addEventListener('change', async () => {
    file = null;
    consent.checked = false;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    preview.hidden = true;
    status.textContent = '';
    refresh();
    const selected = photo.files[0];
    if (!selected) return;
    if (!['image/jpeg', 'image/png'].includes(selected.type) || selected.size >= 10 * 1024 * 1024) {
      status.textContent = 'Choose a JPEG or PNG smaller than 10 MiB.';
      return;
    }
    try {
      const image = await createImageBitmap(selected);
      const { width, height } = image;
      image.close();
      if (Math.min(width, height) < 480 || Math.max(width, height) > 4096) {
        status.textContent = 'Use an image with a short side of at least 480 pixels and a long side up to 4096 pixels.';
        return;
      }
      if (photo.files[0] !== selected) return;
      file = selected;
      previewUrl = URL.createObjectURL(selected);
      preview.src = previewUrl;
      preview.hidden = false;
      refresh();
    } catch { status.textContent = 'The image could not be opened. Choose another photo.'; }
  });
  consent.addEventListener('change', refresh);

  async function poll(attempt = 0) {
    if (!taskId) return;
    try {
      const task = await api('skin/tasks/' + taskId);
      if (task.status === 'running') {
        status.textContent = 'Analysis is running. This page checks the task every 10 seconds.';
        if (attempt < 60) timer = setTimeout(() => poll(attempt + 1), 10000);
        else { busy = false; status.textContent = 'The provider needs more time. Use Check previous analysis to continue.'; refresh(); }
        return;
      }
      busy = false;
      refresh();
      if (task.status === 'error') {
        status.textContent = 'The provider could not analyze this image. Check the lighting, framing and image requirements.';
        return;
      }
      output = task;
      const heading = document.createElement('h3');
      heading.textContent = 'Analysis results';
      const pre = document.createElement('pre');
      pre.textContent = JSON.stringify(task.results, null, 2);
      const list = document.createElement('ul');
      for (const metric of Array.isArray(task.results?.output) ? task.results.output : []) {
        const item = document.createElement('li');
        const name = document.createElement('strong');
        name.textContent = String(metric.type || 'Skin observation').replaceAll('_', ' ');
        item.append(name);
        if (Number.isFinite(metric.ui_score)) item.append(document.createTextNode(' — provider score ' + metric.ui_score));
        if (Number.isFinite(metric.raw_score)) item.append(document.createTextNode(' (raw ' + metric.raw_score.toFixed(2) + ')'));
        for (const address of Array.isArray(metric.mask_urls) ? metric.mask_urls : []) {
          try {
            const url = new URL(address);
            if (url.protocol !== 'https:') continue;
            const link = document.createElement('a');
            link.href = url.href;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = ' View detection image';
            item.append(link);
          } catch {}
        }
        list.append(item);
      }
      const details = document.createElement('details');
      const summary = document.createElement('summary');
      summary.textContent = 'Complete provider response';
      details.append(summary, pre);
      results.replaceChildren(heading, list, details);
      exportButton.hidden = false;
      status.textContent = 'Analysis completed. You can download the complete result.';
    } catch (error) {
      busy = false;
      status.textContent = error.message + ' Use Check previous analysis to check this same task again.';
      refresh();
    }
  }

  start.addEventListener('click', async () => {
    if (!file || !consent.checked || busy) return;
    busy = true;
    refresh();
    clearTimeout(timer);
    status.textContent = 'Uploading the photo and starting the analysis.';
    try {
      const encoded = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const task = await api('skin/tasks', { image: encoded, contentType: file.type, name: file.name, consent: true });
      taskId = task.id;
      try { localStorage.setItem('routine-notebook.analysis-task.v1', taskId); } catch {}
      resume.hidden = false;
      await poll();
    } catch (error) {
      busy = false;
      status.textContent = error.message;
      refresh();
    }
  });
  resume.addEventListener('click', () => { clearTimeout(timer); busy = true; refresh(); poll(); });
  exportButton.addEventListener('click', () => {
    const url = URL.createObjectURL(new Blob([JSON.stringify(output, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'skin-analysis.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
  if (/^https?:$/.test(location.protocol)) {
    api('status').then(result => {
      configured = result.services.skin;
      service.textContent = configured ? 'YouCam account configured on the local server.'
        : 'Set YOUCAM_API_KEY in the server .env file, then restart it.';
      refresh();
    }).catch(() => { service.textContent = 'Use npm start to enable photo analysis.'; });
  }
})();
