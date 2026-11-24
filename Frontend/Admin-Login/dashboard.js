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
