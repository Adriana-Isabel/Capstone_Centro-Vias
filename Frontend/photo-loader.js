async function loadPublicPhotos() {
  let manifest = {};
  try {
    const response = await fetch('/api/photos', { cache: 'no-store' });
    if (response.ok) manifest = await response.json();
  } catch (_error) {
    return;
  }

  document.querySelectorAll('[data-photo-slot]').forEach((slot) => {
    if (!slot.dataset.placeholderHtml) {
      slot.dataset.placeholderHtml = slot.innerHTML;
    }

    const entry = manifest[slot.dataset.photoSlot];
    if (!entry?.path) return;

    slot.replaceChildren();
    const image = document.createElement('img');
    image.src = entry.path.startsWith('Images/photos/')
      ? `/api/photo?path=${encodeURIComponent(entry.path)}`
      : `/${entry.path}`;
    image.alt = entry.alt || '';
    image.loading = 'lazy';
    image.style.width = '100%';
    image.style.height = '100%';
    image.style.objectFit = 'cover';
    slot.appendChild(image);
  });

  return manifest;
}

function injectInlineEditorStyles() {
  if (document.getElementById('inline-photo-editor-styles')) return;

  const style = document.createElement('style');
  style.id = 'inline-photo-editor-styles';
  style.textContent = `
    [data-photo-slot] { position: relative; }
    .inline-photo-editor {
      position: absolute;
      right: 10px;
      bottom: 10px;
      z-index: 20;
      display: flex;
      align-items: center;
      gap: 8px;
      max-width: calc(100% - 20px);
      padding: 8px;
      border: 1px solid #ccd7c7;
      border-radius: 10px;
      background: rgba(255, 255, 255, 0.96);
      box-shadow: 0 4px 14px rgba(31, 42, 29, 0.14);
    }
    .inline-photo-editor button {
      min-height: 36px;
      padding: 7px 10px;
      border: 1px solid #2f6b2a;
      border-radius: 8px;
      background: #2f6b2a;
      color: #fff;
      font: 700 13px "Segoe UI", Arial, sans-serif;
      cursor: pointer;
    }
    .inline-photo-editor button.remove {
      border-color: #9a3412;
      background: #fff;
      color: #9a3412;
    }
    .inline-photo-editor button:disabled {
      cursor: wait;
      opacity: 0.65;
    }
    .inline-photo-status {
      max-width: 180px;
      color: #55624f;
      font: 600 12px "Segoe UI", Arial, sans-serif;
    }
  `;
  document.head.appendChild(style);
}

function restorePlaceholder(slot) {
  if (slot.dataset.placeholderHtml) {
    slot.innerHTML = slot.dataset.placeholderHtml;
  }
}

async function uploadInlinePhoto(slot, file) {
  const status = slot.querySelector('.inline-photo-status');
  const addButton = slot.querySelector('.inline-add-photo');
  const removeButton = slot.querySelector('.inline-remove-photo');
  if (status) status.textContent = 'Guardando...';
  if (addButton) addButton.disabled = true;
  if (removeButton) removeButton.disabled = true;

  const formData = new FormData();
  formData.set('slot', slot.dataset.photoSlot);
  formData.set('file', file);
  formData.set('alt', slot.dataset.imageAlt || '');

  try {
    const response = await fetch('/api/admin/photos/upload', {
      method: 'POST',
      credentials: 'same-origin',
      body: formData,
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (status) status.textContent = result.error || 'No se pudo guardar.';
      return;
    }

    const preview = URL.createObjectURL(file);
    slot.querySelectorAll('img').forEach((image) => image.remove());
    const image = document.createElement('img');
    image.src = preview;
    image.alt = slot.dataset.imageAlt || '';
    image.style.width = '100%';
    image.style.height = '100%';
    image.style.objectFit = 'cover';
    slot.appendChild(image);
    if (status) status.textContent = 'Guardada';
    const removeButton = slot.querySelector('.inline-remove-photo');
    if (removeButton) removeButton.hidden = false;
    addButton.textContent = 'Reemplazar';
  } catch (_error) {
    if (status) status.textContent = 'Error de conexión';
  } finally {
    if (addButton) addButton.disabled = false;
    if (removeButton) removeButton.disabled = false;
  }
}

async function removeInlinePhoto(slot) {
  const status = slot.querySelector('.inline-photo-status');
  if (status) status.textContent = 'Eliminando...';

  try {
    const response = await fetch('/api/admin/photos/remove', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slot: slot.dataset.photoSlot }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (status) status.textContent = result.error || 'No se pudo eliminar.';
      return;
    }

    slot.querySelectorAll('img').forEach((image) => image.remove());
    restorePlaceholder(slot);
    document.querySelectorAll('.inline-photo-editor').forEach((editor) => editor.remove());
    setupInlineEditors({});
  } catch (_error) {
    if (status) status.textContent = 'Error de conexión';
  }
}

function setupInlineEditors(manifest) {
  injectInlineEditorStyles();

  document.querySelectorAll('[data-photo-slot]').forEach((slot) => {
    slot.style.position = 'relative';
    const editor = document.createElement('div');
    editor.className = 'inline-photo-editor';

    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/jpeg,image/png,image/webp,image/gif';
    fileInput.hidden = true;

    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.className = 'inline-add-photo';
    addButton.textContent = manifest[slot.dataset.photoSlot]?.path ? 'Reemplazar' : 'Añadir';

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'inline-remove-photo remove';
    removeButton.textContent = 'Eliminar';
    removeButton.hidden = !manifest[slot.dataset.photoSlot]?.path;

    const status = document.createElement('span');
    status.className = 'inline-photo-status';
    status.setAttribute('role', 'status');

    addButton.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', () => {
      const file = fileInput.files?.[0];
      if (file) uploadInlinePhoto(slot, file);
    });
    removeButton.addEventListener('click', () => removeInlinePhoto(slot));

    editor.append(fileInput, addButton, removeButton, status);
    slot.appendChild(editor);
  });
}

function setupAdminNavigation() {
  if (document.querySelector('[data-admin-navigation-link]')) return;

  const navigation = document.querySelector('header nav');
  if (!navigation) return;

  const adminLink = document.createElement('a');
  adminLink.href = '/Admin-Login/dashboard.html';
  adminLink.textContent = 'Administración';
  adminLink.dataset.adminNavigationLink = 'true';
  navigation.appendChild(adminLink);
}

async function initializePhotoManager() {
  const manifest = await loadPublicPhotos();
  if (!manifest) return;

  try {
    const session = await fetch('/api/session', { credentials: 'same-origin' });
    if (session.ok) {
      setupAdminNavigation();
      setupInlineEditors(manifest);
    }
  } catch (_error) {
    // Public visitors keep the normal photo experience.
  }
}

initializePhotoManager();
