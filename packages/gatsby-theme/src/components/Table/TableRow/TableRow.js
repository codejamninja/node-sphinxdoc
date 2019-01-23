import CarbonTableRow from 'carbon-components-react/es/components/TableRow';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

export default class TableRow extends Component {
  static propTypes = {
    title: PropTypes.string.isRequired
  };

  render() {
    return <CarbonTableRow {...this.props} />;
  }
}