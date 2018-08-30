import React from 'react';
import PropTypes from 'prop-types';

const FiddleResults = ({warningsCard, errorsCard, fatalFiddleCard, fatalFiddleDeployCard, deployedContractsCard, fatalErrorCard, forwardedRef}) => (
  <div ref={forwardedRef}>
    {fatalErrorCard}
    {fatalFiddleCard}
    {fatalFiddleDeployCard}
    {deployedContractsCard}
    {errorsCard}
    {warningsCard}
  </div>
);

FiddleResults.propTypes = {
  errorsCard: PropTypes.node,
  warningsCard: PropTypes.node,
  fatalFiddleCard: PropTypes.node,
  fatalFiddleDeployCard: PropTypes.node,
  deployedContractsCard: PropTypes.node,
  fatalErrorCard: PropTypes.node,
  forwardedRef: PropTypes.any
};

export default FiddleResults;
