import React from 'react';
import { useParams } from 'react-router-dom';

const CategoryPage = () => {
  const { categoryId } = useParams();
  
  return (
    <div className="page-container">
      <h1>Category: {categoryId}</h1>
      <p>Category page with content grid - to be implemented in HER-32</p>
    </div>
  );
};

export default CategoryPage;