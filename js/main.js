document.addEventListener('DOMContentLoaded', function () {
    // Obtener elementos del DOM
    var checkIcon = document.getElementById('check-icon');
    var mobileMenuContainer = document.querySelector('.mobile-menu-container');

    // Agregar evento de cambio al checkbox
    checkIcon.addEventListener('change', function () {
        // Agregar o quitar la clase 'menu-open' según el estado del checkbox
        if (checkIcon.checked) {
            mobileMenuContainer.classList.add('menu-open');
            console.log("Menu Abierto")
        } else {
            mobileMenuContainer.classList.remove('menu-open');
            console.log("Menu Cerrado")
        }
    });
});