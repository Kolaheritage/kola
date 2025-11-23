import React from 'react';
import { useParams } from 'react-router-dom';

const ContentDetail: React.FC = () => {
  const { contentId } = useParams<{ contentId: string }>();

  return (
    <div className="page-container">
      <h1>Content: {contentId}</h1>
      <p>Content detail page - to be implemented in HER-40</p>
    </div>
  );
};

export default ContentDetail;
