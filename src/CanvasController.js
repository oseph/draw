import React from 'react';
import UIPanel from './UIPanel';
import Pressure from 'pressure';

var mouseDown = 0;
document.body.onmousedown = function() { 
  ++mouseDown;
}
document.body.onmouseup = function() {
  --mouseDown;
}


class CanvasController extends React.Component {
  static defaultProps = {
    width: 0.8*window.innerWidth,
    height: 0.7*window.innerHeight,
    brushCol: 'black',
    mouseLoc: [0, 0],
    prevMouseLoc: [0, 0]
  };

  constructor(props) {
    super(props);
    this.state = {
      opacity: 1,
      brushSize: 5,
      color: 0,
      pressure: 0.5,
      mouseOut: false,
    };

    this.canvasRef = React.createRef();
    this.brushPanelRef = React.createRef();
    this.sliderChange = this.brushSizeChange.bind(this);
    this.opacityChange = this.opacityChange.bind(this);
    this.colorChange = this.colorChange.bind(this);
    this.keyDown = this.keyDown.bind(this);
    this.pts = []; 

    // this is the graphics context we brush strokes onto. gets pushed down main canvas on mouse up
    this.drawLayer = document.createElement('canvas');
    this.drawLayer.width = this.props.width;
    this.drawLayer.height = this.props.height;

    // this is the drawing-to-date. 
    this.drawingToDate = document.createElement('canvas');
    this.drawingToDate.width = this.props.width;
    this.drawingToDate.height = this.props.height;

    this.brushCursor = document.createElement('canvas');
    this.brushCursor.width = this.state.brushSize;
    this.brushCursor.height = this.state.brushSize;
  }

  componentDidMount() {
    const { brushCol, brushSize } = this.props;
    this.context = this.canvasRef.current.getContext('2d');
    this.context.lineWidth = brushSize;
    this.context.strokeStyle = brushCol;
    this.context.lineJoin = this.context.lineCap = 'round';
    this.bb = this.canvasRef.current.getBoundingClientRect();
    this.context.fillStyle = "white";
    this.context.fillRect(0,0, this.context.canvas.width, this.context.canvas.height);

    let ctx = this.drawLayer.getContext('2d');
    ctx.globalAlpha = this.state.opacity;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.fillStyle = "black";
    ctx.fillRect(20,20, 100,100);
    this.context.drawImage(ctx.canvas,0,0);

    Pressure.set('#mainCanvas', {
      change: (force, event) => {
        // console.log(event.pointerType)
        this.setState({
          pressure: force,
        });
        this.mouseMove(event);
      },
      start: (e) => {
        this.mouseDown(e);
      },
      end: () => {
        this.setState({
          // set to default pressure for non-pressure input, e.g. mouse.
          pressure: 0.5 
        });
        this.mouseUp();
      }
    }, {polyfill: false});
    this.clearScene();
  }

  endDrawState() {
    var ctx = this.drawingToDate.getContext('2d');
    var mainCanvas = this.canvasRef.current.getContext("2d");
    ctx.clearRect(0,0,ctx.canvas.width, ctx.canvas.height);
    ctx.drawImage(mainCanvas.canvas, 0,0);
    this.pts = [];
  }

  mouseUp = ()  => {
    if (mouseDown === 0) {
      // this.setState({ 
      //   mouseDown: false
      // });
      this.endDrawState();
    } 
  }

  getMousePos = (e) => {   
    return [
      (e.pageX || e.touches[0].pageX) - this.bb.left,
      (e.pageY || e.touches[0].pageY) - this.bb.top
    ];
  }

  mouseMove = (e) => {
    let mousePos = this.getMousePos(e);
    this.setState({
      mouseLoc: mousePos,
    });
    if (mouseDown === 1) {
      var point = {
        pos: mousePos,
        pressure: this.state.pressure
      }
      this.pts.push(point);
    }
    this.draw(e)
  }

  mouseDown = (e) => {
    let mousePos = this.getMousePos(e);
    var point = {
      pos: mousePos,
      pressure: this.state.pressure
    }
    this.pts.push(point);
    this.draw(e);
    this.setState({
      mouseLoc: mousePos,
      mouseOut: false
    });
  }

  draw = (e) => {
    let mousePos = this.getMousePos(e);
    var context = this.drawLayer.getContext('2d');
    context.clearRect(0,0, context.canvas.width, context.canvas.height);
    context.strokeStyle = "rgba("+this.state.color+","+this.state.color+","+this.state.color+", 1.0)";

    if (this.pts.length === 1) {
      context.fillStyle = context.strokeStyle;
      context.beginPath();
      let startPos = this.pts[0].pos;
      context.arc(startPos[0], startPos[1], (this.state.brushSize/2)*this.state.pressure, 0, 2*Math.PI);
      context.fill();
      context.closePath();
    } else if (this.pts.length > 1) {
      this.drawStroke(this.pts, context);
    }
      let ctx = this.canvasRef.current.getContext('2d')
      ctx.globalAlpha = 1.0;
      ctx.clearRect(0,0, ctx.canvas.width, ctx.canvas.height);
      ctx.drawImage(this.drawingToDate,0,0);
      ctx.globalAlpha = this.state.opacity;
      ctx.drawImage(context.canvas,0,0);
      
      //draw cursor
      this.drawCursor(mousePos, ctx);
  }

