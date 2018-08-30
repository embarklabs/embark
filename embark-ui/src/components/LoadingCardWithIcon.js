/* eslint {jsx-a11y/anchor-has-content:"off"} */
import React from 'react';
import PropTypes from 'prop-types';
import {Card, Icon, Dimmer} from 'tabler-react';
import classNames from 'classnames';

class LoadingCardWithIcon extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      errorsCollapsed: false,
      warningsCollapsed: false,
      errorsFullscreen: false,
      warningsFullscreen: false
    };
  }

  _onToggle(e, type) {
    const className = e.currentTarget.parentElement.className.replace('card-options', '').replace(' ', '');
    const updatedState = {};
    updatedState[className + type] = !(this.state[className + type]);
    this.setState(updatedState);
  }

  render() {
    const {
      color,
      className,
      iconName,
      headerTitle,
      isLoading,
      body,
      showCardOptions = true,
      cardOptionsClassName} = this.props;

    const isFullscreen = Boolean(this.state[cardOptionsClassName + 'Fullscreen']);
    const classes = classNames(className, {
      'card-fullscreen': showCardOptions && Boolean(this.state[cardOptionsClassName + 'Fullscreen']),
      'card-collapsed': showCardOptions && Boolean(this.state[cardOptionsClassName + 'Collapsed']) && !isFullscreen
    });

    return (
      <Card
        statusColor={color}
        statusSide="true"
        className={classes}
        isCollapsible={showCardOptions}
        isFullscreenable={showCardOptions}>
        <Card.Header>
          <Card.Title color={color}>{iconName && <Icon name={iconName} className="mr-1" />}{headerTitle}</Card.Title>
          {showCardOptions &&
            <Card.Options className={cardOptionsClassName}>
              <Card.OptionsItem key="0" type="collapse" icon="chevron-up" onClick={(e) => this._onToggle(e, 'Collapsed')} />
              <Card.OptionsItem key="1" type="fullscreen" icon="maximize" onClick={(e) => this._onToggle(e, 'Fullscreen')} />
            </Card.Options>
          }
        </Card.Header>
        <Card.Body>
          <Dimmer active={isLoading ? "active" : ""} loader>
            {body}
          </Dimmer>
        </Card.Body>
      </Card>
    );
  }
}
LoadingCardWithIcon.propTypes = {
  color: PropTypes.string.isRequired,
  className: PropTypes.string.isRequired,
  iconName: PropTypes.string,
  headerTitle: PropTypes.any,
  isLoading: PropTypes.bool.isRequired,
  body: PropTypes.node,
  showCardOptions: PropTypes.bool,
  onOptionToggle: PropTypes.func,
  cardOptionsClassName: PropTypes.string
};

export default LoadingCardWithIcon;
