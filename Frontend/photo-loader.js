async function loadPublicPhotos() {
  try {
    const response = await fetch('/data/photos.json', { cache: 'no-store' });
    if (!response.ok) return;
    const manifest = await response.json();

    document.querySelectorAll('[data-photo-slot]').forEach((slot) => {
      const entry = manifest[slot.dataset.photoSlot];
      if (!entry?.path) return;

      slot.replaceChildren();
      const image = document.createElement('img');
      image.src = `/${entry.path}`;
      image.alt = entry.alt || '';
      image.loading = 'lazy';
      image.style.width = '100%';
      image.style.height = '100%';
      image.style.objectFit = 'cover';
      slot.appendChild(image);
    });
  } catch (_error) {
    // Keep existing placeholders when photo data cannot be loaded.
  }
}

loadPublicPhotos();
