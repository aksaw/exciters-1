'use strict';

// class LikeButton extends React.Component {
//   constructor(props) {
//     super(props);
//     this.state = { liked: false };
//   }

//   render() {
//     if (this.state.liked) {
//       return 'You liked this.';
//     }

//     return (
//       <button onClick={() => this.setState({ liked: true }) }>
//         Like
//       </button>
//     );
//   }
// }

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var WorldSelector = function (_React$Component) {
    _inherits(WorldSelector, _React$Component);

    function WorldSelector() {
        _classCallCheck(this, WorldSelector);

        return _possibleConstructorReturn(this, (WorldSelector.__proto__ || Object.getPrototypeOf(WorldSelector)).apply(this, arguments));
    }

    _createClass(WorldSelector, [{
        key: "render",
        value: function render() {
            return React.createElement(
                "div",
                { className: "world-selector", tabIndex: 0 },
                React.createElement(WorldTitle, { worldKey: "1", worldName: "Exciters", activeState: "active" }),
                React.createElement(WorldTitle, { worldKey: "2", worldName: "Attractors", activeState: "inactive" }),
                React.createElement(WorldTitle, { worldKey: "3", worldName: "Barcode", activeState: "inactive" })
            );
        }
    }]);

    return WorldSelector;
}(React.Component);

var WorldTitle = function (_React$Component2) {
    _inherits(WorldTitle, _React$Component2);

    function WorldTitle() {
        _classCallCheck(this, WorldTitle);

        return _possibleConstructorReturn(this, (WorldTitle.__proto__ || Object.getPrototypeOf(WorldTitle)).apply(this, arguments));
    }

    _createClass(WorldTitle, [{
        key: "render",
        value: function render() {
            return React.createElement(
                "button",
                { className: "world-title " + this.props.activeState + " " + this.props.worldName, onClick: this.props.onClick },
                React.createElement(
                    "h3",
                    { className: "world-key" },
                    this.props.worldKey
                ),
                React.createElement(
                    "h1",
                    { className: "world-name" },
                    this.props.worldName
                )
            );
        }
    }]);

    return WorldTitle;
}(React.Component);

var domContainer = document.querySelector('#world-selector-container');
ReactDOM.render(React.createElement(WorldSelector, null), domContainer);