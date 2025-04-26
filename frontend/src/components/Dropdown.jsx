import React, { useState, useRef, useEffect } from 'react';
import { FaCaretDown } from 'react-icons/fa6';

const LINE_ICON_FILE = { "0": "placeholder",
  "1": "1-digit", "2": "2-digit", "3": "3-digit", "4": "4-digit", "5": "5-digit", "6": "6-digit", "7": "7-digit",
  "A": "a-letter", "B": "b-letter", "C": "c-letter", "D": "d-letter", "E": "e-letter", "F": "f-letter", "G": "g-letter",
  "j": "j-letter", "l": "l-letter", "m": "m-letter", "n": "n-letter", "q": "q-letter", "r": "r-letter", "w": "w-letter", "z": "z-letter"
};

export default function Dropdown({ label = "Select", items = [], onSelect = "0" }) {
  const [isOpen, setIsOpen] = useState(false);
  const [icon, setIcon] = useState('placeholder');
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClick = (item) => {
    onSelect(item);
    setIsOpen(false);
    const iconFound = LINE_ICON_FILE[item];

    if (iconFound) {
      setIcon(iconFound);
    }
  };

  return (
    <div ref={dropdownRef} className="relative inline-block text-left">
      <button
        onClick={() => setIsOpen(prev => !prev)}
        className="flex items-center gap-2 bg-white border border-gray-300 rounded-sm px-4 py-2 shadow hover:bg-gray-50 focus:outline-none"
      >
        <div
          style={{ backgroundImage: `url(/assets/subway_icons/${icon}.256x256.png)` }}
          className="w-6 h-6 bg-cover"
        ></div>
        {label}
        <FaCaretDown />
      </button>

      {isOpen && (
        <ul className="max-h-40 overflow-y-auto border rounded shadow-inner absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded shadow-lg">
          {items.map((item, index) => (
            <li
              key={index}
              className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
              onClick={() => handleClick(item)}
            >
              {item.label || item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
