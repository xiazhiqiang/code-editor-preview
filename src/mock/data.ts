import { babelTransform, runCode, moduleDeps } from "../components/sandbox/mod";

export const normalReactCompCode = `
import React, { useState } from 'react';
import lodash from 'lodash';
import dayjs from 'dayjs';
import { Button } from 'antd';

export default (props) => {
  const [count, setCount] = useState(0);
  console.log('jinlaile1111111', Button);

  return (
    <>
      <h1>HolyCow, My God!</h1>
      {JSON.stringify(lodash.get(window, 'location.href'))}
      <button onClick={() => {
        setCount(count + 1);
      }}>点击Add: {count}</button>
      <Button>进来了</Button>
    </>
  );
}
`;

export function testCode() {
  // React&ES6 代码解析
  let esCode = babelTransform(normalReactCompCode, {
    presets: ["env", "es2015", "react"],
  }).code;
  console.log("esCode", esCode);
  console.log("moduleDeps", moduleDeps);

  // 在线执行模块
  const e = runCode(esCode);
  console.log("ret e", e);
}
