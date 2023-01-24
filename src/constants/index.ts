export const cdnPrefix = "https://unpkg.com"; // https://cdn.jsdelivr.net/npm, https://unpkg.com
export const editorSaveJsxKey = "editor.code.jsx";
export const editorSaveCssKey = "editor.code.css";

// 默认组件jsx入口代码
export const defaultCompJsx = `import React, { useState } from 'react';
import lodash from 'lodash';
import dayjs from 'dayjs';
import { Button } from 'antd';
import "antd@4.24.7/dist/antd.css";
import '/index.css';

export default (props) => {
  const [count, setCount] = useState(0);
  console.log('jinlaile1111111', Button);

  return (
    <div className="wrapper">
      <h1>HolyCow, My God!</h1>
      {JSON.stringify(lodash.get(window, 'location.href'))}
      <div>
        <button onClick={() => {
          setCount(count + 1);
        }}>点击Add: {count}</button>
        <Button>进来了</Button>
      </div>
    </div>
  );
}
`;

// 默认组件内置css
export const defaultCompCss = `.wrapper {
  padding: 20px;
  background: burlywood;
}
`;
