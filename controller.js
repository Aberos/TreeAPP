$(document).ready(function () {


    const app = require('electron').remote.app;

    const { remote } = require('electron');

    const { ipcRenderer } = require('electron');

    $('#btnCancel').click(function () {

        remote.BrowserWindow.getFocusedWindow().close();

    })

    let options = $('input[name=tipo]');
    let options2 = $('input[name=tipo2]');

    options.attr("onclick", "javascript:changeImageFilter()");
    options2.attr ("onclick", "javascript:changeImageFilter()");
});

function showOptions(i) {
    let visivel = $('#opt' + i).is(':visible');
    if (visivel) $('#opt' + i).hide();
    else $('#opt' + i).fadeIn();
}

var info = {};

function readURL(input) {
    if (input.files && input.files[0]) {
        let reader = new FileReader();

        reader.onload = function (e) {
            base_image = new Image();
            base_image.src = e.target.result;
            base_image.onload = function () {

                info.original = base_image;

                clearCanvas();

                let cnv = document.getElementById('imgHtml');
                let cnx = cnv.getContext('2d');

                if ($('input[id="tamanho"]:checked').val() == "on") {
                    cnv.width = 160;
                    cnv.height = 120;
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

                //$('#fileDiv').hide();
                $('#new').removeClass('disabled');
                $('#btnDownload').removeClass('disabled');

            }
        }

        reader.readAsDataURL(input.files[0]);
    }
}

$("#file").change(readURL);

function clearCanvas() {

    let cnv = document.getElementById('imgHtml');
    let context = cnv.getContext('2d');

    context.clearRect(0, 0, 500, 300);

}


function setOriginal() {

    let cnv = document.getElementById('imgHtml');
    let cnx = cnv.getContext('2d');

    cnx.clearRect(0, 0, cnv.width, cnv.height);
    cnx.beginPath();

    cnx.moveTo(0, 0);
    cnx.stroke();

    imgNormal(info.original);

}

function download() {
    let download = document.getElementById("download");
    let image = document.getElementById("imgHtml").toDataURL("image/png")
        .replace("image/png", "image/octet-stream");
    download.setAttribute("href", image);
    //download.setAttribute("download","archive.png");
}

function printData() {
    let cnv = document.getElementById('imgHtml');
    let cnx = cnv.getContext('2d');

    let width = cnv.width;
    let height = cnv.height;

    let data = cnx.getImageData(0, 0, 160, 120).data;

    let fs = require('fs');

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

function changeImageFilter() {

    if (info.original != null) {
        clearCanvas();

        let cnv = document.getElementById('imgHtml');
        let cnx = cnv.getContext('2d');

        if ($('input[id="tamanho"]:checked').val() == "on") {
            cnv.width = 160;
            cnv.height = 120;
            resizeImage(info.original);
        } else if ($('input[id="tamanho2"]:checked').val() == "on") {
            cropImage(info.original);
        } else {
            imgNormal(info.original);
        }

        if ($('input[id="filtro"]:checked').val() == "on") {
            extract8PointRadius1Feature();
        } else if ($('input[id="filtro2"]:checked').val() == "on") {
            sobelFilter();
        } else {
            toGrayImage();
        }
        printData();

        //$('#fileDiv').hide();
        $('#new').removeClass('disabled');
        $('#btnDownload').removeClass('disabled');
        console.log('com valor');
    }else{
        console.log('sem valor');
    }

}

function clearCanvas() {
    let cnv = document.getElementById('imgHtml');
    let cnx = cnv.getContext('2d');

    cnx.clearRect(0, 0, cnv.width, cnv.height);

    cnx.beginPath();
}

function processarImg() {
    const { getCurrentWindow } = require('electron').remote;

    getCurrentWindow().reload();
}

function imgNormal(image) {
    let cnv = document.getElementById('imgHtml');
    let cnx = cnv.getContext('2d');

    cnv.width = 500;
    cnv.height = 300;

    cnx.drawImage(image, 0, 0, image.width, image.height)
}

function resizeImage(image) {
    let cnv = document.getElementById('imgHtml');
    let cnx = cnv.getContext('2d');

    cnx.drawImage(image, 0, 0, 160, 120)
}

function cropImage(image) {

    let cnv = document.getElementById('imgHtml');
    let cnx = cnv.getContext('2d');

    let xStart = 0,
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

    cnv.width = newWidth;
    cnv.height = newHeight;

    cnx.drawImage(image, xStart, yStart, newWidth, newHeight); // centro img   
}

function getCanvasCoordinates(n, width) {
    let x = (n / 4) % width
        , y = (n / 4 - x) / width;
    return { x: x, y: y };
}

function toGrayImage() {
    let canvas = document.getElementById('imgHtml');
    let context = canvas.getContext('2d')

    let width = canvas.width;
    let height = canvas.height;

    let imgd = context.getImageData(0, 0, width, height);
    // get all pixel data
    let data = new Array(width);
    for (let i = 0; i < imgd.data.length; i += 4) {
        let coord = getCanvasCoordinates(i, width);
        if (!data[coord.x]) data[coord.x] = new Array(height);
        // change to grayscale
        let grayValue = Math.floor(imgd.data[i] * 0.3 + imgd.data[i + 1] * 0.59 + imgd.data[i + 2] * 0.11);
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
    let sobelData = Sobel(imageData);

    // [sobelData].toImageData() returns a new ImageData object
    let sobelImageData = sobelData.toImageData();
    context.putImageData(sobelImageData, 0, 0);
}