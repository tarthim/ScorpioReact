function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

class ColorPopup extends React.PureComponent {
  constructor(props) {
    super(props);

    _defineProperty(this, "_onChange", event => {
      this.setState({
        value: event.target.value
      }); // New color selected

      this._saveNewColor(event.target.value);
    });

    _defineProperty(this, "_onKeyDown", e => {
      if (e.key === 'Enter') {
        if (this.state.value) {
          this._saveNewColor(this.state.value);

          this.props.setSelectedColor(null);
        }
      } else if (e.key === 'Escape') {
        console.log('?');
        this.props.setSelectedColor(null);
      }
    });

    this.state = {
      value: null
    };
  }

  _saveNewColor(color) {
    let selectedColor = this.props.selectedColor;

    if (selectedColor) {
      this.props.setColor('--' + selectedColor, color);
    }
  }

  render() {
    // Get current selected color :-)
    let color = getComputedStyle(document.documentElement).getPropertyValue('--' + this.props.selectedColor);
    color = color.trim();
    console.log(color);
    return this.props.selectedColor && /*#__PURE__*/React.createElement("input", {
      id: "color-popup",
      onKeyDown: this._onKeyDown,
      onChange: this._onChange,
      type: "color",
      defaultValue: color
    });
  }

}

export default ColorPopup;