import React from 'react';
import { useParams } from 'react-router-dom';

const Profile: React.FC = () => {
  const { username } = useParams<{ username: string }>();

  return (
    <div className="page-container">
      <h1>Profile: {username}</h1>
      <p>User profile page - to be implemented in HER-53</p>
    </div>
  );
};

export default Profile;
