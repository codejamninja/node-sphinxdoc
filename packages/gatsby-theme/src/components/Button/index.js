import './index.scss';
import React from 'react';
import styled, { withTheme } from 'styled-components';
import Button from './Button';

export default styled(
  withTheme(props => {
    return <Button {...props} />;
  })
)``;
