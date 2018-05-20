$(document).ready(function () {


    const app = require('electron').remote.app;

    const { remote } = require('electron');

    const { ipcRenderer } = require('electron');

    $('#btnCancel').click(function () {

        remote.BrowserWindow.getFocusedWindow().close();

    })
});

function showOptions(i) {
    var visivel = $('#opt' + i).is(':visible');
    if (visivel) $('#opt' + i).hide();
    else $('#opt' + i).fadeIn();
}

function readURL(input) {
    if (input.files && input.files[0]) {
        var reader = new FileReader();

        reader.onload = function (e) {
            base_image = new Image();
            base_image.src = e.target.result;
            base_image.onload = function () {
                var cnv = document.getElementById('imgHtml');
                var cnx = cnv.getContext('2d');

                cnx.clearRect(0, 0, cnv.width, cnv.height);

                cnx.beginPath();
                if ($('input[id="tamanho"]:checked').val() == "on") {
                    resizeImage(base_image);
                } else if ($('input[id="tamanho2"]:checked').val() == "on") {
                    cropImage(base_image);
                } else {
                    imgNormal(base_image);
                }

                if ($('input[id="filtro"]:checked').val() == "on") {
                    extract8PointRadius1Feature();
                } else if ($('input[id="filtro2"]:checked').val() == "on") {
                    sobelFilter();
                } else {
                    toGrayImage();
                }
                printData();

            }
        }

        reader.readAsDataURL(input.files[0]);
    }
}

$("#file").change(readURL);

function printData() {
    var cnv = document.getElementById('imgHtml');
    var cnx = cnv.getContext('2d');

    var width = cnv.width;
    var height = cnv.height;

    var data = cnx.getImageData(0, 0, 160, 120).data;

    var fs = require('fs');

    fs.exists('DATA-IMG.txt', (exists) => {
        if (exists) {
            fs.unlink('DATA-IMG.txt', (err) => {
                if (err) throw err;
                fs.writeFileSync('DATA-IMG.txt', data);
            });
        } else {
            fs.writeFileSync('DATA-IMG.txt', data);
        }
    });

}

function clearCanvas() {
    var cnv = document.getElementById('imgHtml');
    var cnx = cnv.getContext('2d');

    cnx.clearRect(0, 0, cnv.width, cnv.height);

    cnx.beginPath();
}

function processarImg() {
    if ($('input[id="filtro"]:checked').val() == "on") {
        extract8PointRadius1Feature();
    } else if ($('input[id="filtro2"]:checked').val() == "on") {
        sobelFilter();
    } else {
        toGrayImage();
    }
}

function imgNormal(image) {
    var cnv = document.getElementById('imgHtml');
    var cnx = cnv.getContext('2d');

    cnx.drawImage(image, 0, 0, image.width, image.height)
}

function resizeImage(image) {
    var cnv = document.getElementById('imgHtml');
    var cnx = cnv.getContext('2d');

    cnx.drawImage(image, 0, 0, 160, 120)
}

function cropImage(image) {

    var cnv = document.getElementById('imgHtml');
    var cnx = cnv.getContext('2d');

    var xStart = 0,
        yStart = 0,
        aspectRadio,
        newWidth,
        newHeight,
        height = 285,
        width = 380;

    aspectRadio = image.height / image.width;

    if (image.height < image.width) {
        //horizontal
        aspectRadio = image.width / image.height;
        newHeight = height,
            newWidth = aspectRadio * height;
        xStart = -(newWidth - width) / 2;
    } else {
        //vertical
        newWidth = width,
            newHeight = aspectRadio * width;
        yStart = -(newHeight - height) / 2;
    }

    cnx.drawImage(image, xStart, yStart, newWidth, newHeight); // centro img   
}

function getCanvasCoordinates(n, width) {
    var x = (n / 4) % width
        , y = (n / 4 - x) / width;
    return { x: x, y: y };
}

