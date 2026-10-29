document.getElementById('showPw').addEventListener('change', function () {
  document.getElementById('p').type = this.checked ? 'text' : 'password';
});