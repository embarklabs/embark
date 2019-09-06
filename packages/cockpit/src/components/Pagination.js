import React from 'react';
import {Pagination as RPagination, PaginationItem, PaginationLink} from 'reactstrap';
import PropTypes from 'prop-types';

const NB_PAGES_MAX = 8;

const Pagination = ({currentPage, numberOfPages, changePage}) => {
  let max = currentPage + NB_PAGES_MAX / 2;
  if (max > numberOfPages) {
    max = numberOfPages;
  }
  let i = max - NB_PAGES_MAX;
  if (i < 1) {
    i = 1;
  }
  const pageNumbers = [];
  for (i; i <= max; i++) {
    pageNumbers.push(i);
  }

  return (
    <RPagination aria-label="Explorer navigation" className="mt-4 mb-0 float-right">
      <PaginationItem disabled={currentPage <= 1}>
        <PaginationLink previous href="#" onClick={(e) => {
          e.preventDefault();
          changePage(currentPage - 1);
        }}/>
      </PaginationItem>
      {pageNumbers.map(number => (<PaginationItem active={currentPage === number} key={'page-' + number}>
        <PaginationLink href="#" onClick={(e) => {
          e.preventDefault();
          changePage(number);
        }}>
          {number}
        </PaginationLink>
      </PaginationItem>))}
      <PaginationItem disabled={currentPage >= numberOfPages}>
        <PaginationLink next href="#" onClick={(e) => {
          e.preventDefault();
          changePage(currentPage + 1);
        }}/>
      </PaginationItem>
    </RPagination>
  );
};

Pagination.propTypes = {
  numberOfPages: PropTypes.number,
  currentPage: PropTypes.number,
  changePage: PropTypes.func
};

export default Pagination;
