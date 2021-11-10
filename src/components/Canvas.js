import { useEffect, useRef } from "react"
import React from 'react';

interface Coordinates {
    x: Number,
    y: Number
}

let clicks = 0;
let isMaybeDragging = false;
let rectList = [];
let rectListBeforeDragging = [];
let rectFound = -1;
let rectFoundForDragging = -1;
let indexToRemove = -1;
let xInitial = -1;
let yInitial = -1;
let xOld = -1;
let yOld = -1;
let xNew = -1;
let yNew = -1;
let delay = 200;

const WIDTH = 150;
const HEIGHT = 250;
const FONT = '20px serif';

function Canvas() {

    const myref = useRef(null);
    let ctx = null;
    let canvas = null;

    //Get mouse coordinates
    function getCoordinates(event: mousemove): Coordinates | undefined {
        var rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        let x = (event.clientX - rect.left) * scaleX;
        let y = (event.clientY - rect.top) * scaleY;
        return [x, y]
    }

    //Search which rectangle is selected
    function searchRect(rectList, x, y) {
        for (let i = rectList.length - 1; i >= 0; i--) {
            if (x >= rectList[i].x && x <= rectList[i].x + WIDTH && y >= rectList[i].y && y <= rectList[i].y + HEIGHT) {
                rectFound = i;
                break;
            }
        }
        return rectFound;
    }

    //Add text box on a rectangle
    function addTextBox(input, xPosition, yPosition, index) {
        ctx.fillStyle = "black";
        input.style.position = 'fixed';
        input.style.left = (xPosition + 15) + 'px';
        input.style.top = (yPosition + 35) + 'px';
        input.style.height = HEIGHT * 0.91 + "px";
        input.style.width = WIDTH * 0.86 + "px";
        indexToRemove = index;
        input.onkeyup = handleUpArrow;
        input.onkeydown = handleDownArrow;
        document.body.appendChild(input);
        input.focus();
    }

    //Draw again elements if necessary
    function drawAgain(i) {
        ctx.beginPath();
        ctx.fillStyle = rectList[i].color;
        ctx.fillRect(rectList[i].x, rectList[i].y, WIDTH, HEIGHT);
        ctx.strokeStyle = "black";
        ctx.strokeRect(rectList[i].x, rectList[i].y, WIDTH, HEIGHT);
        ctx.fillStyle = "black";
        var input = rectList[i].text;
        input.style.left = (rectList[i].x + 15) + 'px';
        input.style.top = (rectList[i].y + +35) + 'px';
        drawText(input.value, parseInt(input.style.left, 10), parseInt(input.style.top, 10));
    }

    //Change rectangle color when click on it
    function changeColor() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.beginPath();
        ctx.fillStyle = getRandomColor();
        rectList[rectFound].color = ctx.fillStyle;
        ctx.fillRect(rectList[rectFound].x, rectList[rectFound].y, WIDTH, HEIGHT);
        ctx.strokeStyle = "black";
        ctx.strokeRect(rectList[rectFound].x, rectList[rectFound].y, WIDTH, HEIGHT);
        ctx.fillStyle = "black";
        var input = rectList[rectFound].text;
        input.style.left = (rectList[rectFound].x + 15) + 'px';
        input.style.top = (rectList[rectFound].y + +35) + 'px';
        drawText(input.value, parseInt(input.style.left, 10), parseInt(input.style.top, 10));
        for (let i = 0; i < rectList.length; i++) { //Have to redraw everything because some parts of rects can be erased during the dragging
            drawAgain(i);
        }
    }

    //Generate a random color
    function getRandomColor() {
        var letters = '0123456789ABCDEF';
        var color = '#';
        for (var i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    //Drag rectangle
    function drag(event: mousemove) {
        if (isMaybeDragging) {
            [xOld, yOld] = [xNew, yNew];
            [xNew, yNew] = getCoordinates(event);
            if (xNew < xInitial + 5 && xNew > xInitial - 5 && yNew < yInitial + 5 && yNew > yInitial - 5) return;
            if (rectFoundForDragging !== -1) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                rectList[rectFoundForDragging].x = rectListBeforeDragging[rectFoundForDragging].x + xOld - xInitial;
                rectList[rectFoundForDragging].y = rectListBeforeDragging[rectFoundForDragging].y + yOld - yInitial;
            }
            for (let i = 0; i < rectList.length; i++) { //Have to redraw everything because some parts of rect can be erased during the dragging
                drawAgain(i);
            }
        }
    }

    //Draw rectangle with text
    function draw(event: mouseup) {
        rectFoundForDragging = -1;
        isMaybeDragging = false;
        [xNew, yNew] = getCoordinates(event);
        rectFound = -1;
        if (xNew < xInitial + 5 && xNew > xInitial - 5 && yNew < yInitial + 5 && yNew > yInitial - 5) {
            rectFound = searchRect(rectList, xInitial, yInitial);
            if (rectFound !== -1) changeColor();
            else {
                ctx.beginPath();
                ctx.fillStyle = "yellow";
                ctx.fillRect(xNew, yNew, WIDTH, HEIGHT);
                ctx.strokeStyle = "black";
                ctx.strokeRect(xNew, yNew, WIDTH, HEIGHT);
                rectList.push({ x: xNew, y: yNew, color: ctx.fillStyle, text: document.createElement('textarea') });
                addTextBox(rectList.at(-1).text, xInitial, yInitial, rectList.length - 1);
            }
        }
    }

    //Modify existing text
    function modify(event: mouseup) {
        isMaybeDragging = false;
        rectFound = searchRect(rectList, xInitial, yInitial);
        if (rectFound !== -1) {
            addTextBox(rectList.at(rectFound).text, rectList[rectFound].x, rectList[rectFound].y, rectFound);
        }
    }

    //Add text
    function handleUpArrow(e) {
        var keyCode = e.keyCode;
        if (keyCode === 38) {
            drawText(this.value, parseInt(this.style.left, 10), parseInt(this.style.top, 10));
            document.body.removeChild(this);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < rectList.length; i++) {
                drawAgain(i);
            }
        }
    }

    //Remove a rectangle
    function handleDownArrow(e) {
        var keyCode = e.keyCode;
        if (keyCode === 40) {
            indexToRemove = searchRect(rectList, xNew, yNew);
            rectList.splice(indexToRemove, 1);
            document.body.removeChild(this);
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            for (let i = 0; i < rectList.length; i++) {
                drawAgain(i);
            }
        }
    }

    //Draw text on a rectangle:
    function drawText(txt, x, y) {
        ctx.textBaseline = 'top';
        ctx.textAlign = 'left';
        ctx.font = FONT;
        if (txt.search(/[a-zA-Z0-9_.-]/g) === -1) { return; }
        var txtSplitted = txt.match(/[^\r\n]+/g);
        for (let i = 0; i < txtSplitted.length; i++) {
            ctx.fillText(txtSplitted[i], x - 3, y - 25 + i * 20, WIDTH - 20);
        }
    }

    //Remove all elements from the canvas
    function clearCanvas() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let textAreaList = document.getElementsByTagName("textarea");
        rectListBeforeDragging.splice(0, rectListBeforeDragging.length);
        rectList.splice(0, rectList.length);
        for (let i = textAreaList.length - 1; i >= 0; i--) {
            var parent = textAreaList[i].parentNode;
            parent.removeChild(textAreaList[i]);
        }
    }

    useEffect(() => {
        if (!myref.current) {
            return;
        }
        canvas = myref.current;
        ctx = canvas.getContext("2d");
        document.addEventListener("mouseup", function (event) {
            clicks++;
            if (clicks === 1) {
                setTimeout(function () {
                    if (clicks === 1) {
                        draw(event);
                    } else {
                        modify(event);
                    }
                    clicks = 0;
                }, delay);
            }
        }, false);
    }, []);

    useEffect(() => {
        if (!myref.current) {
            return;
        }
        canvas = myref.current;
        ctx = canvas.getContext("2d");
        document.addEventListener("mousemove", drag);
        return () => {
            document.removeEventListener('mousemove', drag);
        };
    }, []);

    useEffect(() => {
        if (!myref.current) {
            return;
        }
        canvas = myref.current;
        ctx = canvas.getContext("2d");
        canvas.addEventListener("mousedown", function (event) {
            isMaybeDragging = true;
            [xOld, yOld] = getCoordinates(event);
            [xInitial, yInitial] = getCoordinates(event);
            rectListBeforeDragging = JSON.parse(JSON.stringify(rectList)); // Deep copy, because usually copy in javascript are by reference
            if (rectListBeforeDragging.length > 0) {
                rectFoundForDragging = searchRect(rectListBeforeDragging, xInitial, yInitial);
            }
        }, false);
    }, []);

    useEffect(() => {
        if (!myref.current) {
            return;
        }
        canvas = myref.current;
        canvas.width = 1420;
        canvas.height = 680;
        window.addEventListener('resize', () => {
            canvas = myref.current;
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            for (let i = rectList.length - 1; i >= 0; i--) {
                ctx.fillStyle = rectList[i].color;
                ctx.fillRect(rectList[i].x, rectList[i].y, WIDTH, HEIGHT);
                ctx.strokeStyle = "black";
                ctx.strokeRect(rectList[i].x, rectList[i].y, WIDTH, HEIGHT);
            }
        })
    }, []);

    return (
        <div>
            <button onClick={clearCanvas}>
                Clear canvas
            </button>
            <canvas ref={myref} width={1420} heigth={680} style={{ border: "1px solid black" }} />

        </div>
    );
}

export default Canvas