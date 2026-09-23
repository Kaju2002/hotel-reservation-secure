import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const PackagePage = () => {
  const [packages, setPackages] = useState([]);
  const navigate = useNavigate();  // Use the React Router's navigate hook

  useEffect(() => {
    // Fetch the packages from the backend
    const fetchPackages = async () => {
      try {
        const response = await axios.get('/api/package/getPackages');
        setPackages(response.data.packages);
      } catch (error) {
        console.error('Failed to fetch packages', error);
      }
    };

    fetchPackages();
  }, []);

  // Navigate to the package details page
  const handleMoreInfoClick = (id) => {
    navigate(`/packages/${id}`);
  };

  return (
    <div className="pkg_container">
      {packages.map(pkg => (
        <div key={pkg.packageId} className="pkg_card">
          <img className="pkg_image" src={pkg.packageImage} alt={pkg.packageName} />
          <div className="pkg_info">
            <h2 className="pkg_title">{pkg.packageName}</h2>
            <p className="pkg_size">Size: {pkg.size} Person</p>
          </div>
          <div className="pkg_footer">
            <span className="pkg_price">From Rs: {pkg.price}</span>
            <button
              className="pkg_button"
              onClick={() => handleMoreInfoClick(pkg._id)}
            >
              More Info
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default PackagePage;
