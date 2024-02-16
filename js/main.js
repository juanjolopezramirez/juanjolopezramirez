document.addEventListener('DOMContentLoaded', function () {
   const slides = document.querySelectorAll('.slide');
   const radioButtons = document.querySelectorAll('input[type=radio]');
   const controlsLabels = document.querySelectorAll('.controls label');
   const bulletsLabels = document.querySelectorAll('.bullets label');

   for (let i = 0; i < radioButtons.length; i++) {
      radioButtons[i].addEventListener('change', function () {
         for (let j = 0; j < slides.length; j++) {
            slides[j].classList.remove('active');
            controlsLabels[j].classList.remove('active');
            bulletsLabels[j].classList.remove('active');
         }

         slides[i].classList.add('active');
         controlsLabels[i].classList.add('active');
         bulletsLabels[i].classList.add('active');
      });
   }
});
