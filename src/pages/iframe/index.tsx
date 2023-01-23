import React, { useState, useEffect, useCallback } from "react";
import Sandbox from "@/components/sandbox";
import "./index.less";

export default () => {
  const [codes, setCodes] = useState<any>([]);

  const messageHandle = useCallback(
    (e: any) => {
      const { type = "", data = "" } = e.data || {};
      if (["codeIframe", "codes"].indexOf(type) < 0) {
        return;
      }
      if (type === "codes") {
        setCodes(data);
      }
    },
    [codes]
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
      <Sandbox codes={codes} />
    </div>
  );
};
