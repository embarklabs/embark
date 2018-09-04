import React from 'react';
import PropTypes from 'prop-types';
import {Card, Icon} from 'tabler-react';
import ContractFunctions from '../components/ContractFunctions';

const TextEditorContractDeploy = (props) => {
  const name = Object.keys(props.result)[0];
  const profile = {
    name,
    methods: props.result[name].abiDefinition
  };
  return (
    <Card statusColor="success"
          statusSide
          className="success-card">
      <Card.Header>
        <Card.Title color="success">
          <Icon name="check" className="mr-1" />
          Deploy Contract
        </Card.Title>
      </Card.Header>
      <Card.Body>
        <ContractFunctions contractProfile={profile}
                           contractFunctions={props.contractDeploys}
                           onlyConstructor
                           postContractFunction={props.postContractDeploy}/>
      </Card.Body>
    </Card>
  );
};

TextEditorContractDeploy.propTypes = {
  result: PropTypes.object,
  postContractDeploy: PropTypes.func,
  contractDeploys: PropTypes.array
};

export default TextEditorContractDeploy;
