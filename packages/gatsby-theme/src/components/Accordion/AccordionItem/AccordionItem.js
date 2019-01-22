import CarbonAccordionItem from 'carbon-components-react/es/components/AccordionItem';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

export default class AccordionItem extends Component {
  static propTypes = {
    title: PropTypes.string.isRequired
  };

  render() {
    return <CarbonAccordionItem {...this.props} />;
  }
}