  drawCursor(mousePos, ctx) {
    if (mouseDown === 0) {
      this.brushCursor.width =  this.state.brushSize;
      this.brushCursor.height = this.state.brushSize;
      let cursorContext = this.brushCursor.getContext('2d');
      cursorContext.beginPath();
      cursorContext.arc(cursorContext.canvas.width/2, cursorContext.canvas.height/2, this.state.brushSize/4, 0, Math.PI*2);
      cursorContext.closePath();
      cursorContext.stroke();
      ctx.drawImage(cursorContext.canvas, mousePos[0]-this.state.brushSize/2, mousePos[1]-this.state.brushSize/2);
    }
  }

  drawStroke(points, context) {
    for (let i = 1; i < points.length; i++) {
      let start_pos = points[i-1].pos;
      let end_pos = points[i].pos;
      context.beginPath();
      context.moveTo(start_pos[0], start_pos[1]);
      context.lineTo(end_pos[0], end_pos[1]);
      let presh = (points[i].pressure) * (this.state.brushSize);
      context.lineWidth = presh;
      context.stroke();
      context.closePath();
    }
  }

  brushSizeChange = (e) => {
    this.brushPanelRef.current.setBrushSize(e.target.value);
    this.setState({
      brushSize: e.target.value,
    })
  }

  opacityChange = (e) => {
    this.brushPanelRef.current.setOpacity(e.target.value);
    this.setState({
      opacity: e.target.value,
    })
  }

  clearScene = () => {
    var ctx = this.canvasRef.current.getContext('2d');
    ctx.globalAlpha = 1.0;
    ctx.fillStyle = "white";
    ctx.fillRect(0,0,ctx.canvas.width, ctx.canvas.height);
    ctx = this.drawingToDate.getContext('2d');
    ctx.fillStyle = "white";
    ctx.fillRect(0,0,ctx.canvas.width, ctx.canvas.height);
  }

  downloadImage = () => {
    var link = document.createElement('a');
    link.download = 'filename.png';
    link.href = document.getElementById('mainCanvas').toDataURL()
    link.click();
  }

  colorChange = (e) => {
    this.brushPanelRef.current.setBrushColor(e.target.value);
    this.setState({
      color: e.target.value,
    })
    console.log(e.target.value);
  }

  keyDown = (event) => {
    var brushSize = this.state.brushSize;

    var keydown = (event.key === "[" || event.key === "]");
    switch (event.key) {
      case "]":
        // increase brushSize
        // console.log(event.key)
        if (brushSize < 5) brushSize += 1;
        else if (brushSize < 10) brushSize += 2;
        else if (brushSize < 50) brushSize += 5;
        
        if (brushSize > 50) brushSize = 50;
        break;
      case "[":
        if (brushSize < 5) brushSize -= 1;
        else if (brushSize < 10) brushSize -= 2;
        else if (brushSize <= 50) brushSize -= 5;
        if (brushSize <= 0) brushSize = 1;
        break;
      default:
        break;
    }

    if (keydown) {
      this.brushPanelRef.current.setBrushSize(brushSize);
      this.setState({
        brushSize: brushSize,
      })
    }
  }

  render() {
    const {
      width,
      height, 
    } = this.props;
    
    const buttonStyle ={
      float: "left",
      height: "3em",
      width: "auto",
      margin:"1em"
    }

    return (
      <div > 
      <canvas
        id = "mainCanvas"
        style={{
          margin: "1.5em",
          cursor: "none",
        }}
        ref={this.canvasRef} 
        width={width} 
        height={height} 
        onMouseDown={this.mouseDown} 
        onTouchStart={this.mouseDown} 
        onMouseMove={this.mouseMove} 
        onTouchMove={this.mouseMove}
        onMouseUp={this.mouseUp} 
        onTouchEnd={this.mouseUp}
        onKeyDown={this.keyDown}
        
        onMouseOut={() => {
          if (mouseDown === 1) {
            this.endDrawState();
          }
        }}
        
        onMouseEnter={ (e) => {
          if (mouseDown === 1) {
            console.log("hi!!!");
            this.setState({
              mouseOut : false,
            });
            this.draw(e);
          }
        }}
        tabIndex = "-1"
        />

      <UIPanel 
        ref={this.brushPanelRef} 
        onBrushSizeChange={this.brushSizeChange}
        onOpacityChange={this.opacityChange}
        onColorChange={this.colorChange}
        brushSize={this.state.brushSize}
        opacity={this.state.opacity}
        color={this.state.color} />

        <button style={buttonStyle} onClick={this.clearScene}>clear</button>
        <button style={buttonStyle} onClick={this.downloadImage}>download</button>
      </div>
    );  
  }
}

export default CanvasController;