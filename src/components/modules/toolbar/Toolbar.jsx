import React from "react";
import { FaBold, FaItalic, FaUnderline } from "react-icons/fa";
import { IoLinkSharp } from "react-icons/io5";

const Toolbar = ({
  element, setElement,
  fontSize, setFontSize,
  fontFamily, setFontFamily,
  textAlign, setTextAlign,
  bold, setBold,
  italic, setItalic,
  underline, setUnderline,
  isLink, setIsLink,
  insertIndex, setInsertIndex,
  elementsLength,
  addElement,
  startImageUpload,
  clearAll,
  editingIndex,
}) => {
  const fontsizeItem = [
    "10", "11", "12", "14", "16", "18", "20", "22", "24", "26", "28", "36", "48", "72",
  ];

  return (
    <div className="flex gap-2 flex-wrap mb-4 items-center">
      <div className="bg-hover-100 outline-0 text-blue-120 rounded-lg px-2">
        <select
          className="outline-0 rounded p-1"
          value={element}
          onChange={(e) => setElement(e.target.value)}
        >
          <option value="p">متن ساده</option>
          <option value="h1">h1</option>
          <option value="h2">h2</option>
          <option value="h3">h3</option>
          <option value="h4">h4</option>
          <option value="h5">h5</option>
          <option value="h6">h6</option>
          <option value="ul">لیست</option>
        </select>
      </div>

      <div className="bg-hover-100 text-blue-120 rounded-lg px-2">
        <select
          className="outline-0 rounded p-1"
          value={fontSize}
          onChange={(e) => setFontSize(e.target.value)}
        >
          {fontsizeItem.map((item) => (
            <option key={item} value={item}>
              {item}px
            </option>
          ))}
        </select>
      </div>

      <div className="bg-hover-100 text-blue-120 rounded-lg px-2">
        <select
          className="outline-0 rounded p-1"
          value={fontFamily}
          onChange={(e) => setFontFamily(e.target.value)}
        >
          <option value="Estedad">Estedad</option>
        </select>
      </div>

      <div className="bg-hover-100 text-blue-120 rounded-lg px-2">
        <select
          className="outline-0 rounded p-1"
          value={textAlign}
          onChange={(e) => setTextAlign(e.target.value)}
        >
          <option value="right">راست‌چین</option>
          <option value="center">وسط‌چین</option>
          <option value="left">چپ‌چین</option>
        </select>
      </div>

      <div
        className={`w-10 h-10 rounded-lg px-2 flex items-center justify-center cursor-pointer ${
          bold ? "bg-blue-500 text-white" : "bg-hover-100 text-blue-120"
        }`}
        onClick={() => setBold(!bold)}
        title="ضخیم"
      >
        <FaBold />
      </div>

      <div
        className={`w-10 h-10 rounded-lg px-2 flex items-center justify-center cursor-pointer ${
          italic ? "bg-blue-500 text-white" : "bg-hover-100 text-blue-120"
        }`}
        onClick={() => setItalic(!italic)}
        title="کج"
      >
        <FaItalic />
      </div>

      <div
        className={`w-10 h-10 rounded-lg px-2 flex items-center justify-center cursor-pointer ${
          underline ? "bg-blue-500 text-white" : "bg-hover-100 text-blue-120"
        }`}
        onClick={() => setUnderline(!underline)}
        title="زیرخط"
      >
        <FaUnderline />
      </div>

      <div
        className={`w-10 h-10 rounded-lg px-2 flex items-center justify-center cursor-pointer ${
          isLink ? "bg-blue-500 text-white" : "bg-hover-100 text-blue-120"
        }`}
        onClick={() => setIsLink(!isLink)}
        title="لینک"
      >
        <IoLinkSharp />
      </div>

      <label
        htmlFor="image-upload"
        className="bg-green-500 text-white px-2 rounded cursor-pointer"
        title="افزودن عکس"
      >
        عکس +
      </label>
      <input
        id="image-upload"
        type="file"
        accept="image/*"
        onChange={startImageUpload}
        className="hidden"
      />

      <input
        type="number"
        min="0"
        max={elementsLength}
        value={insertIndex}
        onChange={(e) => setInsertIndex(e.target.value)}
        placeholder={`ایندکس درج (0 تا ${elementsLength})`}
        className="outline-0 border-2 border-slate-300 rounded p-1 w-28"
        title="اگر می‌خواهید در جای خاصی درج شود این مقدار را وارد کنید"
      />

      <button
        className="bg-blue-500 text-white px-2 rounded"
        onClick={addElement}
      >
        {editingIndex !== null ? "ویرایش" : "افزودن"}
      </button>

      <button
        className="bg-red-500 text-white px-2 rounded"
        onClick={clearAll}
      >
        پاک کردن همه
      </button>
    </div>
  );
};

export default Toolbar;
