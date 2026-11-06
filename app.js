'use strict';

const storageKey = 'routine-notebook.entries.v1';
const form = document.querySelector('#entry-form');
const dateInput = document.querySelector('#date');
const productsInput = document.querySelector('#products');
const notesInput = document.querySelector('#notes');
const list = document.querySelector('#entries');
const summary = document.querySelector('#summary');
const status = document.querySelector('#status');
const exportButton = document.querySelector('#export');
const feelingOptions = ['Tight', 'Comfortable', 'Oily', 'Mixed'];
const dateFormat = new Intl.DateTimeFormat(undefined, { dateStyle: 'long', timeZone: 'UTC' });
const today = new Date();
const localToday = [
  today.getFullYear(),
  String(today.getMonth() + 1).padStart(2, '0'),
  String(today.getDate()).padStart(2, '0'),
].join('-');
dateInput.value = localToday;
dateInput.max = localToday;

function validEntry(entry) {
  return entry && typeof entry.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(entry.date)
    && Number.isFinite(Date.parse(entry.date)) && feelingOptions.includes(entry.feeling)
    && typeof entry.products === 'string' && typeof entry.notes === 'string';
}

let entries = [];
try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || '[]');
  if (Array.isArray(saved)) entries = saved.filter(validEntry);
} catch {
  status.textContent = 'Saved entries could not be read in this browser.';
}

function store(next, message) {
  entries = next;
  try {
    localStorage.setItem(storageKey, JSON.stringify(entries));
    status.textContent = message;
  } catch {
    status.textContent = 'Browser storage is unavailable. Export JSON before closing this page.';
  }
  render();
}

function action(label, handler) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'plain';
  button.textContent = label;
  button.addEventListener('click', handler);
  return button;
}

function render() {
  list.replaceChildren();
  exportButton.disabled = entries.length === 0;
  summary.textContent = entries.length
    ? `${entries.length} ${entries.length === 1 ? 'day' : 'days'} recorded`
    : 'Your first entry will appear here.';
  for (const entry of entries) {
    const item = document.createElement('li');
    const label = document.createElement('strong');
    const details = document.createElement('p');
    const controls = document.createElement('div');
    const formattedDate = dateFormat.format(new Date(entry.date));
    label.textContent = `${formattedDate} · ${entry.feeling}`;
    details.textContent = [entry.products, entry.notes].filter(Boolean).join('\n');
    controls.className = 'actions';
    const edit = action('Edit', () => {
      dateInput.value = entry.date;
      form.elements.feeling.value = entry.feeling;
      productsInput.value = entry.products;
      notesInput.value = entry.notes;
      dateInput.focus();
    });
    const remove = action('Delete', () => {
      if (!window.confirm(`Delete the entry for ${formattedDate}?`)) return;
      store(entries.filter(({ date }) => date !== entry.date), 'Entry deleted.');
      dateInput.focus();
    });
    edit.setAttribute('aria-label', `Edit entry for ${formattedDate}`);
    remove.setAttribute('aria-label', `Delete entry for ${formattedDate}`);
    controls.append(edit, remove);
    item.append(label);
    if (details.textContent) item.append(details);
    item.append(controls);
    list.append(item);
  }
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  const entry = {
    date: dateInput.value,
    feeling: form.elements.feeling.value,
    products: productsInput.value.trim(),
    notes: notesInput.value.trim(),
  };
  if (!validEntry(entry) || entry.date > localToday) return;
  const next = entries.filter(({ date }) => date !== entry.date);
  next.push(entry);
  next.sort((a, b) => b.date.localeCompare(a.date));
  store(next, 'Entry saved.');
});

exportButton.addEventListener('click', () => {
  const data = new Blob([JSON.stringify(entries, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(data);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'routine-notebook.json';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

render();
