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
    }
    this.brushSizePreviewRef = React.createRef();

    this.opacitySliderRef = React.createRef();
    this.brushSizeSliderRef = React.createRef();
    this.colorSliderRef = React.createRef();
  }

  onComponentDidMount() {
    this.setState({
      brushSize: this.props.brushSize,
      opacity: this.props.opacity,
      color: this.props.color
    });
  }

  setBrushSize(num) {
    this.setState({
      brushSize: num,
    });
    this.brushSizePreviewRef.current.setBrushSize(num);
    this.brushSizeSliderRef.current.update(num);
  }

  setOpacity(num) {
    this.setState({
      opacity: num,
    });
    this.brushSizePreviewRef.current.setOpacity(num);
    this.opacitySliderRef.current.update(num);
  }

  setBrushColor(num) {
    this.setState({
      color: num,
    });
    this.brushSizePreviewRef.current.setColor(num);
    this.colorSliderRef.current.update(num);
  }

  render() {
    return (
      <div>
        <Slider 
          name="size"
          ref={this.brushSizeSliderRef} 
          value={this.state.brushSize} 
          min="1" max="50" stepSize="0.5"
          onChange={this.props.onBrushSizeChange}>
        </Slider>
        <Slider 
          name="opacity"
          ref={this.opacitySliderRef} 
          value={this.state.opacity} 
          onChange={this.props.onOpacityChange}>
        </Slider>
        <Slider 
          name="grey"
          ref={this.colorSliderRef} 
          value={this.state.color}
          min="0" max="255" stepSize="1"
          onChange={this.props.onColorChange}>
        </Slider>
        <BrushSizePreview 
          ref={this.brushSizePreviewRef}
          brushSize={this.state.brushSize}
          opacity={this.state.opacity}
          onChange={this.props.onBrushSizeChange}
          color={this.state.color}
        />
      </div>
    );
  }
}

export default UIPanel;