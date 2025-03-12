import React, { useState, useEffect } from "react";

function UpdateIcons({ isGarbage, isRecyclable, isCompost }) {
  const [garbageClass, setGarbageClass] = useState(""); //connect useState hooks to garbageClass
  const [recycleClass, setRecycleClass] = useState("");
  const [compostClass, setCompostClass] = useState("");

  useEffect(() => {
    setGarbageClass(isGarbage ? "fade-in" : "fade-out"); //if isgarbage  is true: fade in, else fade out.
  }, [isGarbage]);

  useEffect(() => {
    setRecycleClass(isRecyclable ? "fade-in" : "fade-out");
  }, [isRecyclable]);

  useEffect(() => {
    setCompostClass(isCompost ? "fade-in" : "fade-out");
  }, [isCompost]);

  return ( //
    <div className="update-icons">
      <div className="icon-container">
        <img src="/label_images/garbage-icon-none.png" className="base-icon" alt="No Garbage" />
        <img src="/label_images/garbage-icon.png" className={`overlay-icon ${garbageClass}`} alt="Garbage" /> 
      </div>
      <div className="icon-container">
        <img src="/label_images/rec-icon-none.png" className="base-icon" alt="No Recycle" />
        <img src="/label_images/rec-icon.png" className={`overlay-icon ${recycleClass}`} alt="Recyclable" />
      </div>
      <div className="icon-container">
        <img src="/label_images/compost-icon-none.png" className="base-icon" alt="No Compost" />
        <img src="/label_images/compost-icon.png" className={`overlay-icon ${compostClass}`} alt="Compost" />
      </div>
    </div>
  );
}

export default UpdateIcons;
