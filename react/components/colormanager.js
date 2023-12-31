function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
class ColorManager extends React.PureComponent {
  constructor(props) {
    super(props);
    _defineProperty(this, "currentPalette", null);
    _defineProperty(this, "_onClick", type => {
      this.setState({
        selectedColor: type
      });
    });
    _defineProperty(this, "_onChange", e => {
      let colorPicked = e.target.value;
      this._setColor('--' + this.state.selectedColor, colorPicked);
    });
    _defineProperty(this, "_setColor", (type, color) => {
      document.documentElement.style.setProperty(type, color);
      let newPalette = this.currentPalette;
      if (type === '--highlight') {
        newPalette.Highlight = color;
        this.setState({
          highlight: color
        });
      } else if (type === '--darken') {
        newPalette.Darken = color;
        this.setState({
          darken: color
        });
      } else if (type === '--general') {
        newPalette.General = color;
        this.setState({
          general: color
        });
      } else if (type === '--contrast') {
        newPalette.Contrast = color;
        this.setState({
          contrast: color
        });
      }
      this.currentPalette = newPalette;
    });
    _defineProperty(this, "_activePanel", () => {
      this.setState({
        showPanel: true
      });
    });
    _defineProperty(this, "_deactivePanel", () => {
      if (!this.state.showClickedAnimation) {
        this.setState({
          showPanel: false
        });
      }
    });
    _defineProperty(this, "_saveColors", () => {
      // console.log(this.state.currentPalette) // Add a cool animation with setinterval later :-)
      // Send palette to server to save (Server is aware what is currently playing)
      if (this.currentPalette) {
        window.electronAPI.handlePaletteSave(this.currentPalette);
        setTimeout(() => {
          this.setState({
            showClickedAnimation: false,
            showPanel: false
          });
        }, 600);
        this.setState({
          showClickedAnimation: true
        });
      }
    });
    this.state = {
      highlight: getComputedStyle(document.documentElement).getPropertyValue('--highlight').trim(),
      darken: getComputedStyle(document.documentElement).getPropertyValue('--darken').trim(),
      general: getComputedStyle(document.documentElement).getPropertyValue('--general').trim(),
      contrast: getComputedStyle(document.documentElement).getPropertyValue('--contrast').trim(),
      selectedColor: null,
      showPanel: false,
      showClickedAnimation: false
    };
  }
  componentDidMount() {
    window.electronAPI.onPalette((e, palette) => {
      let highlight = palette.Highlight;
      let darken = palette.Darken;
      let general = palette.General;
      let contrast = palette.Contrast;
      this.currentPalette = palette;
      this.setState({
        highlight: highlight,
        darken: darken,
        general: general,
        contrast: contrast
      });
      this._setColor('--highlight', highlight);
      this._setColor('--darken', darken);
      this._setColor('--general', general);
      this._setColor('--contrast', contrast);
    });

    // Grab the "basic" colors
    let highlight = getComputedStyle(document.documentElement).getPropertyValue('--highlight').trim();
    let darken = getComputedStyle(document.documentElement).getPropertyValue('--darken').trim();
    let general = getComputedStyle(document.documentElement).getPropertyValue('--general').trim();
    let contrast = getComputedStyle(document.documentElement).getPropertyValue('--contrast').trim();
    this.setState({
      highlight: highlight,
      darken: darken,
      general: general,
      contrast: contrast
    });
  }
  render() {
    // #colors = invisible, to trigger button events
    let clickedClass = this.state.showClickedAnimation ? 'clicked' : '';
    clickedClass += this.state.showPanel ? '' : ' hidden';
    return /*#__PURE__*/React.createElement("div", {
      onMouseOver: this._activePanel,
      onMouseLeave: this._deactivePanel,
      id: "colors"
    }, /*#__PURE__*/React.createElement("div", {
      onClick: this._saveColors,
      className: clickedClass,
      id: "color-buttons"
    }, "\u2764"), /*#__PURE__*/React.createElement("div", {
      id: "color-manager"
    }, /*#__PURE__*/React.createElement("div", {
      id: "color-panels"
    }, /*#__PURE__*/React.createElement("input", {
      value: this.state.highlight,
      type: "color",
      onChange: this._onChange,
      onClick: () => this._onClick('highlight'),
      className: "color-box",
      id: "highlight"
    }), /*#__PURE__*/React.createElement("input", {
      value: this.state.darken,
      type: "color",
      onChange: this._onChange,
      onClick: () => this._onClick('darken'),
      className: "color-box",
      id: "darken"
    }), /*#__PURE__*/React.createElement("input", {
      value: this.state.general,
      type: "color",
      onChange: this._onChange,
      onClick: () => this._onClick('general'),
      className: "color-box",
      id: "general"
    }), /*#__PURE__*/React.createElement("input", {
      value: this.state.contrast,
      type: "color",
      onChange: this._onChange,
      onClick: () => this._onClick('contrast'),
      className: "color-box",
      id: "contrast"
    }))));
  }
}
export default ColorManager;