import fs from 'fs';
import Canvas from "canvas";

export function generateColor(){
    var symbols, color;
    symbols = "0123456789ABCDEF";
    color = "#";
    for(var i = 0; i<6; i++){
        color = color + symbols[Math.floor(Math.random()*16)];
    }
    return color;
}
export function generateAvatar(text, fieldName) {
    const canvas = Canvas.createCanvas(200, 200);
    
    const context = canvas.getContext("2d");
    const backgroundColor = generateColor();
    canvas.width = 200;
    canvas.height = 200;

    // Draw background
    context.fillStyle = backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Draw text
    context.font = "bold 100px Sans";
    context.fillStyle = "white";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(text, canvas.width / 2, canvas.height / 2);

    const buffer = canvas.toBuffer('image/png');
    const nameImage = './public/uploads/' + fieldName + '-' + Date.now() + '.png';
    fs.writeFileSync(nameImage, buffer);
    return nameImage;
}