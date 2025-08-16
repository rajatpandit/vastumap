import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import chakraImage from './vaastu-chakra.png';

function App() {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [rotation, setRotation] = useState(0);
  const [isRotating, setIsRotating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [overlayPosition, setOverlayPosition] = useState({ x: 0, y: 0 });
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [isIdentifying, setIsIdentifying] = useState(false);
  const [points, setPoints] = useState([]);
  const [isMappingComplete, setIsMappingComplete] = useState(false);
  const [centroid, setCentroid] = useState(null);
  const imageRef = useRef(null);

  useEffect(() => {
    if (isMappingComplete) {
      let area = 0;
      let cx = 0;
      let cy = 0;

      for (let i = 0; i < points.length - 1; i++) {
        const p1 = points[i];
        const p2 = points[i + 1];
        const crossProduct = p1.x * p2.y - p2.x * p1.y;
        area += crossProduct;
        cx += (p1.x + p2.x) * crossProduct;
        cy += (p1.y + p2.y) * crossProduct;
      }

      area /= 2;
      cx /= 6 * area;
      cy /= 6 * area;

      setCentroid({ x: cx, y: cy });
    }
  }, [isMappingComplete, points]);

  useEffect(() => {
    if (centroid) {
      setIsOverlayVisible(true);
    }
  }, [centroid]);

  useEffect(() => {
    if (centroid && isOverlayVisible && imageRef.current) {
      const { width, height } = imageRef.current.getBoundingClientRect();
      setOverlayPosition({
        x: centroid.x - width / 2,
        y: centroid.y - height / 2,
      });
    }
  }, [centroid, isOverlayVisible]);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setUploadedImage(URL.createObjectURL(file));
    }
  };

  const handleRotationChange = (event) => {
    let value = parseInt(event.target.value, 10);
    if (isNaN(value)) {
      value = 0;
    }
    // Clamp the value between 0 and 360
    value = Math.max(0, Math.min(360, value));
    setRotation(value);
  };

  const handleMouseDown = (event) => {
    if (event.altKey) {
      setIsRotating(true);
    } else {
      setIsDragging(true);
      setDragStart({
        x: event.clientX - overlayPosition.x,
        y: event.clientY - overlayPosition.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsRotating(false);
    setIsDragging(false);
  };

  const handleMouseMove = (event) => {
    if (isRotating && imageRef.current) {
      const rect = imageRef.current.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const angle = Math.atan2(event.clientY - centerY, event.clientX - centerX) * (180 / Math.PI);
      setRotation(Math.round(angle) < 0 ? Math.round(angle) + 360 : Math.round(angle));
    } else if (isDragging) {
      setOverlayPosition({
        x: event.clientX - dragStart.x,
        y: event.clientY - dragStart.y,
      });
    }
  };

  const handleMouseLeave = () => {
    setIsRotating(false);
    setIsDragging(false);
  };

  const toggleOverlay = () => {
    setIsOverlayVisible(!isOverlayVisible);
  };

  const toggleIdentifying = () => {
    setIsIdentifying(!isIdentifying);
    setPoints([]);
    setIsMappingComplete(false);
    setCentroid(null);
  };

  const handleImageClick = (event) => {
    if (isIdentifying && !isMappingComplete) {
      const rect = event.target.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      if (points.length > 2) {
        const firstPoint = points[0];
        const distance = Math.sqrt(Math.pow(firstPoint.x - x, 2) + Math.pow(firstPoint.y - y, 2));
        if (distance < 10) {
          setPoints([...points, firstPoint]);
          setIsMappingComplete(true);
          return;
        }
      }

      setPoints([...points, { x, y }]);
    }
  };

  return (
    <div className="App">
      <div className="button-panel">
        <button onClick={toggleOverlay}>Overlay Chakra</button>
        <button onClick={toggleIdentifying}>Identify Bhramhasthan</button>
      </div>
      <div className="main-content">
        <h1>Vaastu Chakra Overlay</h1>
        <div>
          <input type="file" accept="image/*" onChange={handleImageUpload} />
        </div>
        <div className="image-container">
          {uploadedImage && (
            <img
              src={uploadedImage}
              alt="Uploaded"
              className="uploaded-image"
              onClick={handleImageClick}
            />
          )}
          {uploadedImage && isOverlayVisible && (
            <img
              ref={imageRef}
              src={chakraImage}
              alt="Vaastu Chakra"
              className="chakra-overlay"
              style={{
                transform: `rotate(${rotation}deg)`,
                left: `${overlayPosition.x}px`,
                top: `${overlayPosition.y}px`,
              }}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            />
          )}
          <svg className="line-container">
            {points.map((point, i) => {
              if (i === 0) {
                return (
                  <circle
                    key={i}
                    cx={point.x}
                    cy={point.y}
                    r="10"
                    stroke="red"
                    strokeWidth="1"
                    fill="white"
                  />
                );
              }

              const prevPoint = points[i - 1];
              const dx = point.x - prevPoint.x;
              const dy = point.y - prevPoint.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              const radius = 10;

              if (distance < radius) {
                return (
                  <circle
                    key={i}
                    cx={point.x}
                    cy={point.y}
                    r="10"
                    stroke="red"
                    strokeWidth="1"
                    fill="white"
                  />
                );
              }

              const startX = prevPoint.x + (dx / distance) * radius;
              const startY = prevPoint.y + (dy / distance) * radius;
              const endX = point.x - (dx / distance) * radius;
              const endY = point.y - (dy / distance) * radius;

              return (
                <React.Fragment key={i}>
                  <line
                    x1={startX}
                    y1={startY}
                    x2={endX}
                    y2={endY}
                    stroke="red"
                    strokeWidth="5"
                  />
                  <circle
                    cx={point.x}
                    cy={point.y}
                    r="10"
                    stroke="red"
                    strokeWidth="1"
                    fill="white"
                  />
                </React.Fragment>
              );
            })}
            {centroid && (
              <circle
                cx={centroid.x}
                cy={centroid.y}
                r="10"
                fill="yellow"
              />
            )}
          </svg>
        </div>
        {isMappingComplete && <p>Mapping of boundary complete</p>}
        {uploadedImage && isOverlayVisible && (
          <div className="controls">
            <label htmlFor="rotation">Rotate Chakra:</label>
            <input
              type="range"
              id="rotation"
              min="0"
              max="360"
              value={rotation}
              onChange={handleRotationChange}
            />
            <input
              type="number"
              id="rotationInput"
              min="0"
              max="360"
              value={rotation}
              onChange={handleRotationChange}
            />
            <span>{rotation}°</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;