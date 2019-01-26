
document.addEventListener('DOMContentLoaded', () => {
  console.log('IronGenerator JS imported successfully!');

  //book icons event handlers
  // $( '.star-book' ).click(function() {
  //   alert( "Handler for .click() called." );
  // });

  $('.star-book').click(function(e) {
    // e.preventDefault();
    $("#book-input").val('true');
    $("#testForm").submit();
  });
  //book icons event handlers end
  
  var resize;
  $('#my-image').toggle();
  function readURL(input) {
    
    if (input.files && input.files[0]) {
      var reader = new FileReader();
      reader.onload = function(e) {
        console.log('my image:',$('#my-image').attr('src'));

        if(resize instanceof Croppie){
          console.log('instance!');
          
          resize.destroy();
          resize = null;
        }

        $('#my-image').attr('src', e.target.result);

        resize = new Croppie($('#my-image')[0], {
          viewport: { width: 150, height: 150, type:'circle' },
          boundary: { width: 200, height: 200 },
          showZoomer: false,
          enableOrientation: true
        });

        $('#use').on('click', function() {
          
          if($('#result').attr('src').length > 0){
            $('#result').attr('src','');
          }
          
          resize.result('base64')
          .then(function(dataImg) {
            console.log('dataImg',dataImg);
            var data = [{ image: dataImg }, { name: 'profilePic.jpg' }];
            // use ajax to send data to php
            $('#result').attr('src', dataImg);


            $('#input-profilePic').val(dataImg) ;
            // $('.croppie-container').toggle();
            var myIm = $('#my-image')[0].outerHTML;
          
          $('.croppie-container').remove();
          $('#my-image').remove();
          $('#croppie-upload').append('<img id="my-image" src="#" />');
          $('#my-image').toggle();
          })
        })
      }
      reader.readAsDataURL(input.files[0]);
    }
  }

  
  
  $("#imgInp").change(function() {
    readURL(this);
  });



  

}, false);

