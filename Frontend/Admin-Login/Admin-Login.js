document.getElementById('showPw').addEventListener('change', function () {
  document.getElementById('p').type = this.checked ? 'text' : 'password';
});

const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const loginButton = document.getElementById('loginButton');

loginForm.addEventListener('submit', async function (event) {
  event.preventDefault();
  loginError.hidden = true;
  loginButton.disabled = true;
  loginButton.textContent = 'Iniciando sesión...';

  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({
        email: document.getElementById('u').value,
        password: document.getElementById('p').value,
      }),
    });

    if (response.ok) {
      window.location.assign('/Admin-Login/dashboard.html');
      return;
    }

    const result = await response.json().catch(() => ({ error: 'No se pudo iniciar sesión.' }));
    loginError.textContent = result.error || 'No se pudo iniciar sesión.';
    loginError.hidden = false;
  } catch (_error) {
    loginError.textContent = 'No se pudo conectar con el servidor. Inténtalo de nuevo.';
    loginError.hidden = false;
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = 'Iniciar sesión';
  }
});