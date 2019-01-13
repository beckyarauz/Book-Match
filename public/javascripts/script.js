
document.addEventListener('DOMContentLoaded', () => {

  console.log('IronGenerator JS imported successfully!');

  function readURL(input) {
    if (input.files && input.files[0]) {
      var reader = new FileReader();
      reader.onload = function(e) {
        $('#my-image').attr('src', e.target.result);
        var resize = new Croppie($('#my-image')[0], {
          viewport: { width: 150, height: 150, type:'circle' },
          boundary: { width: 200, height: 200 },
          // enforceBoundary: true,
          showZoomer: false,
          enableOrientation: true
        });
        $('#use').fadeIn();
        $('#use').on('click', function() {
          resize.result('base64').then(function(dataImg) {
            var data = [{ image: dataImg }, { name: 'profilePic.jpg' }];
            // use ajax to send data to php
            $('#result').attr('src', dataImg);
            $('#profile-pic').val(dataImg) ;
          })
          $('.croppie-container').toggle();
        })
      }
      reader.readAsDataURL(input.files[0]);
    }
  }

  
  
  $("#imgInp").change(function() {
    $('.croppie-container').toggle();
    readURL(this);
  });

}, false);
