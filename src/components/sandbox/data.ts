export const normalReactCompCode = `
import React, { useState } from 'react';
import lodash from 'lodash';
import * as antd from 'antd';

export default (props) => {
  const [count, setCount] = useState(0);
  console.log('jinlaile1111111', antd);

  return (
    <>
      <h1>HolyCow, My God!</h1>
      {JSON.stringify(lodash.get(window, 'location.href'))}
      <button onClick={() => {
        setCount(count + 1);
      }}>点击Add: {count}</button>
    </>
  );
}
`;

// <Button>Hi,button{JSON.stringify(lodash.get(window, 'location.href'))}</Button>
//       <><Select /></>
