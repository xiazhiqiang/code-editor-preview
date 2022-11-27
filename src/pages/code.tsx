// @ts-nocheck
import React from "react";
import Editor from "../components/editor";
import Sandbox from "@/components/sandbox";
import "./code.less";

export default (props: any) => {
  return (
    <div className="pageContainer">
      <h1>预览Demo</h1>
      <div className="container">
        {/* <div style={{ width: "50%", height: "100%" }}>
          <Editor width="100%" height="100%" />
        </div> */}
        <div style={{ width: "50%" }}>
          <Sandbox />
        </div>
      </div>
    </div>
  );
};
