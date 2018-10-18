import React from 'react';
import PropTypes from 'prop-types';
import {Card, CardHeader, CardTitle, CardBody} from 'reactstrap';
import FontAwesomeIcon from 'react-fontawesome';

import ContractFunctions from '../components/ContractFunctions';

const TextEditorContractDeploy = (props) => {
  const name = Object.keys(props.result)[0];
  const profile = {
    name,
    methods: props.result[name].abiDefinition
  };
  return (
    <Card className="bg-success">
      <CardHeader>
        <CardTitle>
          <FontAwesomeIcon className="mr-1" name="check"/>
          Deploy Contract
        </CardTitle>
      </CardHeader>
      <CardBody>
        <ContractFunctions contractProfile={profile}
                           contractFunctions={props.contractDeploys}
                           onlyConstructor
                           postContractFunction={props.postContractDeploy}/>
      </CardBody>
    </Card>
  );
};

TextEditorContractDeploy.propTypes = {
  result: PropTypes.object,
  postContractDeploy: PropTypes.func,
  contractDeploys: PropTypes.array
};

export default TextEditorContractDeploy;
