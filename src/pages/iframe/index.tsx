import React, { useState, useEffect, useCallback } from "react";
import Sandbox from "@/components/sandbox";
import "./index.less";

export default (props: any) => {
  const [code, setCode] = useState<string>("");

  const messageHandle = useCallback(
    (e: any) => {
      const { type = "", data = "" } = e.data || {};
      if (type !== "codeIframe") {
        return;
      }
      setCode(data);
    },
    [code]
  );

  // 监听父页面传递过来的数据
  useEffect(() => {
    window.addEventListener("message", messageHandle, false);

    return () => {
      window.removeEventListener("message", messageHandle, false);
    };
  }, [messageHandle]);

  return (
    <div className="container">
      <Sandbox code={code} />
    </div>
  );
};
