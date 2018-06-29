//Metodos ao iniciar APP
$(document).ready(function () {



    //REQUISIÇÕES ELECTRON
    const { remote } = require('electron');

    const { ipcRenderer } = require('electron');
    
    const {app, BrowserWindow} = require('electron');

    let options = $('input[name=tipo]');
    let options2 = $('input[name=tipo2]');

    //ADICIONADO FUNÇÕES AOS BOTOES PARA TROCAR OS FILTROS
    options.attr("onclick", "javascript:changeImageFilter()");
    options2.attr("onclick", "javascript:changeImageFilter()");
});

//METODO PARA MANIPULAÇÃO DO MENU LATERAL
function showOptions(i) {
    let visivel = $('#opt' + i).is(':visible');
    if (visivel) $('#opt' + i).hide();
    else $('#opt' + i).fadeIn();
}

//VARIAVEIS GLOBAIS
var backup = {};
var default_widht = 160;
var default_height = 120;
///////////////////////

//METODO PARA O INPUT DO TIPO FILE LER A IMG
function readURL(input) {
    if (input.files && input.files[0]) {
        let reader = new FileReader();

        reader.onload = function (e) {
            base_image = new Image();
            base_image.src = e.target.result;
            base_image.onload = function () {

                //FAZ UM BACKUP DA IMAGEM ORIGINAL SEM FILTRO PARA SER USADA PARA A ALTERAÇÃO DE FILTROS
                backup.original = base_image;
                //////////////

                //LIMPA O CANVAS
                clearCanvas();

                //ALTERAÇÃO DO TAMANHO DA IMAGEM DE ACORDO COM A ESCOLHA
                if ($('input[id="tamanho"]:checked').val() == "on") {
                    //REDIMENSIONA A IMAGEM DE ACORDO COM O VALOR OS INPUTS
                    resizeImage(base_image);
                } else if ($('input[id="tamanho2"]:checked').val() == "on") {
                    //METODO DESATIVADO
                    cropImage(base_image);
                } else {
                    //EXIBE A IMAGEM EM SEU TAMANHO ORIGINAL
                    imgNormal(base_image);
                }

                //APLICA O FILTRO DE ACORDO COM A ESCOLHA
                if ($('input[id="filtro"]:checked').val() == "on") {
                    //APLICAÇÃO DO LBP
                    extract8PointRadius1Feature();
                } else if ($('input[id="filtro2"]:checked').val() == "on") {
                    //APLICAÇÃO DO SOBEL
                    sobelFilter();
                } else {
                    //APLICAÇÃO DA ESCOLA DE CINZA
                    toGrayImage();
                }
                printData();


                //BOTAO NAO ESTA SENDO UTILIZADO
                $('#new').removeClass('disabled');
                //HABILITA O BOTAO PARA BAIXAR A IMAGEM COM  OS FILTRO QUE ESTA NO CANVAS
                $('#btnDownload').removeClass('disabled');

            }
        }

        reader.readAsDataURL(input.files[0]);
    }
}

$("#file").change(readURL);

//METODO PARA ADICIONAR A IMAGEM ORIGINAL NO CANVAS
function setOriginal() {

    let cnv = document.getElementById('imgHtml');
    let cnx = cnv.getContext('2d');

    cnx.clearRect(0, 0, cnv.width, cnv.height);
    cnx.beginPath();

    cnx.moveTo(0, 0);
    cnx.stroke();

    imgNormal(backup.original);

}

//METODO PARA BAIXAR A IMAGEM DO CANVAS
function download() {
    let download = document.getElementById("download");
    let image = document.getElementById("imgHtml").toDataURL("image/png")
        .replace("image/png", "image/octet-stream");
    download.setAttribute("href", image);
    //download.setAttribute("download","archive.png");
}

