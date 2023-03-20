import React, { useState } from "react";
import { Button } from "antd";

export default () => {
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
};
