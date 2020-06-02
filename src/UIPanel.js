import React from 'react';
import BrushSizePreview from './BrushSizePreview';
import Slider from './Slider';
import './UI.css'

class UIPanel extends React.Component {
  constructor(props){
    super(props)
    this.state = {
      brushSize: props.brushSize,
      opacity: props.opacity,
      color: props.color,
      refreshBrushPreview: false
    }
    this.brushSizePreviewRef = React.createRef()
  }

  setBrushSize(num) {
    this.brushSizePreviewRef.current.setBrushSize(num);
    this.setState({brushSize:num});
  }

  setOpacity(num) {
    this.brushSizePreviewRef.current.setOpacity(num);
  }

  setBrushColor(num) {
    this.brushSizePreviewRef.current.setColor(num);
  }

  render() {
    return (
      <div>
        <Slider 
          name="size"
          value={this.props.brushSize} 
          min="1" max="50" stepSize="1"
          onChange={this.props.onBrushSizeChange} />
        <Slider 
          name="opacity"
          value={this.props.opacity}
          min="0" max="1" stepSize="0.01"
          onChange={this.props.onOpacityChange} />
        <Slider 
          name="color" // color
          value={this.props.color}
          min="0" max="255" stepSize="1"
          onChange={this.props.onColorChange} />
        <BrushSizePreview 
          ref={this.brushSizePreviewRef}
          brushSize={this.props.brushSize}
          opacity={this.props.opacity}
          color={this.props.color}
        />
      </div>
    );
  }
}

export default UIPanel;