function toGrayImage() {
    var canvas = document.getElementById('imgHtml');
    var context = canvas.getContext('2d')

    var width = canvas.width;
    var height = canvas.height;

    var imgd = context.getImageData(0, 0, width, height);
    // get all pixel data
    var data = new Array(width);
    for (var i = 0; i < imgd.data.length; i += 4) {
        var coord = getCanvasCoordinates(i, width);
        if (!data[coord.x]) data[coord.x] = new Array(height);
        // change to grayscale
        var grayValue = Math.floor(imgd.data[i] * 0.3 + imgd.data[i + 1] * 0.59 + imgd.data[i + 2] * 0.11);
        imgd.data[i] = imgd.data[i + 1] = imgd.data[i + 2] = grayValue;
        data[coord.x][coord.y] = grayValue;
    }
    // replace image with grayscale version
    context.putImageData(imgd, 0, 0);

}

//LBP FUNCTIONS

const RGBA_SHIFT = 4;

function get1DPosition(colLength, x, y) {
    return x + y * colLength;
}

function getImageData(canvas, ...parameters) {
    return parameters.length === 4
        ? canvas.getContext('2d').getImageData(...parameters)
        : canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
}

function unitStep(n) {
    if (n < 0) {
        return 0;
    } else if (n >= 0) {
        return 1;
    }
}

function getGrayScaleValue(data, position) {
    return data[position] * 0.3 + data[position + 1] * 0.59 + data[position + 2] * 0.11;
}

function extract8PointRadius1Feature(canvas = document.getElementById('imgHtml'), radius = 1) {
    let context = canvas.getContext('2d');
    let imageData = getImageData(canvas);
    let data = imageData.data;
    let backupData = imageData.data.slice();

    for (let y = 1; y < canvas.height - 1; y++) {
        for (let x = 1, index = 0; x < canvas.width - 1; x++ , index += 4) {
            let sum = 0;
            let neighbourValue = [];
            let centerPosition = get1DPosition(canvas.width, x, y) * RGBA_SHIFT;
            let centerValue = getGrayScaleValue(backupData, centerPosition);
            neighbourValue[7] = getGrayScaleValue(backupData, get1DPosition(canvas.width, x - radius, y - radius) * RGBA_SHIFT) - centerValue;
            neighbourValue[6] = getGrayScaleValue(backupData, get1DPosition(canvas.width, x, y - radius) * RGBA_SHIFT) - centerValue;
            neighbourValue[5] = getGrayScaleValue(backupData, get1DPosition(canvas.width, x + radius, y - radius) * RGBA_SHIFT) - centerValue;
            neighbourValue[4] = getGrayScaleValue(backupData, get1DPosition(canvas.width, x + radius, y) * RGBA_SHIFT) - centerValue;
            neighbourValue[3] = getGrayScaleValue(backupData, get1DPosition(canvas.width, x + radius, y + radius) * RGBA_SHIFT) - centerValue;
            neighbourValue[2] = getGrayScaleValue(backupData, get1DPosition(canvas.width, x, y + radius) * RGBA_SHIFT) - centerValue;
            neighbourValue[1] = getGrayScaleValue(backupData, get1DPosition(canvas.width, x - radius, y + radius) * RGBA_SHIFT) - centerValue;
            neighbourValue[0] = getGrayScaleValue(backupData, get1DPosition(canvas.width, x - radius, y) * RGBA_SHIFT) - centerValue;

            for (let k = 0, totalNeighbour = neighbourValue.length; k < totalNeighbour; k++) {
                sum += unitStep(neighbourValue[k]) * Math.pow(2, k);
            }
            data[centerPosition] = data[centerPosition + 1] = data[centerPosition + 2] = sum;
        }
    }

    context.clearRect(0, 0, canvas.width, canvas.height);
    context.putImageData(imageData, 0, 0);
}

function sobelFilter(canvas = document.getElementById('imgHtml')) {
    const Sobel = require('sobel');
    let context = canvas.getContext('2d');
    let imageData = getImageData(canvas);

    width = canvas.width;
    height = canvas.height;

    // Sobel constructor returns an Uint8ClampedArray with sobel data
    var sobelData = Sobel(imageData);

    // [sobelData].toImageData() returns a new ImageData object
    var sobelImageData = sobelData.toImageData();
    context.putImageData(sobelImageData, 0, 0);
}