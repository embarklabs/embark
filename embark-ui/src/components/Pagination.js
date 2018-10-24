import React from 'react';
import {Pagination, PaginationItem, PaginationLink} from 'reactstrap';
import PropTypes from 'prop-types';

const NB_PAGES_MAX = 8;

const Pages = ({currentPage, numberOfPages, changePage}) => {
  let i = currentPage - NB_PAGES_MAX / 2;
  if (i < 1) {
    i = 1;
  }
  let max = i + NB_PAGES_MAX - 1;
  if (max > numberOfPages) {
    max = numberOfPages;
  }
  const pageNumbers = [];
  for (i; i <= max; i++) {
    pageNumbers.push(i);
  }

  return (
    <Pagination aria-label="Page navigation example" className="mt-4 mb-0 float-right">
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
    </Pagination>
  );
};

Pages.propTypes = {
  numberOfPages: PropTypes.number,
  currentPage: PropTypes.number,
  changePage: PropTypes.func
};

export default Pages;
