async function verifySession() {
  const response = await fetch('/api/session', { credentials: 'same-origin' });
  if (!response.ok) {
    window.location.replace('/Admin-Login/Admin-Login.html');
  }
}

document.getElementById('logoutButton').addEventListener('click', async function () {
  await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' });
  window.location.replace('/Admin-Login/Admin-Login.html');
});

verifySession();

const slotLabels = {
  'home-hero': 'Inicio — comunidad',
  'home-excursion': 'Inicio — excursión',
  'home-activity': 'Inicio — actividad',
  'activities-cooking': 'Actividades — cocina',
  'activities-puzzles': 'Actividades — juegos',
  'activities-recreation': 'Actividades — recreación',
  'activities-outings': 'Actividades — salida',
  'team-feature': 'Equipo — foto principal',
  'donations-feature': 'Donaciones — foto principal',
  'contact-feature': 'Contacto — foto principal',
};

async function loadPhotoList() {
  const response = await fetch('/data/photos.json', { cache: 'no-store' });
  if (!response.ok) return;
  const manifest = await response.json();
  const list = document.getElementById('photoList');
  list.replaceChildren();

  Object.entries(slotLabels).forEach(([slot, label]) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.style.padding = '16px';

    const title = document.createElement('strong');
    title.textContent = label;
    card.appendChild(title);

    if (manifest[slot]?.path) {
      const image = document.createElement('img');
      image.src = `/${manifest[slot].path}`;
      image.alt = manifest[slot].alt || '';
      image.style.width = '100%';
      image.style.height = '140px';
      image.style.objectFit = 'cover';
      image.style.margin = '10px 0';
      card.appendChild(image);

      const removeButton = document.createElement('button');
      removeButton.className = 'btn o';
      removeButton.type = 'button';
      removeButton.textContent = 'Eliminar';
      removeButton.addEventListener('click', () => removePhoto(slot));
      card.appendChild(removeButton);
    } else {
      const placeholder = document.createElement('p');
      placeholder.className = 'mut';
      placeholder.style.margin = '10px 0';
      placeholder.textContent = 'Sin fotografía';
      card.appendChild(placeholder);
    }

    list.appendChild(card);
  });
}

async function removePhoto(slot) {
  const status = document.getElementById('photoStatus');
  status.textContent = 'Eliminando fotografía...';
  const response = await fetch('/api/admin/photos/remove', {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ slot }),
  });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    status.textContent = result.error || 'No se pudo eliminar la fotografía.';
    return;
  }
  status.textContent = 'Fotografía eliminada. Se actualizará después del próximo despliegue.';
  await loadPhotoList();
}

document.getElementById('photoUploadForm').addEventListener('submit', async (event) => {
  event.preventDefault();
  const status = document.getElementById('photoStatus');
  const button = document.getElementById('photoUploadButton');
  const fileInput = document.getElementById('photoFile');
  if (!fileInput.files.length) {
    status.textContent = 'Selecciona una imagen.';
    return;
  }

  button.disabled = true;
  status.textContent = 'Guardando fotografía en GitHub...';
  const formData = new FormData(event.currentTarget);

  try {
    const response = await fetch('/api/admin/photos/upload', {
      method: 'POST',
      credentials: 'same-origin',
      body: formData,
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) {
      status.textContent = result.error || 'No se pudo guardar la fotografía.';
      return;
    }
    status.textContent = 'Fotografía guardada. Cloudflare actualizará el sitio después del despliegue.';
    event.currentTarget.reset();
    await loadPhotoList();
  } catch (_error) {
    status.textContent = 'No se pudo conectar con el servidor.';
  } finally {
    button.disabled = false;
  }
});

loadPhotoList();