//METODO PARA SALVAR O DATA DA IMAGEM EM UM ARQUIVO TXT NA RAIZ DO SOFTWARE
function printData() {
    let cnv = document.getElementById('imgHtml');
    let cnx = cnv.getContext('2d');

    let width = cnv.width;
    let height = cnv.height;

    let data = cnx.getImageData(0, 0, 160, 120).data;
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

//METODO PARA ALTERAR FILTRO E TAMANHO DA IMAGEM SE UTILIZANDO DA IMAGEM SALVA NO BACKUP
//FUNCIONA DA MESMA MANEIRA QUE O METODO "readURL", POREM UTILIZANDO-SE DA IMAGEM DO BACKUP
function changeImageFilter() {

    if (backup.original != null) {
        clearCanvas();

        let cnv = document.getElementById('imgHtml');
        let cnx = cnv.getContext('2d');

        if ($('input[id="tamanho"]:checked').val() == "on") {
            resizeImage(backup.original);
        } else if ($('input[id="tamanho2"]:checked').val() == "on") {
            cropImage(backup.original);
        } else {
            imgNormal(backup.original);
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
    } else {
        console.log('sem valor');
    }

}

//METODO PARA LIMPAR O CANVAS
function clearCanvas() {
    let cnv = document.getElementById('imgHtml');
    let cnx = cnv.getContext('2d');

    cnx.clearRect(0, 0, cnv.width, cnv.height);

    cnx.beginPath();
}

//METODO PARA ATUALIZAR A PAGINA Q NAO ESTA SENDO UTILIZADO
function processarImg() {
    const { getCurrentWindow } = require('electron').remote;

    getCurrentWindow().reload();
}

//METODO PARA EXIBIR IMAGEM NO TAMANHO ORIGINAL DA MESMA
function imgNormal(image) {
    let cnv = document.getElementById('imgHtml');
    let cnx = cnv.getContext('2d');

    cnv.width = image.width;
    cnv.height = image.height;

    cnx.drawImage(image, 0, 0, image.width, image.height)
}

//METODO PARA EXIBIR A IMAGEM DE ACORDO COM O TAMANHO INFORMADO NOS INPUTS
function resizeImage(image) {
    let cnv = document.getElementById('imgHtml');
    let cnx = cnv.getContext('2d');
    
    //INPUT WIDHT
    let img_widht = $('#wImage').val();
    //INPUT HEIGHT
    let img_height = $('#hImage').val();

    //CASO O INPUT ESTIVER NULO ELE IRA ATRIBUIR O WIDHT PADRAO DEFINIDO NAS VARIAVEIS GLOBAIS
    if(img_widht == 0 || img_widht == null){
        $('#wImage').val(default_widht);
        img_widht = default_widht;
    }

    if(img_height == 0 || img_height == null){
        $('#hImage').val(default_height);
        img_height = default_height;
    }
    ///////////////////////////////////////////////

    cnv.width = img_widht;
    cnv.height = img_height;

    cnx.drawImage(image, 0, 0, img_widht, img_height)
}

//FUNCAO DESATIVADA QUE SERIA PARA PEGAR O CENTRO DA IMAGEM
//NAO ESTA FUNCIONANDO
function cropImage(image) {

    let cnv = document.getElementById('imgHtml');
    let cnx = cnv.getContext('2d');

    let xStart = 0,
        yStart = 0,
        aspectRadio,
        newWidth,
        newHeight,
        height = 120,
        width = 160;

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

//METODOS USADOS NA ESCALA DE CINZA
function getCanvasCoordinates(n, width) {
    let x = (n / 4) % width
        , y = (n / 4 - x) / width;
    return { x: x, y: y };
}

//METODO PARA A APLICACAO DA ESCALA DE CINZA NA FOTO
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

//MEOTODOS PARA O LBP
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

//METODO PRINCIPAL DO LBP
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

//METODO DO SOBEL 
//METODO UTILIZA O PACOTE SOBEL INSTALADO PELO NPM
//LINK DO GITHUB https://github.com/miguelmota/sobel
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

//METODO DO CANNY FILTER NAO UTILIZADO
// function cannyFilter(canvas = document.getElementById('imgHtml')){
//     const cannyEdgeDetector  =  require('canny-edge-detector');
//     const {Image} = require('image-js');
    
//     Image.load(backup.original.src).then((img) => {
//         const grey = img.grey();
//         const edge = cannyEdgeDetector(img); 
//         context.drawImage(edge, 0, 0, 160, 124)
//     });  
// }


//METODO INICIAL PARA SE LER FOTOS EM PASTA
//NAO ESTA SENDO UTILIZADO
const fs = require('fs');
const pixelUtil = require('pixel-util');

function editarFotosPasta() {
    const entrada = './input/';
    const saida = './output/';
    let filtro = 'LBP';


    let arquivos = [];

    fs.readdirSync(entrada).forEach(file => {
        arquivos.push(file);
    })

    arquivos.forEach(element => {
        let efile = entrada + element;

        pixelUtil.createBuffer(efile).then(function (buffer) {

            let sfile = saida + filtro + '-' + element;
            let data = buffer;

            fs.writeFile(sfile, data, function (err) {
                if (err) {
                    return console.log(err);
                }

                console.log("The file was saved!");
            });
        });
    })

}