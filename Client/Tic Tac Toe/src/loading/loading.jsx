import './loading.css';
import React, { useState, useEffect } from 'react';
const Loading = () => {
  const [value, setValue] = useState(Math.random() > 0.5 ? "X" : "O");

  useEffect(() => {
	const interval = setInterval(() => {
	  setValue(Math.random() > 0.5 ? "X"  : "O");
	}, 1000);
	return () => clearInterval(interval);
  }, []);

  return (
	<section className="container">
	  <div className="square">{value}</div>
	  <div className="infinite-scroll"></div>
	</section>
  );
};

export default Loading;