async function verifySession() {
  const response = await fetch('/api/session', { credentials: 'same-origin' });
  if (!response.ok) {
    window.location.replace('/Admin-Login/Admin-Login.html');
    return false;
  }
  return true;
}

const reviewQueue = document.getElementById('review-queue');
const reviewQueueStatus = document.getElementById('review-queue-status');

function createPendingReview(review) {
  const article = document.createElement('article');
  article.className = 'pending-review';

  const metadata = document.createElement('div');
  metadata.className = 'pending-review-meta';

  const author = document.createElement('strong');
  author.textContent = review.authorName;

  const date = document.createElement('time');
  const submittedAt = new Date(Number(review.submittedAt));
  if (!Number.isNaN(submittedAt.getTime())) {
    date.dateTime = submittedAt.toISOString();
    date.textContent = submittedAt.toLocaleString('es-PR');
  }

  const message = document.createElement('p');
  message.className = 'pending-review-message';
  message.textContent = review.message;

  const actions = document.createElement('div');
  actions.className = 'pending-review-actions';
  const approveButton = document.createElement('button');
  approveButton.className = 'btn';
  approveButton.type = 'button';
  approveButton.textContent = 'Aprobar';
  approveButton.setAttribute(
    'aria-label',
    `Aprobar comentario de ${review.authorName}`,
  );
  const rejectButton = document.createElement('button');
  rejectButton.className = 'btn o';
  rejectButton.type = 'button';
  rejectButton.textContent = 'Rechazar';
  rejectButton.setAttribute(
    'aria-label',
    `Rechazar comentario de ${review.authorName}`,
  );

  approveButton.addEventListener('click', () =>
    moderateReview(review.id, 'approved', article),
  );
  rejectButton.addEventListener('click', () =>
    moderateReview(review.id, 'rejected', article),
  );

  metadata.append(author, date);
  actions.append(approveButton, rejectButton);
  article.append(metadata, message, actions);
  return article;
}

async function loadPendingReviews() {
  reviewQueueStatus.textContent = 'Cargando comentarios pendientes...';
  reviewQueueStatus.classList.remove('moderation-error');
  try {
    const response = await fetch('/api/admin/reviews', {
      credentials: 'same-origin',
    });
    const result = await response.json();
    if (!response.ok || !Array.isArray(result.reviews)) {
      throw new Error(result.error || 'No se pudieron cargar los comentarios.');
    }

    reviewQueue.replaceChildren(...result.reviews.map(createPendingReview));
    reviewQueueStatus.textContent = result.reviews.length
      ? `${result.reviews.length} comentario(s) pendiente(s).`
      : 'No hay comentarios pendientes.';
  } catch (error) {
    console.error('Could not load pending comments:', error);
    reviewQueueStatus.textContent =
      error.message || 'No se pudieron cargar los comentarios pendientes.';
    reviewQueueStatus.classList.add('moderation-error');
  }
}

async function moderateReview(id, status, article) {
  const buttons = article.querySelectorAll('button');
  buttons.forEach((button) => {
    button.disabled = true;
  });
  reviewQueueStatus.classList.remove('moderation-error');

  try {
    const response = await fetch('/api/admin/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ id, status }),
    });
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || 'No se pudo guardar la decisión.');
    }

    article.remove();
    reviewQueueStatus.textContent = reviewQueue.children.length
      ? 'La decisión se guardó. Quedan comentarios pendientes.'
      : 'La decisión se guardó. No hay comentarios pendientes.';
  } catch (error) {
    console.error('Could not moderate comment:', error);
    reviewQueueStatus.textContent =
      error.message || 'No se pudo guardar la decisión.';
    reviewQueueStatus.classList.add('moderation-error');
    buttons.forEach((button) => {
      button.disabled = false;
    });
  }
}

document.getElementById('logoutButton').addEventListener('click', async function () {
  await fetch('/api/logout', { method: 'POST', credentials: 'same-origin' });
  window.location.replace('/Admin-Login/Admin-Login.html');
});

verifySession().then((authenticated) => {
  if (authenticated) loadPendingReviews();
});
