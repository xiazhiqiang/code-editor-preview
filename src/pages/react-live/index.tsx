import * as React from "react";
import * as antd from "antd";
import { LiveProvider, LiveEditor, LiveError, LivePreview } from "react-live";

let code = `
() => {
  const [count, setCount] = useState(0);

  return (
    <div>
      <Button
        onClick={() => {
          setCount(count + 1);
        }}
      >
        点击{count}
      </Button>
    </div>
  );
}
`;

/**
 * react-live demo
 * 参考：https://github.com/FormidableLabs/react-live
 */
export default () => {
  return (
    <LiveProvider code={code} scope={{ ...React, ...antd }}>
      <LiveEditor />
      <LiveError />
      <LivePreview />
    </LiveProvider>
  );
};
