import React from 'react';
import PropTypes from 'prop-types';
import {Helmet} from 'react-helmet';
import {PAGE_TITLE_PREFIX} from '../constants';

const PageHead = ({title, description, enabled = true}) => {
  if (!enabled) return null;
  return (
    <Helmet>
      {title && <title>{PAGE_TITLE_PREFIX} - {title}</title>}
      {description && <meta name="description" content={description}/>}
    </Helmet>
  )
};

PageHead.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  enabled: PropTypes.bool
};

export default PageHead;
