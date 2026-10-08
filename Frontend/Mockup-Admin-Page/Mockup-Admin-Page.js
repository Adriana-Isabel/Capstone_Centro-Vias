// Mockup-Admin-Page - plain vanilla JS (no framework).
// - Show password toggle
// - Demo sign-in validation with inline error message

document.addEventListener('DOMContentLoaded', () => {
  const pwd = document.getElementById('p');
  const user = document.getElementById('u');
  const showPwd = document.querySelector('input[type=checkbox]');
  const signInBtn = document.querySelector('.card .btn');
  const errorBox = document.querySelector('[role=alert]');

  if (showPwd && pwd) {
    showPwd.addEventListener('change', () => {
      pwd.type = showPwd.checked ? 'text' : 'password';
    });
  }

  if (signInBtn) {
    signInBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const hasUser = user && user.value.trim() !== '';
      const hasPwd = pwd && pwd.value.trim() !== '';
      if (errorBox) {
        if (!hasUser || !hasPwd) {
          errorBox.textContent = 'Por favor, escribe tu correo electrónico y tu contraseña.';
          errorBox.style.display = 'block';
        } else {
          errorBox.textContent = '[ Mensaje de error: correo electrónico o contraseña incorrectos ]';
          errorBox.style.display = 'block';
        }
      }
    });
  }
});
