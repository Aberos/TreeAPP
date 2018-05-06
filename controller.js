$(document).ready(function () {


});


function readURL(input) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();

        reader.onload = function (e) {
            base_image = new Image();
            base_image.src = e.target.result;
            base_image.onload = function () {
                grey(base_image);
            }
        }

        reader.readAsDataURL(input.files[0]);
    }
}

$("#file").change(readURL);

function grey(input) {

    var cnv = document.getElementById('imgHtml');
    var cnx = cnv.getContext('2d');

    //cnx.drawImage(base_image, 0, 0,160,120);

    var xStart = 0,
        yStart = 0,
        aspectRadio,
        newWidth,
        newHeight,
        height = 160,
        width = 120;

    aspectRadio = base_image.height / base_image.width;

    if (base_image.height < base_image.width) {
        //horizontal
        aspectRadio = base_image.width / base_image.height;
        newHeight = height,
            newWidth = aspectRadio * height;
        xStart = -(newWidth - width) / 2;
    } else {
        //vertical
        newWidth = width,
            newHeight = aspectRadio * width;
        yStart = -(newHeight - height) / 2;
    }

    console.log(xStart);
    cnx.drawImage(base_image, xStart, yStart, width, height);



    var width = input.width;
    var height = input.height;
    var imgPixels = cnx.getImageData(0, 0, width, height);

    for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
            var i = (y * 4) * width + x * 4;
            var avg = (imgPixels.data[i] + imgPixels.data[i + 1] + imgPixels.data[i + 2]) / 3;
            imgPixels.data[i] = avg;
            imgPixels.data[i + 1] = avg;
            imgPixels.data[i + 2] = avg;
        }
    }

    cnx.putImageData(imgPixels, 0, 0, 0, 0, imgPixels.width, imgPixels.height);
}