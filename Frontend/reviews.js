const reviewsContainer = document.getElementById('approved-reviews');
const emptyReviews = document.getElementById('reviews-empty');
const emptyReviewsMessage = document.getElementById('reviews-empty-message');
const reviewForm = document.getElementById('review-form');
const reviewStatus = document.getElementById('review-form-status');
const reviewSubmit = document.getElementById('review-submit');

function createApprovedReview(review) {
  const article = document.createElement('article');
  article.className = 'approved-review';

  const metadata = document.createElement('div');
  metadata.className = 'approved-review-meta';

  const author = document.createElement('strong');
  author.textContent = review.authorName;

  const date = document.createElement('time');
  const submittedAt = new Date(Number(review.submittedAt));
  if (!Number.isNaN(submittedAt.getTime())) {
    date.dateTime = submittedAt.toISOString();
    date.textContent = submittedAt.toLocaleDateString('es-PR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  const message = document.createElement('p');
  message.textContent = review.message;

  metadata.append(author, date);
  article.append(metadata, message);
  return article;
}

async function loadApprovedReviews() {
  try {
    const response = await fetch('/api/reviews', {
      credentials: 'same-origin',
    });
    const result = await response.json();
    if (!response.ok || !Array.isArray(result.reviews)) {
      throw new Error(result.error || 'No se pudieron cargar los comentarios.');
    }

    if (result.reviews.length === 0) return;

    reviewsContainer.replaceChildren(
      ...result.reviews.map(createApprovedReview),
    );
    emptyReviews.hidden = true;
    reviewsContainer.hidden = false;
  } catch (error) {
    console.error('Could not load approved comments:', error);
    emptyReviewsMessage.textContent =
      'No se pudieron cargar los comentarios ahora. Inténtalo más tarde.';
  }
}

reviewForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  reviewStatus.textContent = '';
  reviewSubmit.disabled = true;
  reviewSubmit.textContent = 'Enviando...';

  try {
    const response = await fetch('/api/reviews', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        authorName: reviewForm.elements.authorName.value,
        message: reviewForm.elements.message.value,
      }),
    });
    const result = await response.json();

    if (!response.ok) {
      reviewStatus.textContent =
        result.error || 'No se pudo enviar el comentario. Inténtalo de nuevo.';
      return;
    }

    reviewForm.reset();
    reviewStatus.textContent =
      'Tu comentario se envió al equipo para revisión. Si se aprueba, aparecerá aquí.';
  } catch (error) {
    console.error('Could not submit comment:', error);
    reviewStatus.textContent =
      'No se pudo conectar con el servidor. Inténtalo de nuevo más tarde.';
  } finally {
    reviewSubmit.disabled = false;
    reviewSubmit.textContent = 'Enviar para revisión';
  }
});

loadApprovedReviews();
