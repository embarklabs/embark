import React from 'react';
import {Pagination, PaginationItem, PaginationLink} from 'reactstrap';
import PropTypes from 'prop-types';

const Pages = ({currentPage, numberOfPages, changePage}) => {
  const paginationItems = [];
  for (let i = 1; i <= numberOfPages; i++) {
    paginationItems.push(<PaginationItem active={currentPage === i} key={'page-' + i}>
      <PaginationLink href="#" onClick={(e) => {
        e.preventDefault();
        changePage(i);
      }}>
        {i}
      </PaginationLink>
    </PaginationItem>);
  }

  return (
    <Pagination aria-label="Page navigation example">
      <PaginationItem>
        <PaginationLink previous href="#"/>
      </PaginationItem>
      {paginationItems}
      <PaginationItem>
        <PaginationLink next href="#"/>
      </PaginationItem>
    </Pagination>
  );
};

Pages.propTypes = {
  numberOfPages: PropTypes.number,
  currentPage: PropTypes.number,
  changePage: PropTypes.func
};

export default Pages;
